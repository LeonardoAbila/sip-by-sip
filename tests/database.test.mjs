import assert from 'node:assert/strict';
import test from 'node:test';
import initSqlJs from 'sql.js';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createDatabase, initializeDatabase, saveProgress, refreshDatabase } from '../src/database.js';
import { achievements, calendarKey, newState, readState, rewardGoal } from '../src/state.js';
import { completeProfile, hashPassword, readProfiles, registerProfile } from '../src/profiles.js';

const SQL = await initSqlJs();

function legacy(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
  };
}

function options(legacyStorage = legacy()) {
  return { SQL, indexedDB: new IDBFactory(), legacyStorage };
}

function storedFile(indexedDB, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sip-by-sip-sqlite', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => {
      const connection = request.result;
      const transaction = connection.transaction('files', 'readwrite');
      const files = transaction.objectStore('files');
      const operation = data === undefined ? files.get('database') : files.put(data, 'database');
      transaction.oncomplete = () => { connection.close(); resolve(operation.result); };
      transaction.onabort = () => { connection.close(); reject(transaction.error); };
    };
    request.onerror = () => reject(request.error);
  });
}

const profile = { id: 'old-profile', username: "D'água", salt: 'old-salt', passwordHash: 'a'.repeat(64),
  age: 30, weight: 70, goalLiters: 2.45, onboardingComplete: true };
const profileKey = `aguaApp:perfil:${profile.id}`;

test('migration preserves profiles, all progress keys and original backups across reopening', async () => {
  const progress = { ...newState(), totalMl: 1500, garrafas: 3, mlGarrafa: 500, metaLitros: 2.45 };
  const entries = {
    aguaPrototypeProfiles: JSON.stringify([profile]),
    aguaApp: JSON.stringify({ ...newState(), totalMl: 250 }),
    [profileKey]: JSON.stringify(progress),
    'aguaApp:perfil:other-profile': JSON.stringify({ ...newState(), totalMl: 750 }),
    aguaTheme: 'dark',
  };
  const config = options(legacy(entries));
  let store = await createDatabase(config);
  assert.deepEqual(store.readProfiles(), [profile]);
  assert.deepEqual(JSON.parse(store.readProgress(profileKey)), progress);
  assert.equal(JSON.parse(store.readProgress('aguaApp')).totalMl, 250);
  assert.equal(JSON.parse(store.readProgress('aguaApp:perfil:other-profile')).totalMl, 750);
  for (const [key, value] of Object.entries(entries)) assert.equal(config.legacyStorage.getItem(key), value);
  await store.saveProgress(profileKey, { ...progress, totalMl: 2000 });
  await store.close();

  // Stale localStorage backups must not be reimported after the upgrade.
  store = await createDatabase(config);
  assert.equal(JSON.parse(store.readProgress(profileKey)).totalMl, 2000);
  assert.deepEqual(store.readProfiles(), [profile]);
  await store.close();
  const bytes = await storedFile(config.indexedDB);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 15)), 'SQLite format 3');
});

test('new registrations, password hashes, onboarding and progress persist through reopening', async () => {
  const config = options();
  await initializeDatabase(config);
  const registered = await registerProfile('Leonardo', 'test-password');
  assert.equal(registered.onboardingComplete, false);
  assert.equal(registered.passwordHash, await hashPassword('test-password', registered.salt));
  const completed = await completeProfile(registered, 30, 70);
  assert.equal(completed.goalLiters, 2.45);
  const key = `aguaApp:perfil:${registered.id}`;
  await saveProgress(key, { ...newState(), totalMl: 1000, garrafas: 2, metaLitros: 2.45 });

  const reopened = await createDatabase(config);
  assert.deepEqual(reopened.readProfiles(), [completed]);
  const saved = readState(key, 2, key => reopened.readProgress(key));
  assert.equal(saved.totalMl, 1000);
  assert.equal(saved.garrafas, 2);
  assert.equal(saved.metaLitros, 2.45);
  assert.deepEqual(readProfiles(), [completed]);
  await assert.rejects(registerProfile('LEONARDO', 'different'), /Este usuário já existe/);
  await reopened.close();
});

test('SQLite reload preserves daily resets, rewards, settings and profile isolation', async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const state = { ...newState(), data: yesterday.toDateString(), totalMl: 2500,
    garrafas: 10, metaLitros: 2.5, mlGarrafa: 250, startedOn: calendarKey(yesterday) };
  const config = options(legacy({ [profileKey]: JSON.stringify(state) }));
  const store = await createDatabase(config);
  const loaded = readState(profileKey, 2, key => store.readProgress(key));
  assert.equal(loaded.totalMl, 0);
  assert.equal(loaded.garrafas, 0);
  assert.equal(loaded.metaLitros, 2.5);
  assert.equal(loaded.mlGarrafa, 250);
  assert.deepEqual(achievements(loaded), { points: 10, streak: 1, earnedToday: false });
  const completed = rewardGoal({ ...loaded, totalMl: 2500 });
  await store.saveProgress(profileKey, completed);
  await store.close();
  const reopened = await createDatabase(config);
  const saved = readState(profileKey, 2, key => reopened.readProgress(key));
  assert.deepEqual(achievements(saved), { points: 20, streak: 2, earnedToday: true });
  const reset = rewardGoal({ ...saved, totalMl: 0, garrafas: 0 });
  assert.equal(achievements(rewardGoal({ ...reset, totalMl: 2500 })).points, 20);
  assert.equal(readState('aguaApp:perfil:missing', 3, key => reopened.readProgress(key)).metaLitros, 3);
  await reopened.close();
});

test('separate tabs retain unrelated writes and reject duplicate registrations atomically', async () => {
  const config = options();
  const first = await createDatabase(config);
  const second = await createDatabase(config);
  await Promise.all([
    first.saveProgress('aguaApp:perfil:first', { totalMl: 500 }),
    second.saveProgress('aguaApp:perfil:second', { totalMl: 1000 }),
  ]);
  await first.refresh();
  assert.equal(JSON.parse(first.readProgress('aguaApp:perfil:first')).totalMl, 500);
  assert.equal(JSON.parse(first.readProgress('aguaApp:perfil:second')).totalMl, 1000);
  const results = await Promise.allSettled([
    first.saveProfile({ ...profile, id: 'first', username: 'Leo' }, { create: true }),
    second.saveProfile({ ...profile, id: 'second', username: 'LEO' }, { create: true }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(results.find(result => result.status === 'rejected').reason.message, /Este usuário já existe/);
  await first.refresh();
  assert.equal(first.readProfiles().length, 1);
  await Promise.all([first.close(), second.close()]);
});

test('invalid legacy JSON falls back safely without destroying the originals', async () => {
  const backup = legacy({ aguaPrototypeProfiles: '{broken', aguaApp: '{broken',
    'aguaApp:perfil:valid': JSON.stringify({ ...newState(), totalMl: 500 }) });
  const store = await createDatabase(options(backup));
  assert.deepEqual(store.readProfiles(), []);
  assert.equal(store.readProgress('aguaApp'), null);
  assert.equal(JSON.parse(store.readProgress('aguaApp:perfil:valid')).totalMl, 500);
  assert.equal(backup.getItem('aguaApp'), '{broken');
  await store.close();
});

test('a failed migration leaves no committed marker and can be retried', async () => {
  const config = options(legacy({ [profileKey]: JSON.stringify({ ...newState(), totalMl: 750 }) }));
  const originalPut = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () { throw new DOMException('Storage full', 'QuotaExceededError'); };
  try {
    await assert.rejects(createDatabase(config), /Storage full/);
  } finally {
    IDBObjectStore.prototype.put = originalPut;
  }
  assert.equal(await storedFile(config.indexedDB), undefined);
  const retried = await createDatabase(config);
  assert.equal(JSON.parse(retried.readProgress(profileKey)).totalMl, 750);
  await retried.close();
});

test('a failed save keeps the cached data and the write queue accepts a retry', async () => {
  const config = options();
  const store = await createDatabase(config);
  await store.saveProgress(profileKey, { totalMl: 500 });
  const originalPut = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () { throw new DOMException('Storage full', 'QuotaExceededError'); };
  try {
    await assert.rejects(store.saveProgress(profileKey, { totalMl: 1000 }), /Storage full/);
  } finally {
    IDBObjectStore.prototype.put = originalPut;
  }
  assert.equal(JSON.parse(store.readProgress(profileKey)).totalMl, 500);
  await store.saveProgress(profileKey, { totalMl: 1500 });
  await store.close();
  const reopened = await createDatabase(config);
  assert.equal(JSON.parse(reopened.readProgress(profileKey)).totalMl, 1500);
  await reopened.close();
});

test('corrupt SQLite files are reported and never overwritten with defaults', async () => {
  const config = options();
  const corrupt = new Uint8Array([1, 2, 3, 4]);
  await storedFile(config.indexedDB, corrupt);
  await assert.rejects(createDatabase(config));
  assert.deepEqual(await storedFile(config.indexedDB), corrupt);
});

test('login refresh sees profiles registered by another tab', async () => {
  const config = options();
  await initializeDatabase(config);
  const second = await createDatabase(config);
  await second.saveProfile(profile, { create: true });
  assert.deepEqual(readProfiles(), []);
  await refreshDatabase();
  assert.deepEqual(readProfiles(), [profile]);
  await second.close();
});


test('SQLite import errors abort migration instead of marking missing data as imported', async () => {
  const config = options(legacy({ aguaApp: JSON.stringify({ totalMl: 750 }) }));
  const database = new SQL.Database();
  database.run("CREATE TABLE progress (storage_key TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(data = 'blocked'))");
  const original = database.export();
  database.close();
  await storedFile(config.indexedDB, original);
  await assert.rejects(createDatabase(config), /CHECK constraint failed/);
  assert.deepEqual(await storedFile(config.indexedDB), original);
  assert.equal(config.legacyStorage.getItem('aguaApp'), JSON.stringify({ totalMl: 750 }));
});

test('daily totals migrate, persist across reopening and remain isolated by profile', async () => {
  const date = new Date(); date.setDate(date.getDate() - 3);
  const key = calendarKey(date);
  const config = options(legacy({
    'aguaApp:perfil:first': JSON.stringify({ ...newState(), dailyTotals: undefined, data: date.toDateString(), totalMl: 1250 }),
    'aguaApp:perfil:second': JSON.stringify({ ...newState(), dailyTotals: { [key]: 750.25 } }),
  }));
  let store = await createDatabase(config);
  const first = readState('aguaApp:perfil:first', 2, key => store.readProgress(key));
  const second = readState('aguaApp:perfil:second', 2, key => store.readProgress(key));
  assert.equal(first.totalMl, 0);
  assert.deepEqual(first.dailyTotals, { [key]: 1250 });
  assert.deepEqual(second.dailyTotals, { [key]: 750.25 });
  await store.saveProgress('aguaApp:perfil:first', first);
  await store.saveProgress('aguaApp:perfil:second', second);
  await store.close();
  store = await createDatabase(config);
  assert.deepEqual(readState('aguaApp:perfil:first', 2, key => store.readProgress(key)), first);
  assert.deepEqual(readState('aguaApp:perfil:second', 2, key => store.readProgress(key)), second);
  await store.close();
});

test('travel snapshots survive SQLite import, profile switching, save and reopening', async () => {
  const NativeDate = Date;
  const oldZone = process.env.TZ;
  let store;
  try {
    const instant = NativeDate.parse('2026-10-15T01:30:00Z');
    globalThis.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [instant])); }
      static now() { return instant; }
    };
    process.env.TZ = 'Europe/London';
    const { addWater, currentDay, undoWater } = await import('../src/state.js');
    const first = addWater(newState(), 750);
    const second = addWater({ ...newState(), mlGarrafa: 300 }, 300, 'glass');
    const config = options(legacy({
      'aguaApp:perfil:travel-first': JSON.stringify(first),
      'aguaApp:perfil:travel-second': JSON.stringify(second),
    }));
    store = await createDatabase(config);
    process.env.TZ = 'America/Sao_Paulo';
    for (const name of ['travel-first', 'travel-second']) {
      const key = 'aguaApp:perfil:' + name;
      const loaded = readState(key, 2, key => store.readProgress(key));
      assert.equal(loaded.totalMl, 0);
      const updated = addWater(loaded, name === 'travel-first' ? 500 : 250);
      await store.saveProgress(key, updated);
    }
    await store.close();
    store = await createDatabase(config);
    process.env.TZ = 'Europe/London';
    for (const [name, total, previous, container] of [
      ['travel-first', 750, 500, 'bottle'], ['travel-second', 300, 250, 'glass'],
    ]) {
      const key = 'aguaApp:perfil:' + name;
      const loaded = readState(key, 2, key => store.readProgress(key));
      assert.equal(loaded.totalMl, total);
      assert.equal(loaded.entries[0].container, container);
      assert.equal(loaded.dailyTotals['2026-10-14'], previous);
      assert.equal(undoWater(loaded).totalMl, 0);
      assert.strictEqual(currentDay(loaded), loaded);
      await store.saveProgress(key, loaded);
    }
    await store.close();
    store = await createDatabase(config);
    process.env.TZ = 'America/Sao_Paulo';
    assert.equal(readState('aguaApp:perfil:travel-first', 2, key => store.readProgress(key)).totalMl, 500);
    assert.equal(readState('aguaApp:perfil:travel-second', 2, key => store.readProgress(key)).totalMl, 250);
  } finally {
    await store?.close();
    globalThis.Date = NativeDate;
    if (oldZone === undefined) delete process.env.TZ;
    else process.env.TZ = oldZone;
  }
});
