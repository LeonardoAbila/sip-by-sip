import assert from 'node:assert/strict';
import test from 'node:test';
import { readReminders, validReminderMinutes } from '../src/reminders.js';

test('custom intervals survive reloading with enabled and sound preferences', () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => JSON.stringify({ enabled: true, minutes: 45, sound: false }) };
  try {
    assert.deepEqual(readReminders(), { enabled: true, minutes: 45, sound: false });
  } finally { globalThis.localStorage = original; }
});

test('invalid or corrupted saved intervals fall back to thirty minutes', () => {
  const original = globalThis.localStorage;
  try {
    for (const minutes of [0, -1, 1.5, '45', null, Number.MAX_SAFE_INTEGER]) {
      assert.equal(validReminderMinutes(minutes), false);
      globalThis.localStorage = { getItem: () => JSON.stringify({ enabled: true, minutes }) };
      assert.equal(readReminders().minutes, 30);
    }
    globalThis.localStorage = { getItem: () => '{broken' };
    assert.deepEqual(readReminders(), { enabled: false, minutes: 30, sound: true });
    for (const minutes of [1, 15, 45, 60, 1440, 40000]) assert.equal(validReminderMinutes(minutes), true);
  } finally { globalThis.localStorage = original; }
});
