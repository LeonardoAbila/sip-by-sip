import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { ui } from './helpers/ui.mjs';

test('ordinary anchor clicks navigate home and benefits and restore heading focus', async t => {
  const h = await ui(t);
  const { document, dom, until, pause } = h;
  await h.dashboard();
    const homeLink = document.querySelector('.nav-actions a[href="#home"]');
    const benefitsLink = document.querySelector('.nav-actions a[href="#benefits"]');
    assert.equal(homeLink.getAttribute('aria-current'), 'page');
    await act(async () => { benefitsLink.click(); await pause(); });
    await until(() => benefitsLink.getAttribute('aria-current') === 'page');
    assert.equal(document.querySelector('#home').hidden, true);
    await act(async () => { homeLink.click(); await pause(); });
    await until(() => homeLink.getAttribute('aria-current') === 'page');
    assert.equal(document.querySelector('#home').hidden, false);
    assert.equal(document.activeElement, document.querySelector('#home h1'));
  assert.equal(dom.window.location.hash, '#home');
  assert.equal(h.downloads(), 0);
});

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
