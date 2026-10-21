import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { ui } from './helpers/ui.mjs';

test('registration rejects short/mismatched passwords and toggles password visibility', async t => {
  const h = await ui(t);
  const { default: Prototype } = await h.load('Prototype.jsx');
  await h.render(Prototype);
  await h.click('Cadastre-se');
  await h.input('#auth-username', 'Alice');
  await h.input('#auth-password', 'short');
  await h.input('#auth-confirmation', 'short');
  // Submit directly to exercise the JS guard; native constraints belong to e2e.
  await h.submit();
  assert.match(h.document.querySelector('[role="alert"]').textContent, /6 caracteres/);
  assert.equal(h.profiles.readProfiles().length, 0);
  await h.input('#auth-password', 'secret123');
  await h.submit();
  assert.match(h.document.querySelector('[role="alert"]').textContent, /iguais/);
  const toggle = h.document.querySelector('[aria-controls="auth-password"]');
  await act(async () => { toggle.click(); });
  assert.equal(h.document.querySelector('#auth-password').type, 'text');
  await act(async () => { toggle.click(); });
  assert.equal(h.document.querySelector('#auth-password').type, 'password');
  assert.equal(h.profiles.readProfiles().length, 0);
});

test('duplicate registration and wrong login preserve the saved profile and session', async t => {
  const h = await ui(t);
  await h.seed(); h.profiles.setSession(null);
  const { default: Prototype } = await h.load('Prototype.jsx');
  await h.render(Prototype);
  await h.input('#auth-username', 'Destination'); await h.input('#auth-password', 'wrong-password');
  await h.submit();
  await h.until(() => h.document.querySelector('[role="alert"]'));
  assert.match(h.document.querySelector('[role="alert"]').textContent, /incorretos/);
  assert.equal(h.profiles.readSession(), null);
  await h.click('Cadastre-se');
  await h.input('#auth-password', 'secret123'); await h.input('#auth-confirmation', 'secret123');
  await h.submit();
  await h.until(() => h.document.querySelector('[role="alert"]'));
  assert.match(h.document.querySelector('[role="alert"]').textContent, /já existe/);
  assert.equal(h.profiles.readProfiles().length, 1);
});

test('registration and onboarding validate, reveal, review and persist the initial goal', async t => {
  const h = await ui(t);
  const { default: Prototype } = await h.load('Prototype.jsx');
  await h.render(Prototype); await h.click('Cadastre-se');
  await h.input('#auth-username', 'Alice'); await h.input('#auth-password', 'secret123'); await h.input('#auth-confirmation', 'secret123');
  await h.submit();
  await h.until(() => h.document.querySelector('#onboarding-age'));
  await h.input('#onboarding-age', '0'); await h.input('#onboarding-weight', '70'); await h.submit();
  assert.match(h.document.querySelector('[role="alert"]').textContent, /idade inteira/);
  assert.equal(h.profiles.readProfiles()[0].onboardingComplete, false);
  await h.input('#onboarding-age', '30'); await h.input('#onboarding-weight', '0'); await h.submit();
  assert.ok(h.document.querySelector('[role="alert"]'));
  await h.input('#onboarding-weight', '70'); await h.submit();
  assert.match(h.document.querySelector('[role="status"]').textContent, /2,45/);
  await h.click('Revisar idade e peso');
  assert.equal(h.document.querySelector('#onboarding-age').value, '30');
  assert.equal(h.profiles.readProfiles()[0].onboardingComplete, false);
  await h.submit(); await h.click('Começar meu dia');
  await h.until(() => h.document.querySelector('.total'));
  assert.equal(h.profiles.readProfiles()[0].goalLiters, 2.45);
  assert.equal(h.profiles.readProfiles()[0].onboardingComplete, true);
});
