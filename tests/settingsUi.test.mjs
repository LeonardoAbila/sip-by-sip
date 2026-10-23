import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { ui } from './helpers/ui.mjs';

for (const dismissal of ['cancel', 'Escape']) {
  test(`settings ${dismissal} discards every preference draft`, async context => {
    const h = await ui(context); await h.dashboard();
    const { translations } = await h.load('language.js'); const t = translations['pt-BR'];
    const before = { ...h.document.documentElement.dataset };
    await h.click(t.settings); await h.input('#daily-goal', '9'); await h.input('#bottle-size', '700');
    await act(async () => { h.document.querySelector('.appearance-settings input').click(); });
    await h.click(t.colors.blue);
    await act(async () => { h.document.querySelector('.language-button').click(); });
    await h.click('English');
    if (dismissal === 'cancel') await h.click(translations.en.cancel); else await h.escape();
    await h.until(() => !h.document.querySelector('dialog'));
    assert.equal(h.document.documentElement.lang, 'pt-BR');
    assert.deepEqual({ ...h.document.documentElement.dataset }, before);
    const saved = JSON.parse(h.database.readProgress('aguaApp:perfil:destination'));
    assert.equal(saved.metaLitros, 2); assert.equal(saved.mlGarrafa, 500);
    await h.click(t.settings);
    assert.equal(h.document.querySelector('#daily-goal').value, '2');
    assert.equal(h.document.querySelector('#bottle-size').value, '500');
  });
}

test('settings reject invalid values and save valid goal, size, language and appearance', async context => {
  const h = await ui(context); await h.dashboard();
  const { translations } = await h.load('language.js'); const t = translations['pt-BR'];
  await h.click(t.settings); await h.input('#daily-goal', '0');
  assert.equal(h.button(t.save).disabled, true);
  assert.ok(h.document.querySelector('[role="alert"]'));
  await h.submit(); assert.equal(JSON.parse(h.database.readProgress('aguaApp:perfil:destination')).metaLitros, 2);
  await h.input('#daily-goal', '3'); await h.input('#bottle-size', '-1');
  assert.equal(h.button(t.save).disabled, true);
  await h.input('#bottle-size', '600');
  await act(async () => { h.document.querySelector('.appearance-settings input').click(); });
  await h.click(t.colors.blue);
  await act(async () => { h.document.querySelector('.language-button').click(); });
  await h.click('English'); await h.click(translations.en.save);
  await h.until(() => !h.document.querySelector('dialog'));
  const saved = JSON.parse(h.database.readProgress('aguaApp:perfil:destination'));
  assert.equal(saved.metaLitros, 3); assert.equal(saved.mlGarrafa, 600); assert.equal(saved.totalMl, 250);
  assert.equal(h.dom.window.localStorage.getItem((await h.load('language.js')).LANGUAGE_KEY), 'en');
  assert.equal(h.document.documentElement.dataset.color, 'blue');
  assert.equal(h.dom.window.localStorage.getItem('aguaAppTheme'), h.document.documentElement.dataset.theme);
  assert.equal(h.dom.window.localStorage.getItem('aguaAppColor'), 'blue');
});

for (const action of ['cancel', 'Escape', 'confirm']) {
  test(`reset ${action} changes only on confirmation`, async context => {
    const h = await ui(context); await h.dashboard();
    const { translations } = await h.load('language.js'); const t = translations['pt-BR'];
    await act(async () => { h.document.querySelector('a[href="#history"]').click(); await h.pause(); });
    await h.until(() => !h.document.querySelector('#history').hidden);
    await h.click(t.reset);
    if (action === 'Escape') await h.escape();
    else await h.click(action === 'cancel' ? t.cancel : t.reset, h.document.querySelector('dialog'));
    await h.until(() => !h.document.querySelector('dialog'));
    const expected = action === 'confirm' ? 0 : 250;
    await h.until(() => JSON.parse(h.database.readProgress('aguaApp:perfil:destination')).totalMl === expected);
    assert.equal(h.document.querySelector('.total').textContent, `${expected} ml`);
  });
}
