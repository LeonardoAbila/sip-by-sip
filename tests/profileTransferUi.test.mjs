import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { ui } from './helpers/ui.mjs';
import { IDBObjectStore } from 'fake-indexeddb';

test('backup lifecycle: export latest entry, cancel, retry atomic restore, remount and retain identity', async t => {
  const h = await ui(t);
  const { dom, document, root, pause, settle, until, click, choose, database, profiles, state } = h;
  const { createBackup } = await h.load('profileBackup.js');
  const { default: Prototype } = await h.load('Prototype.jsx');
    const salt = 'destination-salt';
    const destination = { id: 'destination', username: 'Destination', age: 50, weight: 90,
      goalLiters: 3, onboardingComplete: true, salt, passwordHash: await profiles.hashPassword('destination-password', salt) };
    await database.saveProfile(destination, { create: true });
    const original = state.addWater(state.newState(), 250, 'glass');
    await database.saveProgress('aguaApp:perfil:destination', original);
    profiles.setSession(destination);
    localStorage.setItem('aguaReminders', JSON.stringify({ enabled: true, minutes: 30, sound: false }));
    localStorage.setItem('aguaReminders:deadline:aguaApp:perfil:destination', JSON.stringify({ minutes: 30, deadline: Date.now() + 1000 }));
    await act(async () => { root.render(React.createElement(Prototype)); await pause(); });
    await until(() => document.querySelector('.total')?.textContent === '250 ml');
    await click('Garrafa');
    await click('Configurações');
    // An unsaved goal draft must not become part of an export/import.
    const goal = document.querySelector('#daily-goal');
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(goal, '9');
      goal.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    await click('Backup do perfil');
    await click('Exportar backup');
    await until(() => h.downloads() === 1);
    assert.equal((await database.exportProfile(destination.id)).progress.metaLitros, 2);
    assert.equal((await database.exportProfile(destination.id)).progress.totalMl, 750);
    await click('Voltar às configurações');
    assert.equal(document.querySelector('#daily-goal').value, '9');
    await click('Backup do perfil');
    const backup = createBackup({ ...destination, username: 'Source', age: 30, weight: 70, goalLiters: 2.45 }, state.addWater(state.newState(), 750.25, 'bottle'));
    await choose('{broken');
    assert.match(document.querySelector('[role="alert"]').textContent, /inválido/);
    await choose(backup);
    assert.match(document.querySelector('.transfer-preview').textContent, /Source/);
    await click('Cancelar');
    assert.equal(document.querySelector('.transfer-preview'), null);
    assert.equal(JSON.parse(database.readProgress('aguaApp:perfil:destination')).totalMl, 750);
    await choose(backup);
    // Escape before confirmation cancels without replacing.
    await act(async () => { document.querySelector('dialog').dispatchEvent(new dom.window.Event('cancel', { cancelable: true })); await pause(); });
    await until(() => !document.querySelector('dialog'));
    assert.equal(JSON.parse(database.readProgress('aguaApp:perfil:destination')).totalMl, 750);
    await click('Configurações'); await click('Backup do perfil'); await choose(backup);
    const put = IDBObjectStore.prototype.put;
    try {
      IDBObjectStore.prototype.put = function () { throw new DOMException('Storage full', 'QuotaExceededError'); };
      await click('Confirmar substituição');
      await until(() => document.querySelector('[role="alert"]'));
    } finally { IDBObjectStore.prototype.put = put; }
    assert.equal(JSON.parse(database.readProgress('aguaApp:perfil:destination')).totalMl, 750);
    assert.ok(document.querySelector('.transfer-preview'));
    await click('Confirmar substituição');
    await until(() => document.querySelector('.total')?.textContent === '750,25 ml' && !document.querySelector('dialog'));
    await settle();
    assert.equal(JSON.parse(database.readProgress('aguaApp:perfil:destination')).totalMl, 750.25);
    assert.match(document.querySelector('[role="status"]').textContent, /importado/);
    const deadline = JSON.parse(localStorage.getItem('aguaReminders:deadline:aguaApp:perfil:destination'));
    assert.ok(deadline.deadline > Date.now() + 29 * 60_000);
    assert.deepEqual(JSON.parse(localStorage.getItem('aguaReminders')), { enabled: true, minutes: 30, sound: false });
    const restored = profiles.readProfiles()[0];
    assert.equal(restored.age, 30);
    assert.equal(restored.username, 'Destination');
    assert.equal(restored.passwordHash, await profiles.hashPassword('destination-password', salt));
    await click('Configurações'); await click('Backup do perfil'); await choose(backup); await click('Confirmar substituição');
    await until(() => !document.querySelector('dialog'));
    await click('Sair');
    assert.equal(profiles.readSession(), null);
    profiles.setSession(restored);
    // Recreate the app as on refresh and use the saved destination session.
    await act(async () => { root.render(null); });
    await act(async () => { root.render(React.createElement(Prototype)); await pause(); });
    await until(() => document.querySelector('.total')?.textContent === '750,25 ml');
    await act(async () => { root.render(null); });
});

test('import in progress rejects water additions and undo', async t => {
  const h = await ui(t); const profile = await h.dashboard();
  const { createBackup } = await h.load('profileBackup.js');
  const backup = createBackup(profile, h.state.addWater(h.state.newState(), 900, 'glass'));
  await h.click('Configurações'); await h.click('Backup do perfil'); await h.choose(backup);
  await act(async () => {
    h.button('Confirmar substituição').click();
    h.document.querySelector('.add-glass-button').click();
    h.document.querySelector('.undo-water').click();
  });
  // The old in-memory counter cannot change while the restore is pending.
  assert.equal(h.document.querySelector('.total').textContent, '250 ml');
  await h.until(() => !h.document.querySelector('dialog'));
  assert.equal(h.document.querySelector('.total').textContent, '900 ml');
  assert.equal(JSON.parse(h.database.readProgress('aguaApp:perfil:destination')).totalMl, 900);
  assert.equal(h.document.querySelector('.water-confirmation').textContent.trim(), '');
});
