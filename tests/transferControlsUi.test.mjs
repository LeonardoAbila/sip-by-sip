import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { ui } from './helpers/ui.mjs';

for (const language of ['pt-BR', 'en', 'es']) {
  test(`transfer confirmation blocks duplicate commit and Escape while busy (${language})`, async context => {
    const h = await ui(context);
    const { dom, document, root, pause, button, click, choose } = h;
    const destination = await h.seed();
    const { createBackup } = await h.load('profileBackup.js');
    const backup = createBackup(destination, h.state.newState());
    const { default: SettingsDialog } = await h.load('dashboard/SettingsDialog.jsx');
    const { translations } = await h.load('language.js');
    const t = translations[language];
    let closeCount = 0;
    let importCount = 0;
    let release;
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
  });
}
