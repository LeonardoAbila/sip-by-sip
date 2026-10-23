import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { IDBObjectStore } from 'fake-indexeddb';
import { ui } from './helpers/ui.mjs';

test('water buttons add both containers, size edits preserve recorded amounts, and undo survives remount', async t => {
  const h = await ui(t); await h.dashboard();
  const total = () => h.document.querySelector('.total').textContent;
  const saved = () => JSON.parse(h.database.readProgress('aguaApp:perfil:destination'));
  const { translations } = await h.load('language.js'); const copy = translations['pt-BR'];
  await h.record(copy.bottleChoice);
  await h.record(copy.glassChoice);
  assert.equal(total(), '1 L');
  await act(async () => { h.document.querySelector('a[href="#history"]').click(); await h.pause(); });
  await h.until(() => !h.document.querySelector('#history').hidden);
  await h.click(copy.changeBottleSize);
  await h.input('.bottle-size-editor input', '0');
  assert.equal(h.button(copy.save).disabled, true);
  await h.input('.bottle-size-editor input', '900'); await h.click(copy.cancel);
  assert.equal(total(), '1 L'); assert.equal(saved().mlGarrafa, 500);
  await h.click(copy.changeBottleSize); await h.input('.bottle-size-editor input', '800');
  await act(async () => { h.document.querySelector('.bottle-size-editor input').dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  assert.equal(saved().mlGarrafa, 500);
  await h.click(copy.changeBottleSize); await h.input('.bottle-size-editor input', '600');
  await h.click(copy.glassChoice, h.document.querySelector('.bottle-size-editor')); await h.input('.bottle-size-editor input', '300'); await h.click(copy.save);
  await h.until(() => saved().mlGarrafa === 600);
  assert.equal(saved().mlCopo, 300); assert.equal(saved().totalMl, 1000); assert.equal(total(), '1 L');
  await act(async () => { h.document.querySelector('a[href="#home"]').click(); await h.pause(); });
  await h.until(() => !h.document.querySelector('#home').hidden);
  assert.equal(h.document.querySelector('.add-glass-button .button-volume').textContent, '300 ml');
  const { default: Prototype } = await h.load('Prototype.jsx');
  await act(async () => { h.root.render(null); }); await h.render(Prototype);
  await h.click(copy.undoShort); assert.equal(total(), '750 ml');
  await h.click(copy.undoShort); assert.equal(total(), '250 ml');
  await h.click(copy.undoShort); assert.equal(total(), '0 ml');
  assert.equal(h.button(copy.undoShort).disabled, true);
  await h.until(() => saved().totalMl === 0);
});

test('every entry opens the matching filling scene and closing restores focus without changing totals', async t => {
  const h = await ui(t); await h.dashboard();
  const bottle = h.document.querySelector('.record-container-actions .add-button');
  const glass = h.document.querySelector('.add-glass-button');
  await act(async () => { bottle.focus(); bottle.click(); });
  assert.equal(h.document.querySelector('.total').textContent, '750 ml');
  assert.equal(h.document.querySelector('.pour-scene').dataset.container, 'bottle');
  assert.ok(h.document.querySelector('.pour-water'));
  assert.ok(h.document.querySelector('#pour-amount').textContent.includes('+500 ml'));
  assert.ok(h.document.activeElement === h.document.querySelector('.pour-close'));
  await act(async () => { h.document.querySelector('.pour-close').click(); });
  assert.ok(h.document.activeElement === bottle);
  await act(async () => { glass.focus(); glass.click(); });
  assert.equal(h.document.querySelector('.pour-scene').dataset.container, 'glass');
  assert.ok(h.document.querySelector('#pour-amount').textContent.includes('+250 ml'));
  await h.escape('.pour-dialog');
  assert.ok(h.document.activeElement === glass);
  assert.equal(h.document.querySelector('.total').textContent, '1 L');
  assert.equal(h.document.querySelector('dialog'), null);
  assert.equal(h.document.querySelector('.water-confirmation').textContent.trim(), '+250 ml adicionados');
  assert.equal(h.document.querySelector('.water-confirmation').getAttribute('aria-live'), 'polite');
});

test('same-volume confirmation renews its timer and undo survives expiry', async t => {
  const h = await ui(t); await h.dashboard();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const button = h.document.querySelector('.add-glass-button');
  const feedback = h.document.querySelector('.water-confirmation');
  await act(async () => { button.click(); });
  const previousMessage = feedback.firstElementChild;
  await act(async () => { t.mock.timers.tick(3000); button.click(); });
  assert.notEqual(feedback.firstElementChild, previousMessage);
  assert.equal(feedback.textContent.trim(), '+250 ml adicionados');
  await act(async () => { t.mock.timers.tick(1000); });
  assert.ok(h.document.querySelector('.pour-dialog'));
  assert.ok(feedback.textContent.trim());
  await act(async () => { t.mock.timers.tick(2999); });
  assert.equal(h.document.querySelector('.pour-dialog'), null);
  assert.ok(feedback.textContent.trim());
  await act(async () => { t.mock.timers.tick(1); });
  assert.equal(feedback.textContent.trim(), '');
  assert.equal(h.document.querySelector('.total').textContent, '750 ml');
  const undo = h.document.querySelector('.undo-water');
  assert.equal(undo.disabled, false);
  await act(async () => { undo.click(); });
  assert.equal(h.document.querySelector('.total').textContent, '500 ml');
  t.mock.timers.reset();
});

test('overdue reminder records through quick entry and is dismissed', async t => {
  const h = await ui(t);
  h.dom.window.localStorage.setItem('aguaReminders', JSON.stringify({ enabled: true, minutes: 30, sound: false }));
  h.dom.window.localStorage.setItem('aguaReminders:deadline:aguaApp:perfil:destination', JSON.stringify({ minutes: 30, deadline: Date.now() - 1000 }));
  await h.dashboard();
  Object.defineProperty(h.document, 'visibilityState', { configurable: true, value: 'visible' });
  await act(async () => { h.document.dispatchEvent(new h.dom.window.Event('visibilitychange')); });
  await h.until(() => h.document.querySelector('.reminder-toast'));
  const { translations } = await h.load('language.js');
  await h.click(translations['pt-BR'].add, h.document.querySelector('.reminder-toast'));
  await h.until(() => !h.document.querySelector('.reminder-toast'));
  assert.equal(h.document.querySelector('.total').textContent, '750 ml');
  assert.equal(h.document.querySelector('.pour-scene').dataset.container, 'bottle');
  assert.ok(h.document.querySelector('.pour-water'));
  await act(async () => { h.document.querySelector('.pour-close').click(); });
  assert.equal(h.document.querySelector('.water-confirmation').textContent.trim(), '+500 ml adicionados');
});

test('storage failure remains accessible after registration confirmation expires', async t => {
  const h = await ui(t); await h.dashboard();
  await act(async () => { await h.database.refreshDatabase(); });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const put = IDBObjectStore.prototype.put;
  try {
    IDBObjectStore.prototype.put = function () { throw new DOMException('Storage full', 'QuotaExceededError'); };
    await act(async () => { h.document.querySelector('.add-glass-button').click(); });
    await act(async () => { await h.database.refreshDatabase(); });
    assert.ok(h.document.querySelector('[role="alert"]'));
    assert.ok(h.document.querySelector('.water-confirmation').textContent.trim());
    await act(async () => { t.mock.timers.tick(4000); });
    assert.equal(h.document.querySelector('.water-confirmation').textContent.trim(), '');
    assert.ok(h.document.querySelector('[role="alert"]').textContent.includes('não permitiu salvar'));
    assert.equal(h.document.querySelector('.total').textContent, '500 ml');
  } finally { IDBObjectStore.prototype.put = put; t.mock.timers.reset(); }
});
