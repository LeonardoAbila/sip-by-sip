import PourDialog from './dashboard/PourDialog.jsx';
import ReminderNotice from './dashboard/ReminderNotice.jsx';
import ResetDialog from './dashboard/ResetDialog.jsx';
import SettingsDialog from './dashboard/SettingsDialog.jsx';
import RemindersDialog from './dashboard/RemindersDialog.jsx';
import HydrationCard from './dashboard/HydrationCard.jsx';
import WaterLog from './dashboard/WaterLog.jsx';
import useWaterReminders from './dashboard/useWaterReminders.js';
import { saveProgress } from './database.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { achievements, currentDay, readState, rewardGoal, STORAGE_KEY, addWater, undoWater, resetWater, validVolume, selectedVolume } from './state.js';
import { readTheme, THEME_KEY, readColor, COLOR_KEY } from './theme.js';
import { LANGUAGE_KEY, readLanguage, translations } from './language.js';
import { formatReminderCountdown } from './reminders.js';
import Fade from './Fade.jsx';
import Icon from './Icon.jsx';
import HydrationCalendar from './HydrationCalendar.jsx';
import WaterBenefits, { benefitsCopy } from './WaterBenefits.jsx';

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
  const { reminders, reminderVisible, reminderSeconds, dismissReminder, saveReminders } = useWaterReminders(storageKey);

  useEffect(() => {
    document.documentElement.dataset.color = color;
    try { localStorage.setItem(COLOR_KEY, color); } catch {
      // Keep the selected color usable when browser storage is unavailable.
    }
  }, [color]);

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

  const format = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
  const containerVolume = selectedVolume(state);
  const isGlass = state.container === 'glass';
  const rewards = achievements(currentDay(state));
  const dateLabel = new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

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
          <HydrationCard state={state} t={t} format={format} recordWater={recordWater}
            onUndo={() => { closePour(); setState(undoWater); }} />
          <div className="daily-panel">
            <WaterLog state={state} t={t} format={format}
              onSaveSizes={(mlGarrafa, mlCopo) => setState(previous => ({ ...currentDay(previous), mlGarrafa, mlCopo }))} />
          </div>
        </div>
        <HydrationCalendar state={currentDay(state)} language={language} t={t} />
        <footer className="dashboard-footer">
          <button className="reset-button" onClick={() => setResetOpen(true)} disabled={state.garrafas === 0 && state.totalMl === 0}><Icon name="reset" />{t.reset}</button>
        </footer>
        <Fade visible={storageError}><p className="notice" role="alert">{t.storageError}</p></Fade>
        </div>
      <Fade visible={settingsOpen}><SettingsDialog language={language} theme={theme} color={color} bottleSize={state.mlGarrafa} dailyGoal={state.metaLitros}
        onSave={saveSettings} onClose={() => setSettingsOpen(false)} /></Fade>
      <Fade visible={remindersOpen}><RemindersDialog reminders={reminders} language={language}
        onSave={selected => { saveReminders(selected); setRemindersOpen(false); }} onClose={() => setRemindersOpen(false)} /></Fade>
      <Fade visible={pourAmount !== null}><PourDialog key={fillAnimation} t={t} amount={format.format(pourAmount ?? 0)} container={pourContainer} onClose={closePour} /></Fade>
      <Fade visible={resetOpen}><ResetDialog t={t} onConfirm={resetDay} onClose={() => setResetOpen(false)} /></Fade>
      </main>
    </>
  );
}
