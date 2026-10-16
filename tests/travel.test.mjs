import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import { newState, currentDay, addWater, undoWater, resetWater, readState, achievements } from '../src/state.js';
import { calendarVolume, calendarStatus } from '../src/calendar.js';

const NativeDate = Date;
const originalZone = process.env.TZ;
let instant;
beforeEach(() => {
  instant = NativeDate.parse('2026-10-15T01:30:00Z');
  process.env.TZ = 'America/Sao_Paulo';
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [instant])); }
    static now() { return instant; }
  };
});
afterEach(() => {
  globalThis.Date = NativeDate;
  if (originalZone === undefined) delete process.env.TZ;
  else process.env.TZ = originalZone;
});
const load = state => readState('test', 2, () => JSON.stringify(state));
const travel = (state, zone) => { process.env.TZ = zone; return currentDay(state); };

test('issue 14: eastbound travel retains the departing total', () => {
  const state = addWater(newState(), 750);
  const next = travel(state, 'Europe/London');
  assert.equal(next.totalMl, 0);
  assert.equal(next.dailyTotals['2026-10-14'], 750);
});

test('issue 14: westbound travel retains progress in memory and on reload', () => {
  process.env.TZ = 'Europe/London';
  const state = addWater(newState(), 750);
  const next = travel(state, 'America/Sao_Paulo');
  assert.equal(next.totalMl, 0);
  assert.equal(next.dailyTotals['2026-10-15'], 750);
  assert.equal(load(next).dailyTotals['2026-10-15'], 750);
  assert.equal(load(state).dailyTotals['2026-10-15'], 750);
});

test('migration validates dates, snapshots and date-only labels independently of zone', () => {
  const state = load({ ...newState(), data: '2026-10-13', totalMl: 400,
    dailyProgress: {
      '2026-10-12': { totalMl: 250.25, garrafas: 1, entries: [{ amountMl: 250.25, container: 'glass' }] },
      '2026-02-30': { totalMl: 10 }, '2026-10-10': { totalMl: -1 },
      '2026-10-09': { totalMl: '500' }, '2026-10-08': { totalMl: 0.001 },
      '2026-10-07': { totalMl: 250, garrafas: 1, entries: [{ amountMl: 500 }] },
      '2026-10-06': null,
    } });
  assert.equal(state.dailyTotals['2026-10-13'], 400);
  assert.equal(state.dailyProgress['2026-10-12'].entries[0].container, 'glass');
  assert.deepEqual(state.dailyProgress['2026-10-07'].entries, []);
  for (const key of ['2026-02-30', '2026-10-10', '2026-10-09', '2026-10-08', '2026-10-06']) {
    assert.equal(state.dailyProgress[key], undefined);
  }
  assert.equal(load({ ...newState(), data: 'Mon Feb 30 2026', totalMl: 500 }).totalMl, 0);
  assert.deepEqual(load(state), state);
});

test('round trip restores entries and totals without mixing date-specific counters', () => {
  let state = addWater(newState(), 500);
  state = addWater(state, 250, 'glass');
  state = travel(state, 'Europe/London');
  state = addWater(state, 750);
  assert.strictEqual(currentDay(state), state);
  const october15 = state.entries;
  state = travel(state, 'America/Sao_Paulo');
  assert.equal(state.totalMl, 750);
  assert.equal(state.garrafas, 2);
  assert.equal(state.dailyTotals['2026-10-15'], 750);
  assert.equal(state.dailyTotals['2026-10-14'], undefined);
  assert.deepEqual(state.entries.map(entry => entry.amountMl), [500, 250]);
  state = undoWater(state);
  assert.equal(state.totalMl, 500);
  state = travel(state, 'Europe/London');
  assert.equal(state.totalMl, 750);
  assert.deepEqual(state.entries, october15);
  assert.equal(state.dailyTotals['2026-10-14'], 500);
});

test('midnight, long gaps and month/year boundaries preserve only observed days', () => {
  for (const [from, to] of [
    ['2026-10-15T02:59:59Z', '2026-10-15T03:00:00Z'],
    ['2026-10-15T01:30:00Z', '2026-10-20T12:00:00Z'],
    ['2026-12-31T23:00:00-03:00', '2027-01-01T00:00:00-03:00'],
  ]) {
    instant = NativeDate.parse(from);
    const state = addWater(newState(), 500);
    const key = state.data;
    instant = NativeDate.parse(to);
    const next = currentDay(state);
    assert.equal(next.totalMl, 0);
    assert.deepEqual(Object.values(next.dailyTotals), [500]);
    assert.notEqual(next.data, key);
    assert.strictEqual(currentDay(next), next);
  }
});

test('same-date time-zone changes and daylight-saving jumps do not reset', () => {
  instant = NativeDate.parse('2026-10-15T15:00:00Z');
  let state = addWater(newState(), 250);
  assert.strictEqual(travel(state, 'Europe/London'), state);
  process.env.TZ = 'America/New_York';
  for (const [from, to] of [
    ['2026-03-08T06:59:59Z', '2026-03-08T07:00:00Z'],
    ['2026-11-01T05:59:59Z', '2026-11-01T06:00:00Z'],
  ]) {
    instant = NativeDate.parse(from);
    state = addWater(newState(), 500);
    instant = NativeDate.parse(to);
    assert.strictEqual(currentDay(state), state);
  }
});

test('reset and settings survive revisits while goal rewards remain once per date', () => {
  let state = addWater({ ...newState(), metaLitros: 0.5, mlGarrafa: 750, mlCopo: 300 }, 500);
  state = travel(state, 'Europe/London');
  state = addWater(state, 750);
  assert.equal(achievements(state).points, 20);
  state = travel(state, 'America/Sao_Paulo');
  assert.equal(achievements(state).points, 20);
  state = resetWater(state);
  state = travel(state, 'Europe/London');
  assert.equal(state.totalMl, 750);
  state = travel(state, 'America/Sao_Paulo');
  assert.equal(state.totalMl, 0);
  assert.deepEqual(state.entries, []);
  assert.equal(state.mlGarrafa, 750);
  assert.equal(state.mlCopo, 300);
  assert.equal(state.metaLitros, 0.5);
  state = addWater(state, 500);
  assert.equal(achievements(state).points, 20);
});

test('aggregate-only history restores volume without guessing entries or counts', () => {
  process.env.TZ = 'Europe/London';
  let state = load({ ...newState(), dailyProgress: undefined, dailyTotals: { '2026-10-14': 1250 } });
  state = travel(state, 'America/Sao_Paulo');
  assert.equal(state.totalMl, 1250);
  assert.equal(state.garrafas, 0);
  assert.deepEqual(state.entries, []);
  assert.equal(undoWater(state).totalMl, 1250);
  state = undoWater(addWater(state, 250));
  assert.equal(state.totalMl, 1250);
  assert.deepEqual(load(state), state);
});

test('future travel records and rewards survive loading but calendar stays neutral', () => {
  process.env.TZ = 'Europe/London';
  let state = addWater({ ...newState(), metaLitros: 0.5 }, 750);
  state = travel(state, 'America/Sao_Paulo');
  state = load(state);
  assert.equal(state.dailyTotals['2026-10-15'], 750);
  assert.deepEqual(state.completedDays, ['2026-10-15']);
  assert.equal(calendarVolume('2026-10-15', state), null);
  assert.equal(calendarStatus('2026-10-15', state), 'future');
  assert.equal(state.startedOn, '2026-10-14');
  assert.deepEqual(achievements(state), { points: 10, streak: 0, earnedToday: false });
  state = travel(state, 'Europe/London');
  assert.equal(calendarVolume('2026-10-15', state), 750);
  assert.equal(calendarStatus('2026-10-15', state), 'completed');
  assert.equal(achievements(state).streak, 1);
});

test('invalid active data cannot overwrite known totals or valid snapshots', () => {
  for (const totalMl of [-1, null, '500']) {
    const state = load({ ...newState(), totalMl, dailyTotals: { '2026-10-14': 750 },
      dailyProgress: { '2026-10-13': { totalMl: 500, entries: [], garrafas: 0 } } });
    assert.equal(state.totalMl, 750);
    assert.equal(state.dailyTotals['2026-10-13'], 500);
    assert.deepEqual(load(state), state);
  }
  assert.equal(load({ ...newState(), totalMl: 0, dailyTotals: { '2026-10-14': 750 } }).totalMl, 0);
});

test('travel across the international date line retains skipped local dates', () => {
  instant = NativeDate.parse('2026-10-15T11:30:00Z');
  process.env.TZ = 'Pacific/Kiritimati';
  let state = addWater(newState(), 750);
  assert.match(state.data, /Oct 16/);
  state = travel(state, 'Pacific/Honolulu');
  assert.match(state.data, /Oct 15/);
  assert.equal(state.dailyTotals['2026-10-16'], 750);
  assert.equal(travel(load(state), 'Pacific/Kiritimati').totalMl, 750);
});

test('calendar month remains within tracking and current-date bounds after travel', async () => {
  const { calendarMonth } = await import('../src/calendar.js');
  assert.equal(calendarMonth('2026-11', '2026-10-01', '2026-10-31'), '2026-10');
  assert.equal(calendarMonth('2026-10', '2026-11-01', '2026-10-31'), '2026-10');
  assert.equal(calendarMonth('2026-09', '2026-10-01', '2026-11-01'), '2026-10');
  assert.equal(calendarMonth('2026-10', '2026-09-01', '2026-11-01'), '2026-10');
  process.env.TZ = 'Europe/London';
  instant = NativeDate.parse('2026-10-31T23:30:00Z');
  // London is on GMT here: use a date-line crossing to move between months.
  let state = addWater(newState(), 750);
  process.env.TZ = 'Pacific/Kiritimati';
  state = currentDay(state);
  state = travel(state, 'Pacific/Honolulu');
  assert.equal(state.startedOn, '2026-10-31');
  assert.equal(calendarMonth('2026-11', state.startedOn), '2026-10');
  assert.equal(state.dailyTotals['2026-11-01'], 0);
  assert.equal(state.totalMl, 750);
});
