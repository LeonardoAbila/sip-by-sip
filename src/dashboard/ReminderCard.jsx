import React from 'react';
import Icon from '../Icon.jsx';
import { formatReminderCountdown } from '../reminders.js';

export default function ReminderCard({ t, reminders, reminderVisible, reminderSeconds, onOpen }) {
  return (
    <section className="reminder-card" aria-labelledby="reminder-card-title">
      <span className="reminder-card-icon"><Icon name="bell" /></span>
      <div><h2 id="reminder-card-title">{t.reminders}</h2><p>{reminders.enabled ? t.everyMinutes(reminders.minutes) : t.remindersOff}</p>
        <p className="settings-help">{t.reminderAvailability}</p>
        {reminders.enabled && <p className={reminderVisible ? 'reminder-countdown is-due' : 'reminder-countdown'} role="timer" aria-live="off">
          {reminderVisible ? t.reminderDue : <>{t.nextReminder} <span>{formatReminderCountdown(reminderSeconds)}</span></>}
        </p>}
      </div>
      <button className="icon-button" onClick={() => onOpen()} aria-label={t.reminders} aria-haspopup="dialog"><Icon name="arrow" /></button>
    </section>
  );
}
