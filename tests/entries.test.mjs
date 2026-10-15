import assert from 'node:assert/strict';
import test from 'node:test';
import { addWater, undoWater, resetWater, newState, readState, today, validVolume, remainingWater } from '../src/state.js';

const load = state => readState('test', 2, () => JSON.stringify(state));

test('mixed amounts and changed bottle size undo their actual amounts, even after reload', () => {
  let state = addWater(newState());
  state = addWater({ ...state, mlGarrafa: 750 }, 250);
  state = addWater(state);
  assert.equal(state.totalMl, 1500);
  assert.equal(state.garrafas, 3);
  state = undoWater(load(state));
  assert.equal(state.totalMl, 750);
  assert.equal(state.mlGarrafa, 750);
  state = undoWater(state);
  assert.equal(state.totalMl, 500);
  assert.equal(undoWater(state).totalMl, 0);
  assert.equal(undoWater(undoWater(state)).garrafas, 0);
});

test('decimal arithmetic remains exact over repeated additions and undo', () => {
  let state = newState();
  for (let i = 0; i < 15000; i += 1) state = addWater(state, 0.1);
  assert.equal(state.totalMl, 1500);
  assert.equal(undoWater(state).totalMl, 1499.9);
  assert.equal(load({ ...newState(), totalMl: 1499.9999999999998 }).totalMl, 1500);
  assert.equal(load({ ...newState(), mlGarrafa: 499.99999999999994 }).mlGarrafa, 500);
});

test('legacy totals are preserved and only known new entries are undone', () => {
  const legacy = load({ ...newState(), entries: undefined, totalMl: 800, garrafas: 2 });
  assert.equal(undoWater(legacy).totalMl, 800);
  const state = undoWater(addWater(legacy, 250));
  assert.equal(state.totalMl, 800);
  assert.equal(state.garrafas, 2);
});

test('reset and new days remove undo history but retain settings and rewards', () => {
  const state = addWater(newState(), 2000);
  assert.equal(resetWater(state).entries.length, 0);
  assert.deepEqual(resetWater(state).completedDays, state.completedDays);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const rollover = undoWater({ ...state, data: yesterday.toDateString() });
  assert.equal(rollover.totalMl, 0);
  assert.equal(rollover.data, today());
  assert.equal(rollover.entries.length, 0);
});

test('invalid amounts and inconsistent saved entry history cannot change totals', () => {
  for (const amount of [0, -1, NaN, Infinity, '', null, true, [], 0.001, 1.234, 1000001]) {
    assert.equal(validVolume(amount), false);
    assert.equal(addWater(newState(), amount).totalMl, 0);
  }
  const saved = load({ ...newState(), totalMl: 20, garrafas: 1, entries: [{ amountMl: 500 }] });
  assert.equal(saved.entries.length, 0);
  assert.equal(undoWater(saved).totalMl, 20);
});

test('switching between glasses and bottles retains separate sizes and typed history across reloads', () => {
  let state = addWater(newState());
  state = addWater({ ...state, container: 'glass' });
  state = addWater({ ...state, mlCopo: 300 });
  state = addWater({ ...state, container: 'bottle', mlGarrafa: 750 });
  assert.equal(state.totalMl, 1800);
  assert.deepEqual(state.entries.map(entry => entry.container), ['bottle', 'glass', 'glass', 'bottle']);
  state = load(state);
  assert.equal(state.container, 'bottle');
  assert.equal(state.mlCopo, 300);
  assert.equal(state.mlGarrafa, 750);
  assert.equal(undoWater(state).totalMl, 1050);
  state = load({ ...state, container: 'glass' });
  assert.equal(state.container, 'glass');
  assert.equal(addWater(state).totalMl, 2100);
  assert.equal(resetWater(state).container, 'glass');
  assert.equal(resetWater(state).mlCopo, 300);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  assert.equal(load({ ...state, data: yesterday.toDateString() }).mlCopo, 300);
});

test('old and invalid container settings load safely without inventing history types', () => {
  const old = load({ ...newState(), container: undefined, mlCopo: undefined, entries: [{ amountMl: 250 }], totalMl: 250, garrafas: 1 });
  assert.equal(old.mlCopo, 250);
  assert.equal(old.container, 'bottle');
  assert.equal(old.entries[0].container, 'custom');
  assert.equal(undoWater(old).totalMl, 0);
  assert.equal(load({ ...newState(), container: 'invalid', mlCopo: -10 }).mlCopo, 250);
  assert.equal(addWater(newState(), 250, 'invalid').totalMl, 0);
});

test('remaining bottles and glasses recalculate from the same remaining volume', () => {
  let state = newState();
  assert.deepEqual(remainingWater(state), { ml: 2000, bottles: 4, glasses: 8 });
  state = addWater(state, 250, 'glass');
  assert.deepEqual(remainingWater(state), { ml: 1750, bottles: 4, glasses: 7 });
  state = addWater(state, 500, 'bottle');
  assert.deepEqual(remainingWater(state), { ml: 1250, bottles: 3, glasses: 5 });
  assert.equal(remainingWater(undoWater(state)).glasses, 7);
  assert.deepEqual(remainingWater({ ...state, metaLitros: 1.5, mlGarrafa: 750, mlCopo: 300 }), { ml: 750, bottles: 1, glasses: 3 });
  assert.deepEqual(remainingWater({ ...state, totalMl: 3000 }), { ml: 0, bottles: 0, glasses: 0 });
  assert.deepEqual(remainingWater({ ...state, metaLitros: 0.0003, totalMl: 0.2, mlGarrafa: 0.1, mlCopo: 0.1 }), { ml: 0.1, bottles: 1, glasses: 1 });
});
