import React, { useId, useState } from 'react';
import Icon from '../Icon.jsx';
import { validVolume } from '../state.js';

export default function BottleSizeEditor({ bottleSize, glassSize, t, onSave }) {
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
    <p id={`${inputId}-help`} className="settings-help">{t.containerSettingsHelp}</p>
    <div className="dialog-actions">
      <button type="button" className="secondary" onClick={cancel}>{t.cancel}</button>
      <button type="submit" className="save-button" disabled={!valid}>{t.save}</button>
    </div>
  </form>;
}
