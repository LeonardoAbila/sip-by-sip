import React, { useId } from 'react';

export default function ReminderNotice({ t, onAdd, onDismiss, fadingOut, floating = false }) {
  const titleId = useId();
  return (
    <aside inert={fadingOut} className={`reminder-notice${floating ? ' reminder-toast' : ''}`} aria-labelledby={titleId}>
      <div role="alert">
        <h2 id={titleId}>{t.reminderTitle}</h2>
        <p>{t.reminderMessage}</p>
      </div>
      <div className="reminder-actions">
        <button type="button" className="save-button" onClick={onAdd}>{t.add}</button>
        <button type="button" className="secondary" onClick={onDismiss}>{t.dismissReminder}</button>
      </div>
    </aside>
  );
}
