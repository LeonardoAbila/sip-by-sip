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

test('focus refresh adds newly stored profiles while preserving typed drafts and removes its listener on unmount', async t => {
  const h = await ui(t); const first = await h.seed(); await signedOut(h);
  await h.until(() => h.document.querySelector('#local-profile'));
  await h.input('#auth-username', 'draft-name'); await h.input('#auth-password', 'draft-password');
  await h.database.saveProfile({ ...first, id: 'other-tab', username: 'Other tab' }, { create: true });
  await act(async () => { h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); });
  await h.until(() => h.document.querySelector('#local-profile option[value="other-tab"]'));
  assert.equal(h.document.querySelector('#auth-username').value, 'draft-name');
  assert.equal(h.document.querySelector('#auth-password').value, 'draft-password');
  const { IDBObjectStore } = await import('fake-indexeddb');
  const get = IDBObjectStore.prototype.get;
  let reads = 0;
  await act(async () => { h.root.render(null); });
  IDBObjectStore.prototype.get = function (...args) { reads += 1; return get.apply(this, args); };
  try {
    await act(async () => { h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); await h.pause(); });
    assert.equal(reads, 0);
  } finally { IDBObjectStore.prototype.get = get; }
});

test('stale selected profile cannot silently enter another profile', async t => {
  const h = await ui(t); const first = await h.seed(); await signedOut(h);
  await select(h, first.id); await h.input('#auth-password', 'destination-password');
  // Simulate an unavailable record in current storage without adding a production delete API.
  await h.database.saveProfile({ ...first, age: 0 });
  await h.submit();
  await h.until(() => h.document.querySelector('[role="alert"]')?.textContent.includes('não está mais disponível'));
  assert.equal(h.profiles.readSession(), null);
  assert.equal(h.document.querySelector('fieldset').disabled, false);
});

test('refresh errors preserve saved records and typed drafts and recover on the next focus', async t => {
  const h = await ui(t); await h.seed(); await signedOut(h); await h.settle();
  await h.input('#auth-username', 'draft'); await h.input('#auth-password', 'draft-secret');
  const before = h.profiles.readProfiles();
  const { IDBObjectStore } = await import('fake-indexeddb');
  const get = IDBObjectStore.prototype.get;
  try {
    IDBObjectStore.prototype.get = function () { throw new Error('Read unavailable'); };
    await act(async () => { h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); });
    await h.until(() => h.document.querySelector('[role="alert"]'));
  } finally { IDBObjectStore.prototype.get = get; }
  assert.match(h.document.querySelector('[role="alert"]').textContent, /atualizar os perfis/);
  assert.equal(h.document.querySelector('#auth-username').value, 'draft');
  assert.equal(h.document.querySelector('#auth-password').value, 'draft-secret');
  assert.deepEqual(h.profiles.readProfiles(), before);
  assert.equal(h.document.querySelector('fieldset').disabled, false);
  await act(async () => { h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); });
  await h.until(() => !h.document.querySelector('[role="alert"]'));
});

test('login and registration visibly describe local password limits with associated help', async t => {
  const h = await ui(t); await signedOut(h);
  for (const registration of [false, true]) {
    if (registration) await h.click('Cadastre-se');
    const help = h.document.querySelector('#local-entry-help');
    assert.ok(help); assert.equal(help.closest('details'), null);
    assert.match(help.textContent, /apenas neste navegador/);
    assert.match(help.textContent, /não criptografa/);
    assert.match(help.textContent, /alguém com acesso ao navegador/);
    assert.match(help.textContent, /Não há conta online, sincronização automática ou recuperação de senha/);
    assert.match(help.textContent, /senha de teste/);
    assert.equal(h.document.querySelector('form').getAttribute('aria-describedby'), help.id);
    for (const input of h.document.querySelectorAll('form input')) assert.ok(input.getAttribute('aria-describedby').includes(help.id));
  }
});

test('existing credentials, rewards, isolated backup restore, sessions and pending onboarding remain compatible', async t => {
  const h = await ui(t); const original = await h.seed();
  const progress = h.state.addWater(h.state.newState(), 2500, 'bottle');
  await h.database.saveProgress('aguaApp:perfil:destination', progress);
  const second = { ...original, id: 'pending', username: 'Pending', onboardingComplete: false };
  await h.database.saveProfile(second, { create: true });
  await h.database.saveProgress('aguaApp:perfil:pending', h.state.addWater(h.state.newState(), 100, 'glass'));
  const otherBefore = h.database.readProgress('aguaApp:perfil:pending');
  const { default: Prototype } = await h.load('Prototype.jsx');
  await h.render(Prototype); // A valid preexisting session still opens directly.
  await h.until(() => h.document.querySelector('.total')?.textContent === '2,5 L');
  assert.equal(h.document.querySelector('#local-profile'), null);
  await h.click('Sair');
  assert.equal(h.profiles.readSession(), null);
  await select(h, original.id); await h.input('#auth-password', 'destination-password'); await h.submit();
  await h.until(() => h.document.querySelector('.total')?.textContent === '2,5 L');
  assert.deepEqual(h.profiles.readProfiles().find(item => item.id === original.id), original);
  assert.deepEqual(JSON.parse(h.database.readProgress('aguaApp:perfil:destination')).completedDays, progress.completedDays);
  const exported = await h.database.exportProfile(original.id);
  await h.database.restoreProfile(original.id, exported);
  assert.deepEqual(h.profiles.readProfiles().find(item => item.id === original.id), original);
  assert.equal(h.database.readProgress('aguaApp:perfil:pending'), otherBefore);
  await h.click('Sair'); await select(h, second.id); await h.input('#auth-password', 'destination-password'); await h.submit();
  await h.until(() => h.document.querySelector('#onboarding-age'));
  assert.equal(h.profiles.readSession().id, second.id);
  await h.click('Sair'); assert.equal(h.profiles.readSession(), null);
  assert.equal(h.database.readProgress('aguaApp:perfil:pending'), otherBefore);
});
