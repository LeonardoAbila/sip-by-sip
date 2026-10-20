import { useCallback, useEffect, useRef, useState } from 'react';
import { readReminders, readReminderDeadline, remainingReminderSeconds, REMINDER_KEY } from '../reminders.js';
import { playReminderSound, prepareReminderSound, stopReminderSound } from '../reminderSound.js';

export default function useWaterReminders(storageKey) {
  const [reminders, setReminders] = useState(readReminders);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [reminderCycle, setReminderCycle] = useState(0);
  const [reminderSeconds, setReminderSeconds] = useState(0);
  const reminderSoundEnabled = useRef(reminders.sound);
  reminderSoundEnabled.current = reminders.sound;
  const reminderAlarm = useRef({ due: false, sounded: false });
  const playDueReminder = useCallback(() => {
    if (!reminderSoundEnabled.current || !reminderAlarm.current.due || reminderAlarm.current.sounded) return;
    reminderAlarm.current.sounded = true;
    void playReminderSound().then(played => {
      if (!played) reminderAlarm.current.sounded = false;
    });
  }, []);

  function dismissReminder() {
    reminderAlarm.current = { due: false, sounded: false };
    stopReminderSound();
    setReminderVisible(false);
    setReminderCycle(previous => previous + 1);
  }

  useEffect(() => {
    try {
      localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
    } catch {
      // Preferences still work for this session when storage is unavailable.
    }
  }, [reminders]);

  useEffect(() => {
    if (!reminders.enabled || !reminders.sound) return;
    const unlockSound = () => { void prepareReminderSound().then(playDueReminder); };
    document.addEventListener('pointerdown', unlockSound);
    document.addEventListener('keydown', unlockSound);
    return () => {
      document.removeEventListener('pointerdown', unlockSound);
      document.removeEventListener('keydown', unlockSound);
      stopReminderSound();
    };
  }, [reminders, playDueReminder]);

  useEffect(() => {
    const deadlineKey = `${REMINDER_KEY}:deadline:${storageKey}`;
    setReminderVisible(false);
    reminderAlarm.current = { due: false, sounded: false };
    if (!reminders.enabled) {
      setReminderSeconds(0);
      try { localStorage.removeItem(deadlineKey); } catch { /* Keep working without storage. */ }
      return;
    }
    let deadline = Date.now() + reminders.minutes * 60_000;
    try {
      deadline = readReminderDeadline(localStorage, deadlineKey, reminders.minutes, Date.now(), reminderCycle > 0);
    } catch { /* Keep an in-memory timer if localStorage itself is blocked. */ }
    let shown = false;
    const checkReminder = () => {
      const seconds = remainingReminderSeconds(deadline);
      setReminderSeconds(seconds);
      if (!shown && seconds === 0 && document.visibilityState === 'visible') {
        shown = true;
        setReminderVisible(true);
        reminderAlarm.current.due = true;
        playDueReminder();
      }
    };
    checkReminder();
    const timer = setInterval(checkReminder, 1000);
    document.addEventListener('visibilitychange', checkReminder);
    window.addEventListener('focus', checkReminder);
    window.addEventListener('pageshow', checkReminder);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', checkReminder);
      window.removeEventListener('focus', checkReminder);
      window.removeEventListener('pageshow', checkReminder);
    };
  }, [reminders.enabled, reminders.minutes, reminderCycle, storageKey, playDueReminder]);

  function saveReminders(selectedReminders) {
    if (selectedReminders.enabled && selectedReminders.sound) void prepareReminderSound();
    setReminders(selectedReminders);
    dismissReminder();
  }

  return { reminders, reminderVisible, reminderSeconds, dismissReminder, saveReminders };
}
