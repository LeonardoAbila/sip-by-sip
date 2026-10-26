import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { ui } from './helpers/ui.mjs';

test('home streak celebrates a new daily goal once and survive undo, recrossing and reload', async t => {
  const h = await ui(t); await h.dashboard();
  const { translations } = await h.load('language.js'); const copy = translations['pt-BR'];
  const noPoints = () => assert.equal(h.document.querySelector('.motivation-points'), null);
  const streak = () => h.document.querySelector('#home .achievement-panel strong').textContent;
  noPoints(); assert.equal(streak(), '0 dias');
  assert.equal(h.document.querySelector('.buddy-message').textContent.trim(), 'Faltam 1,75 L para a meta.');
  for (let index = 0; index < 4; index += 1) await h.record(copy.bottleChoice);
  noPoints(); assert.equal(streak(), '1 dia');
  assert.ok(h.document.querySelector('.is-celebrating'));
  assert.equal(h.document.querySelector('.buddy-message').textContent.trim(), copy.success);
  assert.equal(h.document.querySelector('dialog'), null);
  await h.click(copy.undoShort);
  assert.equal(h.document.querySelector('.is-celebrating'), null);
  noPoints();
  await h.record(copy.bottleChoice);
  assert.equal(h.document.querySelector('.is-celebrating'), null);
  noPoints();
  await act(async () => { await h.database.refreshDatabase(); });
  const { default: Prototype } = await h.load('Prototype.jsx');
  await act(async () => { h.root.render(null); }); await h.render(Prototype);
  noPoints(); assert.equal(streak(), '1 dia');
  assert.equal(h.document.querySelector('.is-celebrating'), null);
});

for (const language of ['pt-BR', 'en', 'es']) {
  test(`consecutive days and companion copy use the selected language (${language})`, async t => {
    const h = await ui(t);
    const { translations } = await h.load('language.js'); const copy = translations[language];
    const { default: DailyMotivation } = await h.load('dashboard/DailyMotivation.jsx');
    const { default: HydrationCard } = await h.load('dashboard/HydrationCard.jsx');
    const format = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
    await h.render(() => React.createElement(React.Fragment, null,
      React.createElement(DailyMotivation, { rewards: { points: 20, streak: 2 }, t: copy, format }),
      React.createElement(HydrationCard, { state: h.state.newState(), t: copy, format, earnedToday: false, recordWater: () => {}, onUndo: () => {} }),
    ));
    assert.equal(h.document.querySelector('.daily-motivation').getAttribute('aria-label'), copy.streak);
    assert.equal(h.document.querySelector('.motivation-points'), null);
    assert.equal(h.document.querySelector('.motivation-streak dd').textContent, copy.streakDays(2));
    assert.equal(h.document.querySelector('.buddy-encouragement').textContent, copy.buddyStart);
    assert.equal(h.document.querySelector('.buddy-message').textContent.trim(), copy.remainingToday('2 L'));
  });
}
