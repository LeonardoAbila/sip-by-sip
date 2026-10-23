import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { ui } from './helpers/ui.mjs';

for (const dismissal of ['cancel', 'Escape']) {
  test(`reminder ${dismissal} discards enabled and interval drafts`, async context => {
    const h = await ui(context); await h.dashboard();
    const { translations } = await h.load('language.js'); const t = translations['pt-BR'];
    const open = async () => { if (!h.document.querySelector('dialog')) await h.click(t.settings); await h.click(t.reminders); assert.equal(h.document.querySelectorAll('dialog').length, 1); };
    await open();
    await act(async () => { h.document.querySelector('.reminder-settings input[type="checkbox"]').click(); });
    await h.input('#reminder-interval', '47');
    if (dismissal === 'cancel') await h.click(t.cancel); else await h.escape();
    await h.until(() => !h.document.querySelector('.reminder-settings'));
    assert.equal(JSON.parse(h.dom.window.localStorage.getItem('aguaReminders')).enabled, false);
    await open();
    assert.equal(h.document.querySelector('#reminder-interval').disabled, true);
    assert.notEqual(h.document.querySelector('#reminder-interval').value, '47');
  });
}

test('reminder validation, presets, save/disable and preview actions preserve water', async context => {
  const h = await ui(context); await h.dashboard();
  const { translations } = await h.load('language.js'); const t = translations['pt-BR'];
  const open = async () => { if (!h.document.querySelector('dialog')) await h.click(t.settings); await h.click(t.reminders); assert.equal(h.document.querySelectorAll('dialog').length, 1); };
  const toggle = async () => { await act(async () => { h.document.querySelector('.reminder-settings input[type="checkbox"]').click(); }); };
  await open();
  assert.equal(h.document.querySelector('#reminder-interval').disabled, true);
  await toggle();
  await act(async () => { h.document.querySelectorAll('.reminder-settings input[type="checkbox"]')[1].click(); });
  for (const invalid of ['', '0', '-1', '1.5']) {
    await h.input('#reminder-interval', invalid);
    assert.equal(h.button(t.save).disabled, true);
    assert.ok(h.document.querySelector('#reminder-interval-error'));
  }
  await h.click(t.everyMinutes(15)); assert.equal(h.document.querySelector('#reminder-interval').value, '15');
  await h.input('#reminder-interval', '47');
  for (const action of [t.add, t.dismissReminder]) {
    await h.click(t.testReminder);
    await h.click(action, h.document.querySelector('.reminder-preview'));
    await h.until(() => !h.document.querySelector('.reminder-preview'));
    assert.equal(h.document.querySelector('.total').textContent, '250 ml');
  }
  await h.click(t.save); await h.until(() => !h.document.querySelector('.reminder-settings'));
  assert.deepEqual(JSON.parse(h.dom.window.localStorage.getItem('aguaReminders')), { enabled: true, minutes: 47, sound: false });
  assert.ok(h.document.querySelector('[role="timer"]'));
  await open(); await toggle(); await h.click(t.save); await h.until(() => !h.document.querySelector('.reminder-settings'));
  assert.equal(JSON.parse(h.dom.window.localStorage.getItem('aguaReminders')).enabled, false);
  assert.equal(h.document.querySelector('[role="timer"]'), null);
  assert.equal(JSON.parse(h.database.readProgress('aguaApp:perfil:destination')).totalMl, 250);
});

test('reminder subpanel restores focus, discards drafts and leaves settings drafts independent', async context => {
  const h = await ui(context); await h.dashboard();
  const { translations } = await h.load('language.js'); const t = translations['pt-BR'];
  const opener = h.button(t.settings); opener.focus();
  await h.click(t.settings); await h.input('#daily-goal', '9');
  await h.click(t.reminders);
  assert.equal(h.document.querySelectorAll('dialog').length, 1);
  assert.ok(h.document.activeElement === h.document.querySelector('.reminder-settings input'), 'focus starts in reminders');
  await act(async () => { h.document.querySelector('.reminder-settings input').click(); });
  await h.input('#reminder-interval', '47'); await h.escape();
  assert.equal(h.document.querySelector('#daily-goal').value, '9');
  assert.ok(h.document.activeElement === h.button(t.reminders), 'focus returns to reminders entry');
  await h.click(t.reminders);
  assert.equal(h.document.querySelector('#reminder-interval').disabled, true);
  await act(async () => { h.document.querySelector('.reminder-settings input').click(); });
  await h.input('#reminder-interval', '47'); await h.click(t.save);
  assert.ok(h.document.activeElement === h.button(t.reminders), 'focus returns to reminders entry');
  assert.equal(h.document.querySelector('#daily-goal').value, '9');
  assert.equal(JSON.parse(h.database.readProgress('aguaApp:perfil:destination')).metaLitros, 2);
  assert.equal(JSON.parse(h.dom.window.localStorage.getItem('aguaReminders')).minutes, 47);
  await h.click(t.reminders); await h.input('#reminder-interval', '60'); await h.click(t.transferBack);
  assert.equal(JSON.parse(h.dom.window.localStorage.getItem('aguaReminders')).minutes, 47);
  assert.ok(h.document.activeElement === h.button(t.reminders), 'focus returns to reminders entry');
  await h.escape(); await h.until(() => !h.document.querySelector('dialog'));
  assert.ok(h.document.activeElement === opener, 'focus returns to settings opener');
  await h.click(t.settings);
  assert.equal(h.document.querySelector('#daily-goal').value, '2');
});
