import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { ui } from './helpers/ui.mjs';

test('combined dashboard keeps history visible and supports back/forward with focus', async t => {
  const h = await ui(t); await h.dashboard();
  const { document, dom, until, pause } = h;
  assert.equal(document.querySelector('#home').hidden, false);
  assert.ok(document.querySelector('#home .hydration-calendar'));
  assert.equal(document.querySelector('.nav-actions a[href="#history"]'), null);
  await act(async () => { document.querySelector('.nav-actions a[href="#benefits"]').click(); await pause(); });
  await until(() => document.querySelector('.benefits-screen'));
  assert.equal(document.querySelector('#home').hidden, true);
  await act(async () => { dom.window.history.back(); await pause(); });
  await until(() => !document.querySelector('#home').hidden);
  assert.equal(document.activeElement, document.querySelector('#home h1'));
  await act(async () => { dom.window.history.forward(); await pause(); });
  await until(() => document.querySelector('.benefits-screen'));
  await act(async () => { document.querySelector('.nav-actions a[href="#home"]').click(); await pause(); });
  await until(() => !document.querySelector('#home').hidden);
  assert.equal(document.querySelector('.total').textContent, '250 ml');
  assert.equal(document.querySelector('.motivation-points'), null);
  assert.equal(h.downloads(), 0);
});

for (const [hash, expected] of [['#history', 'home'], ['#benefits', 'benefits'], ['#unknown', 'home'], ['', 'home']]) {
  test(`initial destination ${hash || '(empty)'} resolves to ${expected}`, async t => {
    const h = await ui(t);
    await h.seed();
    h.dom.window.history.replaceState(null, '', hash || '/sip-by-sip/');
    const { default: Prototype } = await h.load('Prototype.jsx');
    await h.render(Prototype);
    assert.equal(h.document.querySelector('.nav-actions [aria-current="page"]').getAttribute('href'), `#${expected}`);
    assert.equal(h.document.activeElement.tagName, 'H1');
    if (expected !== 'home') assert.equal(h.document.querySelector('#home').hidden, true);
  });
}

for (const language of ['pt-BR', 'en', 'es']) {
  test(`localized streak and reminder card states (${language})`, async context => {
    const h = await ui(context);
    const { document, root } = h;
    const { translations } = await h.load('language.js');
    const { default: StreakCard } = await h.load('dashboard/StreakCard.jsx');
    const { default: ReminderCard } = await h.load('dashboard/ReminderCard.jsx');
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
  });
}

test('combined home shows calendar and consecutive days without points and follows add, undo and reset', async t => {
  const h = await ui(t); await h.dashboard();
  const { document } = h;
  const { translations } = await h.load('language.js'); const copy = translations['pt-BR'];
  assert.ok(document.querySelector('#home .hydration-calendar'));
  assert.ok(document.querySelector('#home .achievement-panel'));
  assert.ok(document.querySelector('#home .bottle-card'));
  assert.equal(document.querySelector('.motivation-points'), null);
  assert.ok(document.querySelector('#history .hydration-calendar').compareDocumentPosition(document.querySelector('#history .bottle-card')) & document.defaultView.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(document.querySelector('#home .reminder-card'), null);
  const calendarVolume = () => document.querySelector('.calendar-today .calendar-volume').textContent;
  assert.equal(calendarVolume(), '250 ml');
  await h.record(copy.bottleChoice);
  assert.equal(calendarVolume(), '750 ml');
  await h.click(copy.undoShort); assert.equal(calendarVolume(), '250 ml');
  await h.click(copy.reset); await h.click(copy.cancel);
  await h.until(() => !document.querySelector('dialog'));
  assert.equal(calendarVolume(), '250 ml');
  await h.click(copy.reset); await h.click(copy.reset, document.querySelector('dialog'));
  await h.until(() => !document.querySelector('dialog'));
  assert.equal(calendarVolume(), '0 ml');
});

for (const language of ['pt-BR', 'en', 'es']) {
  test(`combined dashboard navigation is localized (${language})`, async t => {
    const h = await ui(t);
    const { translations } = await h.load('language.js'); const copy = translations[language];
    const { default: DashboardNav } = await h.load('dashboard/DashboardNav.jsx');
    const { benefitsCopy } = await h.load('WaterBenefits.jsx');
    await h.render(DashboardNav, { screen: 'home', t: copy, benefitsLabel: benefitsCopy[language].nav,
      onOpenSettings: () => {}, onLogout: () => {}, showLogout: true });
    assert.equal(h.document.querySelector('nav').getAttribute('aria-label'), copy.navigation);
    const links = [...h.document.querySelectorAll('.nav-actions a')];
    assert.deepEqual(links.map(node => node.textContent), [copy.home, benefitsCopy[language].nav]);
    assert.equal(h.document.querySelector('.nav-actions [aria-current="page"]').textContent, copy.home);
    assert.ok(h.document.querySelector('.header-tools').textContent.includes(copy.settings));
  });
}
