import assert from 'node:assert/strict';
import test from 'node:test';
import { readReminders, validReminderMinutes, readReminderDeadline, remainingReminderSeconds, formatReminderCountdown } from '../src/reminders.js';

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

test('saved deadline survives reloads and resumes an overdue reminder', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const start = 1_000_000;
  const deadline = readReminderDeadline(storage, 'profile', 1, start);
  assert.equal(deadline, start + 60_000);
  assert.equal(readReminderDeadline(storage, 'profile', 1, start + 20_000), deadline);
  assert.equal(remainingReminderSeconds(deadline, start + 20_000), 40);
  assert.equal(remainingReminderSeconds(deadline, deadline - 1), 1);
  assert.equal(readReminderDeadline(storage, 'profile', 1, start + 90_000), deadline);
  assert.equal(remainingReminderSeconds(deadline, start + 90_000), 0);
  assert.equal(readReminderDeadline(storage, 'profile', 1, start + 90_000, true), start + 150_000);
  assert.equal(readReminderDeadline(storage, 'profile', 2, start + 90_000), start + 210_000);
  assert.equal(readReminderDeadline(storage, 'another-profile', 1, start), start + 60_000);
});

test('invalid deadline and unavailable storage keep a fresh working timer', () => {
  const now = 1_000_000;
  for (const saved of ['broken', JSON.stringify({minutes: 1, deadline: -1}), JSON.stringify({minutes: 1, deadline: now + 999_999})]) {
    const storage = {getItem: () => saved, setItem: () => {}};
    assert.equal(readReminderDeadline(storage, 'profile', 1, now), now + 60_000);
  }
  const blocked = {getItem: () => {throw new Error('blocked');}};
  assert.equal(readReminderDeadline(blocked, 'profile', 1, now), now + 60_000);
  assert.equal(formatReminderCountdown(0), '00:00');
  assert.equal(formatReminderCountdown(65), '01:05');
  assert.equal(formatReminderCountdown(3661), '01:01:01');
});
