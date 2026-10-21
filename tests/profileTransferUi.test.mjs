import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import initSqlJs from 'sql.js';
import React, { act } from 'react';

// DOM integration checks; native focus trapping, file pickers, and downloads
// still require a real browser. Production JSX is loaded through Vite.
test('backup UI cancels safely, replaces atomically, remounts, and retains destination login', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/sip-by-sip/' });
  const { document } = dom.window;
  const previous = new Map();
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document,
    localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage,
    IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  dom.window.matchMedia = () => ({ matches: true });
  dom.window.scrollTo = () => {};
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  let downloads = 0;
  dom.window.HTMLAnchorElement.prototype.click = function () { downloads += 1; };
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  const pause = () => new Promise(resolve => setTimeout(resolve, 15));
  async function settle() { await act(async () => { await pause(); }); }
  async function until(check) {
    for (let i = 0; i < 80; i += 1) { await settle(); if (check()) return; }
    assert.fail('Timed out waiting for UI');
  }
  const buttons = () => [...document.querySelectorAll('button')];
  function button(text) { const found = buttons().find(node => node.textContent.trim() === text); assert.ok(found, `Missing button: ${text}`); return found; }
  async function click(text) { await act(async () => { button(text).click(); await pause(); }); }
  async function choose(backup) {
    const input = document.querySelector('input[type="file"]');
    const text = typeof backup === 'string' ? backup : JSON.stringify(backup);
    Object.defineProperty(input, 'files', { configurable: true, value: [{ size: Buffer.byteLength(text), text: async () => text }] });
    await act(async () => { input.dispatchEvent(new dom.window.Event('change', { bubbles: true })); await pause(); });
  }
  try {
    const database = await server.ssrLoadModule('/src/database.js');
    const profiles = await server.ssrLoadModule('/src/profiles.js');
    const state = await server.ssrLoadModule('/src/state.js');
    const { createBackup } = await server.ssrLoadModule('/src/profileBackup.js');
    const { default: Prototype } = await server.ssrLoadModule('/src/Prototype.jsx');
    await database.initializeDatabase({ SQL: await initSqlJs(), indexedDB: new IDBFactory(), legacyStorage: localStorage });
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
    const homeLink = document.querySelector('.nav-actions a[href="#home"]');
    const benefitsLink = document.querySelector('.nav-actions a[href="#benefits"]');
    assert.equal(homeLink.getAttribute('aria-current'), 'page');
    await act(async () => { dom.window.location.hash = benefitsLink.hash; dom.window.dispatchEvent(new dom.window.Event('hashchange')); await pause(); });
    await until(() => benefitsLink.getAttribute('aria-current') === 'page');
    assert.equal(document.querySelector('#home').hidden, true);
    await act(async () => { dom.window.location.hash = homeLink.hash; dom.window.dispatchEvent(new dom.window.Event('hashchange')); await pause(); });
    await until(() => homeLink.getAttribute('aria-current') === 'page');
    assert.equal(document.querySelector('#home').hidden, false);
    assert.equal(document.activeElement, document.querySelector('#home h1'));
    await click('Garrafa');
    await click('×');
    await until(() => !document.querySelector('.pour-dialog'));
    await click('Configurações');
    // An unsaved goal draft must not become part of an export/import.
    const goal = document.querySelector('#daily-goal');
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(goal, '9');
      goal.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    await click('Backup do perfil');
    await click('Exportar backup');
    await until(() => downloads === 1);
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
    const { default: SettingsDialog } = await server.ssrLoadModule('/src/dashboard/SettingsDialog.jsx');
    const { translations } = await server.ssrLoadModule('/src/language.js');
    const { default: StreakCard } = await server.ssrLoadModule('/src/dashboard/StreakCard.jsx');
    const { default: ReminderCard } = await server.ssrLoadModule('/src/dashboard/ReminderCard.jsx');
    for (const language of ['pt-BR', 'en', 'es']) {
      let closeCount = 0;
      let importCount = 0;
      let release;
      const t = translations[language];
      let reminderOpens = 0;
      for (const [enabled, due] of [[false, false], [true, false], [true, true]]) {
        await act(async () => { root.render(React.createElement(React.Fragment, null,
          React.createElement(StreakCard, { label: t.streak, text: t.streakDays(3) }),
          React.createElement(ReminderCard, { t, reminders: { enabled, minutes: 30 }, reminderVisible: due,
            reminderSeconds: 125, onOpen: () => { reminderOpens += 1; } }),
        )); });
        assert.equal(document.querySelector('.achievement-panel').getAttribute('aria-label'), t.streak);
        assert.equal(document.querySelector('.achievement-panel strong').textContent, t.streakDays(3));
        const timer = document.querySelector('[role="timer"]');
        if (enabled) {
          assert.equal(timer.getAttribute('aria-live'), 'off');
          assert.ok(document.querySelector('.reminder-card').textContent.includes(t.everyMinutes(30)));
          if (due) {
            assert.equal(timer.textContent.trim(), t.reminderDue);
            assert.ok(timer.classList.contains('is-due'));
          } else {
            assert.ok(timer.textContent.includes(t.nextReminder));
            assert.equal(timer.querySelector('span').textContent, '02:05');
          }
        } else {
          assert.equal(timer, null);
          assert.ok(document.querySelector('.reminder-card').textContent.includes(t.remindersOff));
        }
        await act(async () => { document.querySelector('.reminder-card button').click(); });
      }
      assert.equal(reminderOpens, 3);
      await act(async () => { root.render(React.createElement(SettingsDialog, {
        profile: destination, language, theme: 'light', color: 'green', bottleSize: 500, dailyGoal: 2,
        onClose: () => { closeCount += 1; }, onSave: () => {}, onExport: async () => backup,
        onImport: () => { importCount += 1; return new Promise(resolve => { release = resolve; }); },
      })); });
      await click(t.transferTitle);
      assert.equal(document.activeElement.id, 'profile-backup-file');
      await choose(backup);
      await click(t.transferConfirm);
      assert.equal(button(t.transferConfirm).matches(':disabled'), true);
      assert.ok(document.querySelector('[role="status"]'));
      await act(async () => {
        button(t.transferConfirm).click();
        document.querySelector('dialog').dispatchEvent(new dom.window.Event('cancel', { cancelable: true }));
      });
      assert.equal(importCount, 1);
      assert.equal(closeCount, 0);
      await act(async () => { release(); await pause(); });
      await click(t.cancel);
      assert.equal(document.querySelector('.transfer-preview'), null);
      await act(async () => { root.render(null); });
    }
  } finally {
    await act(async () => { root.unmount(); });
    await server.close(); dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});
