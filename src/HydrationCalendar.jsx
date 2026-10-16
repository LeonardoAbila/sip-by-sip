import React, { useId, useState } from 'react';
import { achievements, calendarKey } from './state.js';
import { calendarStatus, monthDays, calendarVolume, formatCalendarVolume, calendarMonth } from './calendar.js';

export default function HydrationCalendar({ state, language, t }) {
  const [selectedMonth, setMonth] = useState(() => { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() }; });
  const titleId = useId();
  const current = calendarKey();
  const currentMonth = current.slice(0, 7);
  const selectedKey = calendarKey(new Date(selectedMonth.year, selectedMonth.month, 1, 12)).slice(0, 7);
  const visibleMonth = calendarMonth(selectedKey, state.startedOn, current);
  const [year, monthNumber] = visibleMonth.split('-').map(Number);
  const month = { year, month: monthNumber - 1 };
  const displayed = new Date(month.year, month.month, 1, 12);
  const displayedMonth = calendarKey(displayed).slice(0, 7);
  const startMonth = calendarMonth(state.startedOn.slice(0, 7), state.startedOn, current);
  const { offset, days } = monthDays(month.year, month.month);
  const monthLabel = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(displayed);
  const fullDate = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' });
  const weekday = new Intl.DateTimeFormat(language, { weekday: 'short' });
  const weekdayLong = new Intl.DateTimeFormat(language, { weekday: 'long' });
  const streak = achievements(state).streak;
  const completedCount = days.filter(({ key }) => calendarStatus(key, state, current) === 'completed').length;
  const missedCount = days.filter(({ key }) => calendarStatus(key, state, current) === 'missed').length;

  function changeMonth(delta) {
    const date = new Date(month.year, month.month + delta, 1, 12);
    setMonth({ year: date.getFullYear(), month: date.getMonth() });
  }

  return <section className="hydration-calendar" aria-labelledby={titleId}>
    <div className="calendar-heading"><div><p className="eyebrow">{t.calendarEyebrow}</p><h2 id={titleId}>{t.calendarTitle}</h2></div><span className="calendar-streak">🔥 {t.streakDays(streak)}</span></div>
    <p className="calendar-description">{t.calendarStreakHelp(streak)}</p>
    <div className="calendar-navigation">
      <button type="button" className="theme-toggle" disabled={displayedMonth <= startMonth} onClick={() => changeMonth(-1)} aria-label={t.previousMonth}>‹</button>
      <h3 aria-live="polite">{monthLabel}</h3>
      <button type="button" className="theme-toggle" disabled={displayedMonth >= currentMonth} onClick={() => changeMonth(1)} aria-label={t.nextMonth}>›</button>
    </div>
    <div className="calendar-grid">
      {Array.from({ length: 7 }, (_, index) => {
        const date = new Date(2026, 9, 11 + index, 12);
        return <span className="calendar-weekday" key={index} aria-label={weekdayLong.format(date)}>{weekday.format(date)}</span>;
      })}
      {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
      {days.map(({ day, key, date }) => {
        const status = calendarStatus(key, state, current);
        const total = calendarVolume(key, state, current);
        const volume = key > current ? '' : total === null ? t.calendarNoData : formatCalendarVolume(total, language);
        const label = `${fullDate.format(date)}: ${t.calendarStatuses[status]}${volume ? ` · ${volume}` : ''}`;
        return <div key={key} className={`calendar-day calendar-${status}${key === current ? ' calendar-today' : ''}`} aria-label={label} aria-current={key === current ? 'date' : undefined} title={label}>
          <span aria-hidden="true">{day}</span><small aria-hidden="true">{status === 'completed' ? '✓' : status === 'missed' ? '×' : status === 'pending' ? '·' : '—'}</small>
          {volume && <span className="calendar-volume" aria-hidden="true">{volume}</span>}
        </div>;
      })}
    </div>
    <details className="quiet-details"><summary>{t.calendarLegend}</summary><div className="calendar-legend">
      {['completed', 'missed', 'pending', 'untracked'].map(status => <span key={status}><i className={`calendar-${status}`} aria-hidden="true">{status === 'completed' ? '✓' : status === 'missed' ? '×' : status === 'pending' ? '·' : '—'}</i>{t.calendarStatuses[status]}</span>)}
    </div>
    </details>
    <p className="calendar-summary">{t.calendarSummary(completedCount, missedCount)}</p>
  </section>;
}
