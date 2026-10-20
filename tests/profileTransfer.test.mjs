import assert from 'node:assert/strict';
import test from 'node:test';
import initSqlJs from 'sql.js';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createDatabase } from '../src/database.js';
import { createBackup } from '../src/profileBackup.js';
import { newState, readState, undoWater, achievements, addWater } from '../src/state.js';

const SQL = await initSqlJs();
const profile = { id: 'source', username: 'Source', age: 30, weight: 70, goalLiters: 2.45,
  onboardingComplete: true, salt: 'source-salt', passwordHash: 'a'.repeat(64) };
const key = id => `aguaApp:perfil:${id}`;
const options = () => ({ SQL, indexedDB: new IDBFactory(), legacyStorage: { getItem: () => null, length: 0 } });

test('queued export includes the latest save and restore replaces only destination data across browsers', async () => {
  const source = await createDatabase(options());
  await source.saveProfile(profile, { create: true });
  const state = addWater({ ...newState(), startedOn: '2020-01-01', completedDays: ['2020-01-01'],
    dailyTotals: { '2020-01-01': 0, '2020-01-02': 1250, '2099-01-01': 500 },
    dailyProgress: { '2099-01-01': { totalMl: 500, garrafas: 1, entries: [{ amountMl: 500, container: 'glass' }] } } }, 250.25, 'glass');
  const save = source.saveProgress(key(profile.id), state);
  const exported = source.exportProfile(profile.id);
  await save;
  const backup = await exported;
  assert.equal(backup.progress.totalMl, 250.25);
  const config = options();
  let destination = await createDatabase(config);
  const local = { ...profile, id: 'local', username: 'Destination', age: 50, salt: 'local-salt', passwordHash: 'b'.repeat(64) };
  const other = { ...profile, id: 'other', username: 'Other' };
  await destination.saveProfile(local, { create: true });
  await destination.saveProfile(other, { create: true });
  await destination.saveProgress(key(other.id), { ...newState(), totalMl: 100 });
  await destination.saveProgress('aguaApp', { totalMl: 999 });
  const restored = await destination.restoreProfile(local.id, backup);
  assert.equal(restored.age, 30);
  for (const field of ['id', 'username', 'salt', 'passwordHash']) assert.equal(restored[field], local[field]);
  const loaded = readState(key(local.id), 2, name => destination.readProgress(name));
  assert.equal(loaded.totalMl, 250.25);
  assert.equal(undoWater(loaded).totalMl, 0);
  assert.equal(achievements(loaded).points, 10);
  assert.equal(loaded.dailyTotals['2020-01-01'], 0);
  assert.equal(loaded.dailyTotals['2020-01-02'], 1250);
  assert.equal(Object.hasOwn(loaded.dailyTotals, '2020-01-03'), false);
  assert.equal(loaded.dailyProgress['2099-01-01'].entries[0].container, 'glass');
  await destination.close();
  config.legacyStorage = { length: 0, getItem() { throw new Error('Migration marker was lost'); } };
  destination = await createDatabase(config);
  assert.equal(JSON.parse(destination.readProgress(key(local.id))).totalMl, 250.25);
  assert.equal(JSON.parse(destination.readProgress(key(other.id))).totalMl, 100);
  assert.deepEqual(destination.readProfiles().find(p => p.id === other.id), other);
  assert.equal(JSON.parse(destination.readProgress('aguaApp')).totalMl, 999);
  await destination.close(); await source.close();
});

test('old and future active dates normalize without losing aggregate-only history', async () => {
  const store = await createDatabase(options());
  await store.saveProfile(profile, { create: true });
  for (const date of ['2020-01-02', '2099-01-01']) {
    const backup = createBackup(profile, { ...newState(), data: date, startedOn: '2020-01-01', totalMl: 1250 });
    await store.restoreProfile(profile.id, backup);
    const loaded = readState(key(profile.id), 2, name => store.readProgress(name));
    assert.equal(loaded.dailyTotals[date], 1250);
    assert.deepEqual(loaded.dailyProgress[date].entries, []);
    assert.equal(loaded.totalMl, 0);
  }
  await store.close();
});

test('failed export or restore leaves original data intact and allows retry', async () => {
  const config = options();
  let store = await createDatabase(config);
  await store.saveProfile(profile, { create: true });
  await store.saveProgress(key(profile.id), newState());
  const backup = createBackup({ ...profile, age: 40 }, addWater(newState(), 500));
  const originalPut = IDBObjectStore.prototype.put;
  try {
    IDBObjectStore.prototype.put = function () { throw new DOMException('Storage full', 'QuotaExceededError'); };
    await assert.rejects(store.saveProgress(key(profile.id), addWater(newState(), 100)), /Storage full/);
    await assert.rejects(store.exportProfile(profile.id), /Unsaved/);
    await assert.rejects(store.restoreProfile(profile.id, backup), /Storage full/);
  } finally { IDBObjectStore.prototype.put = originalPut; }
  assert.equal(store.readProfiles()[0].age, 30);
  assert.equal(JSON.parse(store.readProgress(key(profile.id))).totalMl, 0);
  await store.close(); store = await createDatabase(config);
  assert.equal(store.readProfiles()[0].age, 30);
  assert.equal(JSON.parse(store.readProgress(key(profile.id))).totalMl, 0);
  await store.restoreProfile(profile.id, backup);
  assert.equal(store.readProfiles()[0].age, 40);
  assert.equal((await store.exportProfile(profile.id)).progress.totalMl, 500);
  await assert.rejects(store.restoreProfile('missing', backup), /Missing destination/);
  await assert.rejects(store.restoreProfile(profile.id, {}), /invalid/);
  await store.close();
});
