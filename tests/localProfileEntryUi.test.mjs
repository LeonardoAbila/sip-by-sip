import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { ui } from './helpers/ui.mjs';

async function select(h, id) {
  await act(async () => {
    const node = h.document.querySelector('#local-profile');
    node.value = id; node.dispatchEvent(new h.dom.window.Event('change', { bubbles: true }));
  });
}

async function signedOut(h) {
  h.profiles.setSession(null);
  const { default: Prototype } = await h.load('Prototype.jsx');
  await h.render(Prototype);
}

test('two saved profiles require their password; switching clears secrets/errors without modifying data', async t => {
  const h = await ui(t); const original = await h.seed();
  const second = { ...original, id: 'second', username: 'Second', passwordHash: await h.profiles.hashPassword('second-password', original.salt) };
  await h.database.saveProfile(second, { create: true });
  await signedOut(h);
  assert.equal(h.document.querySelector('label[for="local-profile"]').textContent.startsWith('Perfis neste navegador'), true);
  assert.deepEqual([...h.document.querySelectorAll('#local-profile option')].map(node => node.textContent), ['Selecione um perfil', 'Destination', 'Second']);
  const before = h.database.readProgress('aguaApp:perfil:destination');
  await select(h, original.id);
  assert.equal(h.profiles.readSession(), null);
  assert.equal(h.document.querySelector('#auth-username').value, 'Destination');
  await h.submit(); assert.match(h.document.querySelector('[role="alert"]').textContent, /Preencha/);
  await h.input('#auth-password', 'wrong'); await h.submit();
  await h.until(() => h.document.querySelector('[role="alert"]')?.textContent.includes('incorretos'));
  await select(h, second.id);
  assert.equal(h.document.querySelector('#auth-password').value, '');
  assert.equal(h.document.querySelector('[role="alert"]'), null);
  assert.equal(h.database.readProgress('aguaApp:perfil:destination'), before);
  await h.input('#auth-password', 'destination-password'); await h.submit();
  await h.until(() => h.document.querySelector('[role="alert"]'));
  assert.equal(h.profiles.readSession(), null);
  await h.input('#auth-password', 'second-password'); await h.submit();
  await h.until(() => h.document.querySelector('.total'));
  assert.equal(h.profiles.readSession().id, second.id);
  assert.equal(h.database.readProgress('aguaApp:perfil:destination'), before);
});

test('editing username returns to typed case-insensitive entry; registration has no chooser', async t => {
  const h = await ui(t); const original = await h.seed(); await signedOut(h);
  await select(h, original.id); await h.input('#auth-password', 'secret');
  await h.click('Cadastre-se');
  assert.equal(h.document.querySelector('#local-profile'), null);
  assert.equal(h.document.querySelector('#auth-password').value, '');
  await h.click('Entrar'); await select(h, original.id);
  await h.input('#auth-username', 'destination');
  assert.equal(h.document.querySelector('#local-profile').value, '');
  await h.input('#auth-password', 'destination-password'); await h.submit();
  await h.until(() => h.document.querySelector('.total'));
  assert.equal(h.profiles.readSession().id, original.id);
});

test('empty storage offers typed entry and registration without an empty chooser', async t => {
  const h = await ui(t); await signedOut(h);
  assert.equal(h.document.querySelector('#local-profile'), null);
  assert.ok(h.document.querySelector('#auth-username'));
  await h.click('Cadastre-se'); assert.ok(h.document.querySelector('#auth-confirmation'));
});
