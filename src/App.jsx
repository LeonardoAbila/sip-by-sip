import StreakCard from './dashboard/StreakCard.jsx';
import DailyMotivation from './dashboard/DailyMotivation.jsx';
import DrinkDialog from './dashboard/DrinkDialog.jsx';
import DashboardNav from './dashboard/DashboardNav.jsx';
import ReminderNotice from './dashboard/ReminderNotice.jsx';
import ResetDialog from './dashboard/ResetDialog.jsx';
import SettingsDialog from './dashboard/SettingsDialog.jsx';
import HydrationCard from './dashboard/HydrationCard.jsx';
import WaterLog from './dashboard/WaterLog.jsx';
import useWaterReminders from './dashboard/useWaterReminders.js';
import { saveProgress, exportProfile, restoreProfile } from './database.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { achievements, currentDay, readState, rewardGoal, STORAGE_KEY, addWater, undoWater, resetWater, validVolume, selectedVolume } from './state.js';
import { readTheme, THEME_KEY, readColor, COLOR_KEY } from './theme.js';
import { LANGUAGE_KEY, readLanguage, translations } from './language.js';
import Fade from './Fade.jsx';
import Icon from './Icon.jsx';
import HydrationCalendar from './HydrationCalendar.jsx';
import WaterBenefits, { benefitsCopy } from './WaterBenefits.jsx';

function currentScreen() {
  return { '#home': 'home', '#history': 'history', '#benefits': 'benefits' }[window.location.hash] ?? 'home';
}

export default function App({ profile, onLogout, onProfileRestored, importComplete = false }) {
  const [screen, setScreen] = useState(currentScreen);
  const homeHeading = useRef(null);
  const historyHeading = useRef(null);
  useEffect(() => {
    const navigate = () => {
      setScreen(currentScreen());
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    if (screen === 'home') homeHeading.current?.focus();
    if (screen === 'history') historyHeading.current?.focus();
    window.scrollTo(0, 0);
  }, [screen]);
  // State is the app's memory. Updating it tells React to render the screen again.
  const storageKey = profile ? `${STORAGE_KEY}:perfil:${profile.id}` : STORAGE_KEY;
  const [state, setState] = useState(() => readState(storageKey, profile?.goalLiters ?? 2));
  const [confirmation, setConfirmation] = useState(null);
  const [drinkEntry, setDrinkEntry] = useState(null);
  const closeDrink = useCallback(() => setDrinkEntry(null), []);
  const confirmationId = useRef(0);
  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmation]);
  useEffect(() => { setConfirmation(null); setDrinkEntry(null); }, [screen]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const transferBusy = useRef(false);
  const pendingSave = useRef(Promise.resolve());
  const [theme, setTheme] = useState(readTheme);
  const [color, setColor] = useState(readColor);
  const [language, setLanguage] = useState(readLanguage);
  const t = translations[language];
  const { reminders, reminderVisible, reminderSeconds, dismissReminder, saveReminders } = useWaterReminders(storageKey, importComplete);

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
    if (transferBusy.current) return;
    let active = true;
    const operation = saveProgress(storageKey, state);
    pendingSave.current = operation;
    operation.then(
      () => { if (active) setStorageError(false); },
      () => { if (active) setStorageError(true); },
    );
    return () => { active = false; };
  }, [state, storageKey]);

  useEffect(() => {
    const checkDay = () => { if (!transferBusy.current) setState(currentDay); };
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

  async function downloadProfile() {
    transferBusy.current = true;
    try {
      await pendingSave.current.catch(() => {});
      // Explicitly flush the current render, including an immediate add/export.
      await saveProgress(storageKey, currentDay(state));
      return await exportProfile(profile.id);
    } finally { transferBusy.current = false; }
  }

  async function importProfile(backup) {
    transferBusy.current = true;
    let committed = false;
    try {
      await pendingSave.current.catch(() => {});
      const restored = await restoreProfile(profile.id, backup);
      committed = true;
      setConfirmation(null);
      closeDrink();
      dismissReminder();
      onProfileRestored(restored);
    } finally { if (!committed) transferBusy.current = false; }
  }

  function saveSettings(mlGarrafa, metaLitros, selectedLanguage, selectedTheme, selectedColor) {
    if (transferBusy.current) return;
    setTheme(selectedTheme);
    setColor(selectedColor);
    setLanguage(selectedLanguage);
    setState(previous => rewardGoal({ ...currentDay(previous), mlGarrafa, metaLitros }));
    setSettingsOpen(false);
  }

  function recordWater(amount = containerVolume, container = state.container) {
    if (transferBusy.current || !validVolume(amount)) return;
    dismissReminder();
    const entry = { id: ++confirmationId.current, amount: Number(amount), container };
    setConfirmation(entry);
    setDrinkEntry(entry);
    setState(previous => addWater({ ...previous, container: container === 'custom' ? previous.container : container }, Number(amount), container));
  }

  function resetDay() {
    if (transferBusy.current) return;
    setConfirmation(null);
    closeDrink();
    setState(resetWater);
    setResetOpen(false);
  }

  return (
    <>
      <DashboardNav screen={screen} t={t} benefitsLabel={benefitsCopy[language].nav} showLogout={Boolean(profile)}
        onOpenSettings={() => setSettingsOpen(true)} onLogout={onLogout} />
      <main className={`app app-${screen}`}>
        {importComplete && <p role="status" className="success">{t.transferSuccess}</p>}
        <Fade visible={reminderVisible}><ReminderNotice floating t={{ ...t, add: isGlass ? t.addGlass : t.add }} onAdd={() => recordWater()} onDismiss={dismissReminder} /></Fade>
        {screen === 'benefits' && <WaterBenefits language={language} />}
        <div id="home" hidden={screen !== 'home'}>
          <header className="page-heading">
            <div>
              <h1 ref={homeHeading} tabIndex={-1}>{t.dashboardTitle}</h1>
            </div>
            <p className="date-chip"><span className="status-dot" />{dateLabel}</p>
          </header>
          <DailyMotivation rewards={rewards} t={t} format={format} />
          <HydrationCard state={state} t={t} format={format} recordWater={recordWater}
            earnedToday={rewards.earnedToday}
            onUndo={() => { if (!transferBusy.current) { setConfirmation(null); closeDrink(); setState(undoWater); } }} />
        </div>
        <section id="history" hidden={screen !== 'history'} aria-labelledby="history-title">
          <header className="page-heading"><h1 id="history-title" tabIndex={-1} ref={historyHeading}>{t.history}</h1></header>
          <div className="history-overview">
            <StreakCard label={t.streak} text={t.streakDays(rewards.streak)} />
            <WaterLog state={state} t={t} format={format}
              onSaveSizes={(mlGarrafa, mlCopo) => { if (!transferBusy.current) setState(previous => ({ ...currentDay(previous), mlGarrafa, mlCopo })); }} />
          </div>
          <HydrationCalendar state={currentDay(state)} language={language} t={t} />
          <footer className="dashboard-footer">
            <button className="reset-button" onClick={() => setResetOpen(true)} disabled={state.garrafas === 0 && state.totalMl === 0}><Icon name="reset" />{t.reset}</button>
          </footer>
        </section>
        <p className="water-confirmation" role="status" aria-live="polite" aria-atomic="true">
          {confirmation && <span key={confirmation.id}>{t.waterRecorded(format.format(confirmation.amount))}</span>}
        </p>
        <Fade visible={storageError}><p className="notice" role="alert">{t.storageError}</p></Fade>
        <Fade visible={settingsOpen}><SettingsDialog language={language} theme={theme} color={color} bottleSize={state.mlGarrafa} dailyGoal={state.metaLitros}
          reminders={reminders} reminderSeconds={reminderSeconds} onSaveReminders={saveReminders}
          profile={profile} onExport={downloadProfile} onImport={importProfile}
          onSave={saveSettings} onClose={() => setSettingsOpen(false)} /></Fade>
        <Fade visible={resetOpen}><ResetDialog t={t} onConfirm={resetDay} onClose={() => setResetOpen(false)} /></Fade>
        {drinkEntry && <DrinkDialog key={drinkEntry.id} entry={drinkEntry} t={t} format={format} onClose={closeDrink} />}
      </main>
    </>
  );
}
