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
