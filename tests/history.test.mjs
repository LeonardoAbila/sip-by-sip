import assert from 'node:assert/strict';
import test from 'node:test';
import { newState, readState, calendarKey, currentDay, addWater, undoWater, resetWater } from '../src/state.js';

const load = state => readState('test', 2, () => JSON.stringify(state));
const past = days => { const date = new Date(); date.setDate(date.getDate() - days); return date; };

test('migration retains only valid known totals and is idempotent', () => {
  const yesterday = past(1), older = calendarKey(past(3));
  const loaded = load({ ...newState(), data: yesterday.toDateString(), totalMl: 250.25,
    dailyTotals: { [older]: 0, '2025-02-30': 2, '9999-01-01': 2, '2020-01-01': -1,
      '2020-01-02': '500', '2020-01-03': 0.001 } });
  assert.deepEqual(loaded.dailyTotals, { [older]: 0, [calendarKey(yesterday)]: 250.25 });
  assert.equal(loaded.totalMl, 0);
  assert.deepEqual(load(loaded), loaded);
  assert.equal(loaded.dailyTotals[calendarKey(past(2))], undefined);
});

test('invalid legacy total or date does not invent an archived zero', () => {
  const date = past(1), key = calendarKey(date);
  for (const totalMl of [-1, null, '500']) {
    const state = load({ ...newState(), data: date.toDateString(), totalMl, dailyTotals: { [key]: 750 } });
    assert.equal(state.dailyTotals[key], 750);
    assert.equal(state.totalMl, 0);
  }
  const state = load({ ...newState(), data: 'invalid', totalMl: 500 });
  assert.equal(state.totalMl, 0);
  assert.deepEqual(state.dailyTotals, {});
});

test('zero and large daily totals migrate without individual-entry limits', () => {
  for (const totalMl of [0, 2000000, 1499.9999999999998]) {
    const date = past(1);
    const state = load({ ...newState(), data: date.toDateString(), totalMl });
    assert.equal(state.dailyTotals[calendarKey(date)], Math.round(totalMl * 100) / 100);
  }
});

test('rollover archives year and month boundaries and preserves rewards and settings', () => {
  for (const date of [new Date(2025, 11, 31, 12), new Date(2026, 0, 31, 12), past(1)]) {
    const state = currentDay({ ...newState(), data: date.toDateString(), totalMl: 2500, mlGarrafa: 750 });
    assert.equal(state.dailyTotals[calendarKey(date)], 2500);
    assert.equal(state.totalMl, 0);
    assert.equal(state.mlGarrafa, 750);
    assert.ok(state.completedDays.includes(calendarKey(date)));
    assert.strictEqual(currentDay(state), state);
  }
});

test('today additions, undo and reset preserve previous days and earned goals', () => {
  const history = { [calendarKey(past(1))]: 1750 };
  let state = addWater({ ...newState(), dailyTotals: history }, 2000);
  state = undoWater(addWater(state, 250));
  assert.equal(load(state).totalMl, 2000);
  const reset = resetWater(state);
  assert.equal(reset.totalMl, 0);
  assert.deepEqual(reset.dailyTotals, history);
  assert.deepEqual(reset.completedDays, state.completedDays);
  assert.equal(load({ ...state, mlGarrafa: 750, mlCopo: 300, metaLitros: 3 }).totalMl, 2000);
});

test('calendar distinguishes unknown, zero, today and future without changing goal status', async () => {
  const { calendarVolume, calendarStatus, formatCalendarVolume } = await import('../src/calendar.js');
  const current = calendarKey(), yesterday = calendarKey(past(1));
  const state = { ...newState(), totalMl: 250.25, dailyTotals: { [yesterday]: 0 }, completedDays: [yesterday] };
  assert.equal(calendarVolume(current, state), 250.25);
  assert.equal(calendarVolume(yesterday, state), 0);
  assert.equal(calendarStatus(yesterday, state), 'completed');
  assert.equal(calendarVolume(calendarKey(past(2)), state), null);
  assert.equal(calendarVolume('9999-01-01', state), null);
  assert.equal(formatCalendarVolume(0, 'pt'), '0 ml');
  assert.equal(formatCalendarVolume(1500, 'pt'), '1,5 L');
  assert.equal(formatCalendarVolume(250.25, 'pt'), '250,25 ml');
  assert.equal(formatCalendarVolume(1500.01, 'pt'), '1,50001 L');
  assert.equal(formatCalendarVolume(0.01, 'pt'), '0,01 ml');
  assert.equal(formatCalendarVolume(1500, 'en'), '1.5 L');
  assert.equal(formatCalendarVolume(250.25, 'es'), '250,25 ml');
});
