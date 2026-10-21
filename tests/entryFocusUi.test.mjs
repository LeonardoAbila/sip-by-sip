import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { ui } from './helpers/ui.mjs';

test('entry transitions and deliberate profile selection move focus, refresh and rerender do not', async t => {
  const h = await ui(t); const profile = await h.seed(); h.profiles.setSession(null);
  const { default: Prototype } = await h.load('Prototype.jsx');
  await h.render(Prototype);
  assert.equal(h.document.activeElement.id, 'auth-title');
  await h.click('Cadastre-se'); assert.equal(h.document.activeElement.id, 'auth-title');
  await h.click('Entrar');
  await act(async () => {
    const select = h.document.querySelector('#local-profile'); select.value = profile.id;
    select.dispatchEvent(new h.dom.window.Event('change', { bubbles: true }));
  });
  assert.equal(h.document.activeElement.id, 'auth-password');
  h.document.querySelector('#auth-username').focus();
  await act(async () => { h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); });
  await h.settle(); await h.render(Prototype);
  assert.equal(h.document.activeElement.id, 'auth-username');
  await h.input('#auth-password', 'destination-password'); await h.submit();
  await h.until(() => h.document.querySelector('.total'));
  assert.equal(h.document.activeElement, h.document.querySelector('#home h1'));
  await h.click('Sair'); assert.equal(h.document.activeElement.id, 'auth-title');
});

for (const action of ['save', 'cancel', 'Escape']) {
  test(`inline editor ${action} returns focus to its replacement opener`, async context => {
    const h = await ui(context); await h.dashboard();
    const { translations } = await h.load('language.js'); const t = translations['pt-BR'];
    await h.click(t.changeBottleSize);
    if (action === 'Escape') await act(async () => {
      h.document.querySelector('.bottle-size-editor input').dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    else await h.click(action === 'save' ? t.save : t.cancel);
    assert.equal(h.document.activeElement, h.document.querySelector('.bottle-edit-button'));
    await h.settle(); assert.equal(h.document.activeElement, h.document.querySelector('.bottle-edit-button'));
  });
}
