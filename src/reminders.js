export const REMINDER_KEY = 'aguaReminders';
export const reminderIntervals = [15, 30, 60, 120];

export function validReminderMinutes(value) {
  return Number.isSafeInteger(value) && value > 0 && value * 60_000 <= Number.MAX_SAFE_INTEGER;
}

export function readReminders() {
  const defaults = { enabled: false, minutes: 30, sound: true };
  try {
    const saved = JSON.parse(localStorage.getItem(REMINDER_KEY));
    return {
      enabled: saved?.enabled === true,
      sound: saved?.sound !== false,
      minutes: validReminderMinutes(saved?.minutes) ? saved.minutes : defaults.minutes,
    };
  } catch {
    return defaults;
  }
}

// Store an absolute deadline so refreshes and delayed browser timers keep the time.
export function readReminderDeadline(storage, key, minutes, now = Date.now(), restart = false) {
  const next = now + minutes * 60_000;
  let deadline = next;
  try {
    const saved = JSON.parse(storage.getItem(key));
    if (!restart && saved?.minutes === minutes && Number.isSafeInteger(saved.deadline)
      && saved.deadline > 0 && saved.deadline <= next) deadline = saved.deadline;
    storage.setItem(key, JSON.stringify({ minutes, deadline }));
  } catch {
    // The reminder still runs if browser storage is unavailable.
  }
  return deadline;
}

export function remainingReminderSeconds(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function formatReminderCountdown(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const remaining = seconds % 60;
  const pad = value => String(value).padStart(2, '0');
  return `${hours ? `${pad(hours)}:` : ''}${pad(minutes)}:${pad(remaining)}`;
}
