import { saveProgress } from './database.js';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { achievements, currentDay, positiveNumber, readState, rewardGoal, STORAGE_KEY, addWater, undoWater, resetWater, validVolume, selectedVolume, remainingWater } from './state.js';
import { readTheme, THEME_KEY, readColor, COLOR_KEY, appColors } from './theme.js';
import { languages, LANGUAGE_KEY, readLanguage, translations } from './language.js';
import { readReminders, reminderIntervals, validReminderMinutes, readReminderDeadline, remainingReminderSeconds, formatReminderCountdown, REMINDER_KEY } from './reminders.js';
import Fade from './Fade.jsx';
import Icon from './Icon.jsx';
import HydrationCalendar from './HydrationCalendar.jsx';
import WaterBenefits, { benefitsCopy } from './WaterBenefits.jsx';
import { playReminderSound, prepareReminderSound, stopReminderSound } from './reminderSound.js';

// A component is a function that returns the interface for one part of the app.
function Bottle({ animated = false, ghost = false }) {
  return (
    <svg className={`bottle${animated ? ' bottle-filling' : ''}${ghost ? ' bottle-ghost' : ''}`} viewBox="0 0 40 80" aria-hidden="true">
      <rect x="14" y="2" width="12" height="10" rx="2" fill="#9cb4cd" />
      <rect x="10" y="12" width="20" height="60" rx="6" fill="#d9efff" stroke="#1e88e5" strokeWidth="2" />
      <rect className="bottle-water" x="12" y="20" width="16" height="48" rx="4" fill="#64b5f6" />
      <path d="M15 20 V62" stroke="white" strokeWidth="2" opacity=".55" strokeLinecap="round" />
    </svg>
  );
}

function Glass({ ghost = false }) {
  return <svg className={`bottle glass${ghost ? ' bottle-ghost' : ''}`} viewBox="0 0 40 80" aria-hidden="true">
    <path d="M7 16 H33 L29 72 H11 Z" fill="#d9efff" stroke="#1e88e5" strokeWidth="2" />
    <path className="glass-water" d="M10 34 H30 L27 69 H13 Z" fill="#64b5f6" />
    <path d="M14 23 L16 62" stroke="white" strokeWidth="2" opacity=".55" strokeLinecap="round" />
  </svg>;
}

function WaterContainer({ container, ghost = false }) {
  if (container === 'glass') return <Glass ghost={ghost} />;
  if (container === 'custom') return <span className="other-water-entry"><Icon name="drop" /></span>;
  return <Bottle ghost={ghost} />;
}

function PourDialog({ t, amount, container, onClose, fadingOut }) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    const timer = setTimeout(onClose, 3400);
    return () => { clearTimeout(timer); element.close(); };
  }, [onClose]);

  return (
    <dialog inert={fadingOut} ref={dialog} className="pour-dialog" aria-labelledby="pour-title" onCancel={event => { event.preventDefault(); onClose(); }}>
      <button autoFocus className="pour-close" onClick={onClose} aria-label={t.close}>×</button>
      <h2 id="pour-title">{t.waterAdded}</h2>
      <p className="pour-amount">+{amount} ml{container === 'glass' ? ` · ${t.glassChoice}` : container === 'bottle' ? ` · ${t.bottleChoice}` : ''}</p>
      <svg className="pour-scene" viewBox="0 0 320 300" aria-hidden="true">
        <ellipse cx="186" cy="278" rx="66" ry="10" fill="currentColor" opacity=".08" />
        <g className="pour-jug">
          <path d="M70 48 H105 L120 64 H176 L153 88 L144 142 Q140 156 126 156 H83 Q70 156 68 141 L58 64 Z"
            fill="#d9efff" stroke="#399de5" strokeWidth="4" strokeLinejoin="round" />
          <path d="M66 82 H150 L140 139 Q138 148 125 148 H85 Q77 148 76 137 Z" fill="#64b5f6" />
          <path d="M64 75 H49 Q30 75 34 101 Q36 122 66 122" fill="none" stroke="#399de5" strokeWidth="9" />
          <path d="M86 67 L92 130" stroke="white" strokeWidth="5" opacity=".65" strokeLinecap="round" />
        </g>
        <path className="pour-stream" d="M176 64 Q188 86 188 135" fill="none" stroke="#64b5f6" strokeWidth="9" strokeLinecap="round" />
        <path d={container === 'glass' ? 'M150 126 H226 L214 270 H162 Z' : 'M173 126 H203 V150 Q222 160 222 178 V255 Q222 270 208 270 H168 Q154 270 154 255 V178 Q154 160 173 150 Z'}
          fill="#d9efff" stroke="#399de5" strokeWidth="4" />
        {container === 'glass'
          ? <path className="pour-water" d="M161 174 H215 L207 264 H169 Z" fill="#42a5f5" />
          : <rect className="pour-water" x="160" y="174" width="56" height="90" rx="10" fill="#42a5f5" />}
        <path d="M167 181 V250" stroke="white" strokeWidth="5" opacity=".65" strokeLinecap="round" />
        <rect x="163" y="200" width="50" height="30" rx="8" fill="#fff" opacity=".85" />
        <path d="M188 205 Q177 216 188 224 Q199 216 188 205" fill="#399de5" />
      </svg>
    </dialog>
  );
}

function ReminderNotice({ t, onAdd, onDismiss, fadingOut, floating = false }) {
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

function ResetDialog({ onConfirm, onClose, t, fadingOut }) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog inert={fadingOut} ref={dialog} className="reset-dialog" onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="reset-title">
      <h2 id="reset-title">{t.resetTitle}</h2>
      <p>{t.resetHelp}</p>
      <div className="dialog-actions">
        <button autoFocus onClick={onClose} className="secondary">{t.cancel}</button>
        <button onClick={onConfirm} className="danger">{t.reset}</button>
      </div>
    </dialog>
  );
}

function BottleSizeEditor({ bottleSize, glassSize, t, onSave }) {
  const [editing, setEditing] = useState(false);
  const [container, setContainer] = useState('bottle');
  const [inputs, setInputs] = useState({ bottle: String(bottleSize), glass: String(glassSize) });
  const inputId = useId();
  const valid = validVolume(inputs.bottle) && validVolume(inputs.glass);
  const validSelected = validVolume(inputs[container]);

  function cancel() {
    setEditing(false);
    setInputs({ bottle: String(bottleSize), glass: String(glassSize) });
  }

  function save(event) {
    event.preventDefault();
    if (!valid) return;
    onSave(Number(inputs.bottle), Number(inputs.glass));
    setEditing(false);
  }

  if (!editing) return <button type="button" className="bottle-edit-button" onClick={() => {
    setInputs({ bottle: String(bottleSize), glass: String(glassSize) });
    setContainer('bottle');
    setEditing(true);
  }}>
    <Icon name="drop" /> {t.changeBottleSize}
  </button>;

  return <form className="bottle-size-editor" onSubmit={save} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); cancel(); }
  }}>
    <div className="container-options" role="group" aria-label={t.changeBottleSize}>
      {['bottle', 'glass'].map(type => <button key={type} type="button" aria-pressed={container === type}
        onClick={() => setContainer(type)}><Icon name={type} />{type === 'glass' ? t.glassChoice : t.bottleChoice}</button>)}
    </div>
    <label htmlFor={inputId}>{container === 'glass' ? t.glassSize : t.bottleSize}</label>
    <input autoFocus required id={inputId} type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01"
      value={inputs[container]} aria-invalid={!validSelected} aria-describedby={`${inputId}-help${valid ? '' : ` ${inputId}-error`}`}
      onChange={event => setInputs(previous => ({ ...previous, [container]: event.target.value }))} />
    {!valid && <p id={`${inputId}-error`} className="notice" role="alert">{t.volumeHelp}</p>}
    <p id={`${inputId}-help`} className="settings-help">{t.containerSettingsHelp} {t.volumeHelp}</p>
    <div className="dialog-actions">
      <button type="button" className="secondary" onClick={cancel}>{t.cancel}</button>
      <button type="submit" className="save-button" disabled={!valid}>{t.save}</button>
    </div>
  </form>;
}

// Keep edits local to this dialog until the user chooses Save.
function SettingsDialog({ bottleSize, dailyGoal, language, theme, color, onSave, onClose, fadingOut }) {
  const dialog = useRef(null);
  const [bottleInput, setBottleInput] = useState(String(bottleSize));
  const [goalInput, setGoalInput] = useState(String(dailyGoal));
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedColor, setSelectedColor] = useState(color);
  const t = translations[selectedLanguage];
  const validBottle = validVolume(bottleInput);
  const validGoal = positiveNumber(goalInput);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  function save(event) {
    event.preventDefault();
    if (validBottle && validGoal) onSave(Number(bottleInput), Number(goalInput), selectedLanguage, selectedTheme, selectedColor);
  }

  return (
    <dialog inert={fadingOut} ref={dialog} className="reset-dialog settings-dialog" onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="settings-title">
      <form onSubmit={save}>
        <h2 id="settings-title">{t.settings}</h2>
        <p>{t.settingsIntro}</p>
      <div className="settings">
        <label htmlFor="bottle-size">{t.bottleSize}
          <input autoFocus required id="bottle-size" type="number" min="0.01" max="1000000" step="0.01" value={bottleInput}
            aria-invalid={!validBottle} aria-describedby={!validBottle ? 'settings-error' : undefined}
            onChange={event => setBottleInput(event.target.value)} />
        </label>
        <label htmlFor="daily-goal">{t.dailyGoal}
          <input required id="daily-goal" type="number" min="0" step="any" value={goalInput}
            aria-invalid={!validGoal} aria-describedby={!validGoal ? 'settings-error' : undefined}
            onChange={event => setGoalInput(event.target.value)} />
        </label>
      </div>
      {(!validBottle || !validGoal) && <p id="settings-error" className="notice" role="alert">{t.invalid}</p>}
        <p className="settings-help">{t.settingsHelp} {t.volumeHelp}</p>
        <div className="language-control">
          <button type="button" className="language-button" aria-expanded={languagesOpen}
            aria-controls="language-options" onClick={() => setLanguagesOpen(previous => !previous)}>
            <span aria-hidden="true">🌐</span> {t.language}: <span lang={selectedLanguage}>{languages[selectedLanguage]}</span>
          </button>
          <Fade visible={languagesOpen}><div id="language-options" className="language-options" role="group" aria-label={t.language}>
            {Object.entries(languages).map(([code, name]) => (
              <button key={code} type="button" lang={code} aria-pressed={selectedLanguage === code}
                onClick={() => setSelectedLanguage(code)}>{name}</button>
            ))}
          </div></Fade>
        </div>
        <fieldset className="appearance-settings">
          <legend>{t.appearance}</legend>
          <label className="reminder-switch">
            <input type="checkbox" checked={selectedTheme === 'dark'}
              onChange={event => setSelectedTheme(event.target.checked ? 'dark' : 'light')} />
            <Icon name={selectedTheme === 'dark' ? 'moon' : 'sun'} /> {t.darkMode}
          </label>
          <p id="favorite-color-label">{t.favoriteColor}</p>
          <div className="color-options" role="group" aria-labelledby="favorite-color-label">
            {appColors.map(option => (
              <button type="button" className="color-option" key={option} aria-pressed={selectedColor === option}
                onClick={() => setSelectedColor(option)}>
                <span className={`color-swatch swatch-${option}`} aria-hidden="true">{selectedColor === option && <Icon name="check" />}</span>
                {t.colors[option]}
              </button>
            ))}
          </div>
          <p className="settings-help">{t.appearanceHelp}</p>
        </fieldset>
        <div className="dialog-actions">
          <button type="button" onClick={onClose} className="secondary">{t.cancel}</button>
          <button type="submit" className="save-button" disabled={!validBottle || !validGoal}>{t.save}</button>
        </div>
      </form>
    </dialog>
  );
}

function RemindersDialog({ reminders, language, onSave, onClose, fadingOut }) {
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
        <fieldset className="reminder-settings" aria-describedby="reminder-availability-help">
          <legend>{t.reminders}</legend>
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
          <p id="reminder-availability-help" className="settings-help">{t.reminderHelp}</p>
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

export default function App({ profile, onLogout }) {
  const [screen, setScreen] = useState(() => window.location.hash === '#benefits' ? 'benefits' : 'home');
  const homeHeading = useRef(null);
  useEffect(() => {
    const navigate = () => {
      const next = window.location.hash === '#benefits' ? 'benefits' : 'home';
      setScreen(next);
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    if (screen === 'home') homeHeading.current?.focus();
    window.scrollTo(0, 0);
  }, [screen]);
  // State is the app's memory. Updating it tells React to render the screen again.
  const storageKey = profile ? `${STORAGE_KEY}:perfil:${profile.id}` : STORAGE_KEY;
  const [state, setState] = useState(() => readState(storageKey, profile?.goalLiters ?? 2));
  const [fillAnimation, setFillAnimation] = useState(0);
  const [pourAmount, setPourAmount] = useState(null);
  const [pourContainer, setPourContainer] = useState('bottle');
  const closePour = useCallback(() => setPourAmount(null), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const [color, setColor] = useState(readColor);
  const [language, setLanguage] = useState(readLanguage);
  const t = translations[language];
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

  useEffect(() => {
    document.documentElement.dataset.color = color;
    try { localStorage.setItem(COLOR_KEY, color); } catch {
      // Keep the selected color usable when browser storage is unavailable.
    }
  }, [color]);

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

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.title;
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Keep the selected language for this session if storage is unavailable.
    }
  }, [language, t]);

  // One state value selects a whole palette through CSS variables.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Keep the selected theme for this session even if it cannot be saved.
    }
  }, [theme]);

  // Effects synchronize React state with things outside React, such as storage.
  useEffect(() => {
    let active = true;
    saveProgress(storageKey, state).then(
      () => { if (active) setStorageError(false); },
      () => { if (active) setStorageError(true); },
    );
    return () => { active = false; };
  }, [state, storageKey]);

  useEffect(() => {
    const checkDay = () => setState(currentDay);
    const interval = setInterval(checkDay, 30_000);
    window.addEventListener('focus', checkDay);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkDay);
    };
  }, []);

  // These values are calculated from state; they don't need their own useState.
  const percentage = Math.min((state.totalMl / (state.metaLitros * 1000)) * 100, 100);
  const format = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
  const total = state.totalMl >= 1000 ? `${format.format(state.totalMl / 1000)} L` : `${format.format(state.totalMl)} ml`;

  const remaining = remainingWater(state);
  const remainingMl = remaining.ml;
  const containerVolume = selectedVolume(state);
  const isGlass = state.container === 'glass';
  const bottleCount = state.entries.filter(entry => entry.container === 'bottle').length;
  const glassCount = state.entries.filter(entry => entry.container === 'glass').length;
  const otherCount = state.garrafas - bottleCount - glassCount;
  const legacyCount = state.garrafas - state.entries.length;
  const recordedContainers = Array.from({ length: Math.min(state.garrafas, 24) }, (_, index) =>
    index < legacyCount ? 'custom' : state.entries[index - legacyCount].container);
  const rewards = achievements(currentDay(state));
  const dateLabel = new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  function saveReminders(selectedReminders) {
    if (selectedReminders.enabled && selectedReminders.sound) void prepareReminderSound();
    setReminders(selectedReminders);
    dismissReminder();
    setRemindersOpen(false);
  }

  function saveSettings(mlGarrafa, metaLitros, selectedLanguage, selectedTheme, selectedColor) {
    setTheme(selectedTheme);
    setColor(selectedColor);
    setLanguage(selectedLanguage);
    setState(previous => rewardGoal({ ...currentDay(previous), mlGarrafa, metaLitros }));
    setSettingsOpen(false);
  }

  function recordWater(amount = containerVolume, container = state.container) {
    if (!validVolume(amount)) return;
    dismissReminder();
    // A fresh key restarts the animation on every click, even after 24 bottles.
    setFillAnimation(previous => previous + 1);
    setPourAmount(Number(amount));
    setPourContainer(container);
    setState(previous => addWater({ ...previous, container: container === 'custom' ? previous.container : container }, Number(amount), container));
  }

  function resetDay() {
    setFillAnimation(0);
    setPourAmount(null);
    setState(resetWater);
    setResetOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <nav className="navbar" aria-label={t.navigation}>
          <a className="nav-brand" href="#home">
            <span className="brand-mark"><Icon name="drop" /></span> {t.title}
          </a>
          <div className="nav-actions">
            <a className="theme-toggle" href="#home" aria-current={screen === 'home' ? 'page' : undefined}><Icon name="home" />{t.home}</a>
            <a className="theme-toggle" href="#benefits" aria-current={screen === 'benefits' ? 'page' : undefined}><Icon name="heart" />{benefitsCopy[language].nav}</a>
            <button className="theme-toggle" aria-haspopup="dialog" onClick={() => setSettingsOpen(true)}>
              <Icon name="settings" /> {t.settings}
            </button>
          </div>
          {profile && <button type="button" className="theme-toggle nav-logout" onClick={onLogout}><Icon name="logout" /> {t.exit}</button>}
        </nav>
      </header>
      <main className="app">
        <Fade visible={reminderVisible}><ReminderNotice floating t={{ ...t, add: isGlass ? t.addGlass : t.add }} onAdd={() => recordWater()} onDismiss={dismissReminder} /></Fade>
        {screen === 'benefits' && <WaterBenefits language={language} />}
        <div id="home" hidden={screen !== 'home'}>
        <header className="page-heading">
          <div>
            <h1 ref={homeHeading} tabIndex={-1}>{t.dashboardTitle}</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
          <p className="date-chip"><span className="status-dot" />{dateLabel}</p>
        </header>
        <div className="daily-summary">
        <section className="achievement-panel" aria-label={t.streak}>
          <div><span className="achievement-symbol" aria-hidden="true">🔥</span><p>{t.streak}</p><strong>{t.streakDays(rewards.streak)}</strong></div>
        </section>
        <section className="reminder-card" aria-labelledby="reminder-card-title">
          <span className="reminder-card-icon"><Icon name="bell" /></span>
          <div><h2 id="reminder-card-title">{t.reminders}</h2><p>{reminders.enabled ? t.everyMinutes(reminders.minutes) : t.remindersOff}</p>
            <p className="settings-help">{t.reminderAvailability}</p>
            {reminders.enabled && <p className={reminderVisible ? 'reminder-countdown is-due' : 'reminder-countdown'} role="timer" aria-live="off">
              {reminderVisible ? t.reminderDue : <>{t.nextReminder} <span>{formatReminderCountdown(reminderSeconds)}</span></>}
            </p>}
          </div>
          <button className="icon-button" onClick={() => setRemindersOpen(true)} aria-label={t.reminders} aria-haspopup="dialog"><Icon name="arrow" /></button>
        </section>
        </div>
        <div className="dashboard-grid">
          <section className="hydration-card" aria-label={t.consumption}>
            <div className="card-heading">
              <h2><Icon name="drop" />{t.consumption}</h2>
            </div>
            <div className="goal-ring">
              <svg className="ring-svg" viewBox="0 0 260 260" aria-hidden="true">
                <circle className="ring-track" cx="130" cy="130" r="112" />
                <circle className="ring-value" cx="130" cy="130" r="112"
                  strokeDasharray={2 * Math.PI * 112} strokeDashoffset={2 * Math.PI * 112 * (1 - percentage / 100)} />
              </svg>
              <div className="ring-content" aria-live="polite">
                <span className="ring-drop"><Icon name="drop" /></span>
                <strong className="total">{total}</strong>
                <span className="goal-caption">{t.goalToday(format.format(state.metaLitros))}</span>
                <span className="percentage-pill">{Math.floor(percentage)}% · {t.progress}</span>
              </div>
            </div>
            <Fade visible={percentage >= 100}><p className="success" role="status">{t.success}</p></Fade>
            <div className="record-container-actions">
              <button className="add-button" onClick={() => recordWater(state.mlGarrafa, 'bottle')}>
                <Icon name="bottle" /><span>{t.add}</span><span className="button-volume">{format.format(state.mlGarrafa)} ml</span>
              </button>
              <button className="add-button add-glass-button" onClick={() => recordWater(state.mlCopo, 'glass')}>
                <Icon name="glass" /><span>{t.addGlass}</span><span className="button-volume">{format.format(state.mlCopo)} ml</span>
              </button>
            <button className="undo-water" type="button" disabled={!state.entries.length} onClick={() => { closePour(); setState(undoWater); }}>
              <Icon name="reset" />{t.undoDrink}
            </button>
            </div>
            <p className="card-note"><Icon name="check" />{t.smallSteps}</p>
          </section>
          <div className="daily-panel">
            <section className="bottle-card" aria-labelledby="bottle-log-title">
              <div className="card-heading"><h2 id="bottle-log-title">{t.bottleLog}</h2></div>
              <dl className="bottle-settings">
                <div><dt><span className="stat-icon"><Icon name="target" /></span>{t.dailyGoal}</dt><dd>{format.format(state.metaLitros)} <small>L</small></dd></div>
                <div><dt><span className="stat-icon warm"><Icon name={state.container} /></span>{isGlass ? t.glass : t.bottle}</dt><dd>{format.format(containerVolume)} <small>ml</small></dd></div>
              </dl>
              <BottleSizeEditor bottleSize={state.mlGarrafa} glassSize={state.mlCopo} t={t}
                onSave={(mlGarrafa, mlCopo) => setState(previous => ({ ...currentDay(previous), mlGarrafa, mlCopo }))} />
              <p className="section-description">{t.bottles(state.garrafas)}</p>
              <p className="section-description" aria-live="polite">{t.containerCounts(bottleCount, glassCount, otherCount)}</p>
              <div className="bottles" aria-hidden="true">
                {recordedContainers.map((container, index) => <WaterContainer container={container} key={index} />)}
                {state.garrafas > 24 && <span className="overflow-count">+{state.garrafas - 24}</span>}
              </div>
              <div className="remaining-row"><span>{t.remaining}</span><strong>{format.format(remainingMl / 1000)} L</strong></div>
              <section className="remaining-containers" aria-label={t.remaining}>
                {remainingMl === 0 ? <p className="success" role="status">{t.success}</p> : <>
                  <p className="section-description">{t.remainingOptionsHelp}</p>
                  <div className="remaining-options">
                    {['bottle', 'glass'].map((container, index) => {
                      const count = container === 'glass' ? remaining.glasses : remaining.bottles;
                      const volume = container === 'glass' ? state.mlCopo : state.mlGarrafa;
                      return <React.Fragment key={container}>
                        {index === 1 && <span className="remaining-or">{t.or}</span>}
                        <div className="remaining-option">
                          <p className="remaining-count" aria-live="polite">{container === 'glass' ? t.glassesNeeded(count) : t.bottlesNeeded(count)}</p>
                          <small>{format.format(volume)} ml</small>
                          <div className="remaining-icons" aria-hidden="true">
                            {Array.from({ length: Math.min(count, 24) }, (_, item) => <WaterContainer container={container} ghost key={item} />)}
                            {count > 24 && <span className="overflow-count ghost-count">+{format.format(count - 24)}</span>}
                          </div>
                        </div>
                      </React.Fragment>;
                    })}
                  </div>
                </>}
              </section>
            </section>
          </div>
        </div>
        <HydrationCalendar state={currentDay(state)} language={language} t={t} />
        <footer className="dashboard-footer">
          <p className="footnote"><Icon name="reset" />{t.footnote}</p>
          <button className="reset-button" onClick={() => setResetOpen(true)} disabled={state.garrafas === 0 && state.totalMl === 0}><Icon name="reset" />{t.reset}</button>
        </footer>
        <Fade visible={storageError}><p className="notice" role="alert">{t.storageError}</p></Fade>
        </div>
      <Fade visible={settingsOpen}><SettingsDialog language={language} theme={theme} color={color} bottleSize={state.mlGarrafa} dailyGoal={state.metaLitros}
        onSave={saveSettings} onClose={() => setSettingsOpen(false)} /></Fade>
      <Fade visible={remindersOpen}><RemindersDialog reminders={reminders} language={language}
        onSave={saveReminders} onClose={() => setRemindersOpen(false)} /></Fade>
      <Fade visible={pourAmount !== null}><PourDialog key={fillAnimation} t={t} amount={format.format(pourAmount ?? 0)} container={pourContainer} onClose={closePour} /></Fade>
      <Fade visible={resetOpen}><ResetDialog t={t} onConfirm={resetDay} onClose={() => setResetOpen(false)} /></Fade>
      </main>
    </>
  );
}
