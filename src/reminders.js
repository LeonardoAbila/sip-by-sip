export const REMINDER_KEY = 'aguaReminders';
export const reminderIntervals = [15, 30, 60, 120];

export function readReminders() {
  const defaults = { enabled: false, minutes: 30, sound: true };
  try {
    const saved = JSON.parse(localStorage.getItem(REMINDER_KEY));
    return {
      enabled: saved?.enabled === true,
      sound: saved?.sound !== false,
      minutes: reminderIntervals.includes(saved?.minutes) ? saved.minutes : defaults.minutes,
    };
  } catch {
    return defaults;
  }
}
