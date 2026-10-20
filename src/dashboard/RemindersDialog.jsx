import React, { useEffect, useRef, useState } from 'react';
import Fade from '../Fade.jsx';
import ReminderNotice from './ReminderNotice.jsx';
import { translations } from '../language.js';
import { reminderIntervals, validReminderMinutes } from '../reminders.js';
import { playReminderSound, stopReminderSound } from '../reminderSound.js';

export default function RemindersDialog({ reminders, language, onSave, onClose, fadingOut }) {
  const dialog = useRef(null);
  const [reminderInput, setReminderInput] = useState(reminders);
  const [reminderPreview, setReminderPreview] = useState(false);
  const validInterval = validReminderMinutes(Number(reminderInput.minutes));
  const t = translations[language];

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); stopReminderSound(); };
  }, []);

  return (
    <dialog inert={fadingOut} ref={dialog} className="reset-dialog settings-dialog" onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="reminders-title">
      <form onSubmit={event => { event.preventDefault(); if (validInterval) onSave({ ...reminderInput, minutes: Number(reminderInput.minutes) }); }}>
        <h2 id="reminders-title">{t.reminders}</h2>
        <fieldset className="reminder-settings">
          <legend className="sr-only">{t.reminders}</legend>
          <label className="reminder-switch">
            <input type="checkbox" checked={reminderInput.enabled}
              onChange={event => setReminderInput(previous => ({ ...previous, enabled: event.target.checked }))} />
            {t.enableReminders}
          </label>
          <label htmlFor="reminder-interval">{t.reminderInterval}</label>
          <input id="reminder-interval" type="number" inputMode="numeric" min="1" step="1" required
            value={reminderInput.minutes} disabled={!reminderInput.enabled} aria-invalid={!validInterval}
            aria-describedby={`reminder-interval-help${validInterval ? '' : ' reminder-interval-error'}`}
            onChange={event => setReminderInput(previous => ({ ...previous, minutes: event.target.value }))} />
          <p id="reminder-interval-help" className="settings-help">{t.customReminderHelp}</p>
          <div className="reminder-presets" role="group" aria-label={t.reminderInterval}>
            {reminderIntervals.map(minutes => <button key={minutes} type="button" disabled={!reminderInput.enabled}
              aria-pressed={Number(reminderInput.minutes) === minutes}
              onClick={() => setReminderInput(previous => ({ ...previous, minutes }))}>{t.everyMinutes(minutes)}</button>)}
          </div>
          {!validInterval && <p id="reminder-interval-error" className="notice" role="alert">{t.invalidReminderInterval}</p>}
          <label className="reminder-switch">
            <input type="checkbox" checked={reminderInput.sound}
              onChange={event => setReminderInput(previous => ({ ...previous, sound: event.target.checked }))} />
            {t.reminderSound}
          </label>
          <p className="settings-help">{t.reminderAvailability}</p>
          <details className="quiet-details"><summary>{t.moreInfo}</summary><p id="reminder-availability-help" className="settings-help">{t.reminderHelp}</p></details>
          <button type="button" className="language-button" onClick={() => {
            setReminderPreview(true);
            if (reminderInput.sound) void playReminderSound();
            else stopReminderSound();
          }}>
            {t.testReminder}
          </button>
          <Fade visible={reminderPreview}><div className="reminder-preview">
            <p className="settings-help">{t.reminderPreviewHelp}</p>
            <ReminderNotice t={t} onAdd={() => { stopReminderSound(); setReminderPreview(false); }} onDismiss={() => { stopReminderSound(); setReminderPreview(false); }} />
          </div></Fade>
        </fieldset>
        <div className="dialog-actions">
          <button type="button" onClick={onClose} className="secondary">{t.cancel}</button>
          <button type="submit" className="save-button" disabled={!validInterval}>{t.save}</button>
        </div>
      </form>
    </dialog>
  );
}
