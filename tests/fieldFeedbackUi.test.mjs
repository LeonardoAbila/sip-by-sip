import test from 'node:test';
import assert from 'node:assert/strict';
import { ui } from './helpers/ui.mjs';

function associatedError(h, id, errorId) {
  const input = h.document.querySelector(id);
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.ok(input.getAttribute('aria-describedby').split(' ').includes(errorId));
  assert.equal(h.document.getElementById(errorId).getAttribute('role'), 'alert');
}

test('entry field errors identify missing, short and mismatched credentials', async t => {
  const h = await ui(t); const { default: Prototype } = await h.load('Prototype.jsx'); await h.render(Prototype);
  await h.submit();
  associatedError(h, '#auth-username', 'auth-error'); associatedError(h, '#auth-password', 'auth-error');
  assert.equal(h.document.querySelector('form').getAttribute('aria-busy'), 'false');
  await h.click('Cadastre-se'); assert.equal(h.document.querySelector('[role="alert"]'), null);
  await h.input('#auth-username', 'Alice'); await h.input('#auth-password', 'short'); await h.input('#auth-confirmation', 'other');
  await h.submit(); associatedError(h, '#auth-password', 'auth-error');
  assert.equal(h.document.querySelector('#auth-username').getAttribute('aria-invalid'), 'false');
  await h.input('#auth-password', 'secret123'); await h.submit();
  associatedError(h, '#auth-password', 'auth-error'); associatedError(h, '#auth-confirmation', 'auth-error');
  assert.equal(h.profiles.readProfiles().length, 0);
});

test('onboarding errors associate only the invalid measurement and retain help', async t => {
  const h = await ui(t); const profile = await h.seed();
  await h.database.saveProfile({ ...profile, onboardingComplete: false });
  const { default: Prototype } = await h.load('Prototype.jsx'); await h.render(Prototype);
  await h.input('#onboarding-age', '0'); await h.input('#onboarding-weight', '70'); await h.submit();
  associatedError(h, '#onboarding-age', 'onboarding-error');
  assert.equal(h.document.querySelector('#onboarding-weight').getAttribute('aria-invalid'), 'false');
  await h.input('#onboarding-age', '30'); await h.input('#onboarding-weight', '0'); await h.submit();
  associatedError(h, '#onboarding-weight', 'onboarding-error');
  assert.equal(h.document.querySelector('#onboarding-age').getAttribute('aria-invalid'), 'false');
  await h.input('#onboarding-weight', '70'); await h.submit();
  assert.equal(h.document.querySelector('[role="alert"]'), null);
  assert.match(h.document.querySelector('[role="status"]').textContent, /2,45/);
});
