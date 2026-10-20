import ProfileTransfer from './ProfileTransfer.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import Fade from '../Fade.jsx';
import { languages, translations } from '../language.js';
import { appColors } from '../theme.js';
import { positiveNumber, validVolume } from '../state.js';

export default function SettingsDialog({ bottleSize, dailyGoal, language, theme, color, onSave, onClose, fadingOut, profile, onExport, onImport }) {
  const dialog = useRef(null);
  const transferBusy = useRef(false);
  const [transferOpen, setTransferOpen] = useState(false);
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
    <dialog inert={fadingOut} ref={dialog} className="reset-dialog settings-dialog" onCancel={event => { event.preventDefault(); if (!transferBusy.current) onClose(); }} aria-labelledby={transferOpen ? 'transfer-title' : 'settings-title'}>
      {transferOpen ? <ProfileTransfer profile={profile} t={t} onExport={onExport} onImport={onImport}
        onBusy={value => { transferBusy.current = value; }} onBack={() => setTransferOpen(false)} /> : <>
      <form onSubmit={save}>
        <h2 id="settings-title">{t.settings}</h2>
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
        <details className="quiet-details"><summary>{t.moreInfo}</summary><p className="settings-help">{t.settingsHelp} {t.volumeHelp}</p></details>
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
        </fieldset>
        <div className="dialog-actions">
          <button type="button" onClick={onClose} className="secondary">{t.cancel}</button>
          <button type="submit" className="save-button" disabled={!validBottle || !validGoal}>{t.save}</button>
        </div>
      </form>
      {profile && <button type="button" className="secondary transfer-open" onClick={() => setTransferOpen(true)}>{t.transferTitle}</button>}
      </>}
    </dialog>
  );
}
