import { calendarKey } from './state.js';

export function calendarStatus(key, state, current = calendarKey()) {
  if (key > current) return 'future';
  if (state.completedDays.includes(key)) return 'completed';
  if (key < state.startedOn) return 'untracked';
  if (key === current) return 'pending';
  return 'missed';
}

export function monthDays(year, month) {
  const first = new Date(year, month, 1, 12);
  const count = new Date(year, month + 1, 0, 12).getDate();
  return { offset: first.getDay(), days: Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month, index + 1, 12);
    return { day: index + 1, key: calendarKey(date), date };
  }) };
}

// Null means unknown (or future), while zero is an observed daily total.
export function calendarVolume(key, state, current = calendarKey()) {
  if (key > current) return null;
  if (key === current) return state.totalMl;
  return state.dailyTotals?.[key] ?? null;
}

export function formatCalendarVolume(totalMl, language) {
  const liters = totalMl >= 1000;
  const number = new Intl.NumberFormat(language, {
    maximumFractionDigits: liters ? 5 : 2,
  }).format(liters ? totalMl / 1000 : totalMl);
  return `${number} ${liters ? 'L' : 'ml'}`;
}
