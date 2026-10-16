import assert from 'node:assert/strict';
import test from 'node:test';
import { achievements, calendarKey, currentDay, newState, readState as loadState, rewardGoal, today } from '../src/state.js';
import { calendarStatus, monthDays } from '../src/calendar.js';

const NativeDate = Date;
let clock = '2026-10-12T12:00:00';
globalThis.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [clock])); }
};
const saved = new Map();
// Inject saved JSON so the rule tests stay independent of the browser database.
const readState = key => loadState(key, 2, key => saved.get(key) ?? null);

test('goal grants ten points once; extra bottles and resets preserve the reward', () => {
  const pending = { ...newState(), totalMl: 1999 };
  assert.equal(achievements(rewardGoal(pending)).points, 0);
  const completed = rewardGoal({ ...pending, totalMl: 2000 });
  assert.deepEqual(achievements(completed), { points: 10, streak: 1, earnedToday: true });
  assert.equal(achievements(rewardGoal({ ...completed, totalMl: 3000 })).points, 10);
  const reset = { ...currentDay(completed), totalMl: 0, garrafas: 0 };
  assert.equal(achievements(reset).points, 10);
  assert.equal(achievements(rewardGoal({ ...reset, totalMl: 2000 })).points, 10);
});

test('consecutive days extend the streak; a missed day breaks it without losing points', () => {
  const state = { ...newState(), completedDays: ['2026-10-10', '2026-10-11'] };
  assert.equal(achievements(state).streak, 2);
  const completed = rewardGoal({ ...state, totalMl: 2000 });
  assert.equal(achievements(completed).streak, 3);
  assert.equal(achievements({ ...state, completedDays: ['2026-10-09', '2026-10-10'] }).streak, 0);
  assert.equal(achievements({ ...state, completedDays: ['2026-10-09', '2026-10-10'] }).points, 20);
});

test('overnight progress resets while settings and earned rewards remain', () => {
  const state = { ...newState(), data: new Date('2026-10-11T12:00:00').toDateString(), totalMl: 2500, metaLitros: 2.5, mlGarrafa: 250 };
  const next = currentDay(state);
  assert.equal(next.data, today());
  assert.equal(next.totalMl, 0);
  assert.equal(next.metaLitros, 2.5);
  assert.equal(next.mlGarrafa, 250);
  assert.equal(achievements(next).streak, 1);
  const added = rewardGoal({ ...next, totalMl: 250 });
  assert.equal(achievements(added).points, 10);
});

test('goal changes grant a pending reward, but cannot revoke an earned one', () => {
  const state = { ...newState(), totalMl: 1500 };
  const completed = rewardGoal({ ...state, metaLitros: 1.5 });
  assert.equal(achievements(completed).points, 10);
  assert.equal(achievements(rewardGoal({ ...completed, metaLitros: 3 })).points, 10);
});

test('saved history loads safely, migrates older progress, and isolates profiles', () => {
  saved.set('a', JSON.stringify({ ...newState(), completedDays: ['2026-10-11', '2026-10-11', 'invalid', null, '2026-02-30', '2026-10-13'] }));
  assert.deepEqual(readState('a').completedDays, ['2026-10-11', '2026-10-13']);
  assert.equal(achievements(readState('b')).points, 0);
  saved.set('a', JSON.stringify({ ...newState(), totalMl: 2000, completedDays: undefined }));
  assert.deepEqual(readState('a').completedDays, [calendarKey()]);
  saved.set('a', '{broken');
  assert.equal(achievements(readState('a')).points, 0);
});

test('streak crosses month/year boundaries and daylight saving changes', () => {
  clock = '2027-01-01T12:00:00';
  assert.equal(achievements({ ...newState(), completedDays: ['2026-12-30', '2026-12-31', '2027-01-01'] }).streak, 3);
  clock = '2026-03-09T12:00:00';
  assert.equal(achievements({ ...newState(), completedDays: ['2026-03-07', '2026-03-08', '2026-03-09'] }).streak, 3);
  clock = '2026-10-12T12:00:00';
});

test('calendar distinguishes completed, missed, pending, future and untracked days', () => {
  const state = { ...newState(), startedOn: '2026-10-09', completedDays: ['2026-10-10'] };
  assert.equal(calendarStatus('2026-10-08', state), 'untracked');
  assert.equal(calendarStatus('2026-10-09', state), 'missed');
  assert.equal(calendarStatus('2026-10-10', state), 'completed');
  assert.equal(calendarStatus('2026-10-11', state), 'missed');
  assert.equal(calendarStatus('2026-10-12', state), 'pending');
  assert.equal(calendarStatus('2026-10-13', state), 'future');
  const completed = rewardGoal({ ...state, totalMl: 2000 });
  assert.equal(calendarStatus('2026-10-12', completed), 'completed');
  clock = '2026-10-13T12:00:00';
  assert.equal(calendarStatus('2026-10-12', currentDay(state)), 'missed');
  assert.equal(calendarStatus('2026-10-12', currentDay(completed)), 'completed');
  clock = '2026-10-12T12:00:00';
});

test('tracking start survives reloads and migrates from known history without counting earlier days', () => {
  saved.set('calendar', JSON.stringify({ ...newState(), startedOn: '2026-10-05' }));
  assert.equal(readState('calendar').startedOn, '2026-10-05');
  saved.set('calendar', JSON.stringify({ ...newState(), startedOn: undefined, completedDays: ['2026-10-07'] }));
  assert.equal(readState('calendar').startedOn, '2026-10-07');
  assert.equal(calendarStatus('2026-10-06', readState('calendar')), 'untracked');
  saved.set('calendar', JSON.stringify({ data: null, startedOn: 'bad' }));
  assert.equal(readState('calendar').startedOn, calendarKey());
});

test('month layout handles leap years, weekday alignment and December rollover', () => {
  assert.equal(monthDays(2024, 1).days.length, 29);
  assert.equal(monthDays(2026, 1).days.length, 28);
  assert.equal(monthDays(2026, 9).offset, 4);
  assert.equal(monthDays(2026, 12).days[0].key, '2027-01-01');
});
