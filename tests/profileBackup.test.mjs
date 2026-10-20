import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackup, serializeBackup, readBackupFile, MAX_BACKUP_BYTES } from '../src/profileBackup.js';
import { newState, calendarKey } from '../src/state.js';

export const sourceProfile = { id: 'source', username: 'Origem', age: 30, weight: 70,
  goalLiters: 2.45, onboardingComplete: true, salt: 'secret-salt', passwordHash: 'a'.repeat(64) };
export function sourceProgress() {
  return { ...newState(), totalMl: 750.25, garrafas: 2,
    entries: [{ amountMl: 500, container: 'bottle' }, { amountMl: 250.25, container: 'glass' }],
    startedOn: '2020-01-01', completedDays: ['2020-01-01'],
    dailyTotals: { '2020-01-01': 0, '2020-01-02': 1250, '2099-01-01': 500 },
    dailyProgress: { '2099-01-01': { totalMl: 500, garrafas: 1, entries: [{ amountMl: 500, container: 'custom' }] } } };
}

test('versioned round trip preserves precise history and strips credentials and extra fields', () => {
  const progress = sourceProgress();
  const backup = createBackup(sourceProfile, { ...progress, secret: true });
  const json = serializeBackup(backup);
  assert.deepEqual(parseBackup(json), backup);
  assert.equal(backup.progress.data, calendarKey());
  assert.deepEqual(backup.progress.entries, progress.entries);
  assert.deepEqual(backup.progress.dailyTotals, progress.dailyTotals);
  assert.equal(Object.hasOwn(backup.progress.dailyTotals, '2020-01-03'), false);
  assert.deepEqual(backup.progress.completedDays, progress.completedDays);
  for (const secret of ['passwordHash', 'secret-salt', '"id"', '"secret"']) assert.equal(json.includes(secret), false);
});

test('rejects damaged, inconsistent and unsupported backup data instead of defaulting', () => {
  const good = createBackup(sourceProfile, sourceProgress());
  const invalid = [
    b => { b.format = 'sqlite'; }, b => { b.version = 2; }, b => { delete b.progress; },
    b => { b.profile.age = 0; }, b => { b.profile.weight = 501; }, b => { b.profile.onboardingComplete = false; },
    b => { b.progress.data = '2026-02-30'; }, b => { b.progress.startedOn = '2099-01-01'; },
    b => { b.progress.totalMl = -1; }, b => { b.progress.totalMl = '750.25'; },
    b => { b.progress.mlGarrafa = 0; }, b => { b.progress.metaLitros = null; },
    b => { b.progress.totalMl = 750.251; }, b => { b.progress.garrafas = 1; },
    b => { b.progress.entries[0].amountMl = 900; }, b => { b.progress.entries[0].container = 'jug'; },
    b => { b.progress.completedDays.push(b.progress.completedDays[0]); },
    b => { b.progress.dailyTotals['2026-02-30'] = 100; },
    b => { b.progress.dailyTotals['2099-01-01'] = 600; },
    b => { b.progress.dailyTotals[b.progress.data] = 1; },
  ];
  for (const mutate of invalid) {
    const value = structuredClone(good); mutate(value);
    assert.throws(() => parseBackup(JSON.stringify(value)), /invalid|version/);
  }
  assert.throws(() => parseBackup('{broken'), /invalid/);
  assert.throws(() => parseBackup('null'), /invalid/);
});

test('checks the size before reading and rejects oversized text', async () => {
  let read = false;
  await assert.rejects(readBackupFile({ size: MAX_BACKUP_BYTES + 1, text() { read = true; } }), /size/);
  assert.equal(read, false);
  assert.throws(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1)), /size/);
  const backup = createBackup(sourceProfile, sourceProgress());
  assert.deepEqual(await readBackupFile({ size: 1, text: async () => serializeBackup(backup) }), backup);
});

test('aggregate-only legacy volume plus new entries remains exportable and undoable', () => {
  const progress = { ...newState(), totalMl: 1750, garrafas: 1,
    entries: [{ amountMl: 500, container: 'bottle' }] };
  const backup = createBackup(sourceProfile, progress);
  assert.equal(parseBackup(serializeBackup(backup)).progress.totalMl, 1750);
});

test('README backup example is a valid version-1 file', async () => {
  const { readFile } = await import('node:fs/promises');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const example = readme.slice(readme.indexOf('## Profile backup format')).match(/```json\n([\s\S]*?)```/)[1];
  assert.equal(parseBackup(example).profile.username, 'Example');
});
