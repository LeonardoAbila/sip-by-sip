import React from 'react';
import Icon from '../Icon.jsx';
import Fade from '../Fade.jsx';

export default function HydrationCard({ state, t, format, recordWater, onUndo }) {
  const percentage = Math.min((state.totalMl / (state.metaLitros * 1000)) * 100, 100);
  const total = state.totalMl >= 1000 ? `${format.format(state.totalMl / 1000)} L` : `${format.format(state.totalMl)} ml`;
  return (
    <section className="hydration-card" aria-label={t.consumption}>
      <div className="card-heading">
        <h2><Icon name="drop" />{t.consumption}</h2>
      </div>
      <div className="goal-ring" style={{ '--water-level': `${percentage}%` }}>
        <svg className="ring-svg" viewBox="0 0 260 260" aria-hidden="true">
          <circle className="ring-track" cx="130" cy="130" r="112" />
          <circle className="ring-value" cx="130" cy="130" r="112"
            strokeDasharray={2 * Math.PI * 112} strokeDashoffset={2 * Math.PI * 112 * (1 - percentage / 100)} />
        </svg>
        <div className="ring-content">
          <strong className="total">{total}</strong>
          <span className="goal-caption">{t.goalToday(format.format(state.metaLitros))}</span>
          <span className="percentage-pill">{Math.floor(percentage)}%</span>
        </div>
      </div>
      <Fade visible={percentage >= 100}><p className="success" role="status">{t.success}</p></Fade>
      <div className="record-container-actions">
        <button className="add-button" aria-label={`${t.add} · ${format.format(state.mlGarrafa)} ml`} onClick={() => recordWater(state.mlGarrafa, 'bottle')}>
          <Icon name="bottle" /><span className="button-label">{t.bottleChoice}</span><span className="button-volume">{format.format(state.mlGarrafa)} ml</span>
        </button>
        <button className="add-button add-glass-button" aria-label={`${t.addGlass} · ${format.format(state.mlCopo)} ml`} onClick={() => recordWater(state.mlCopo, 'glass')}>
          <Icon name="glass" /><span className="button-label">{t.glassChoice}</span><span className="button-volume">{format.format(state.mlCopo)} ml</span>
        </button>
        <button className="undo-water" type="button" aria-label={t.undoDrink} disabled={!state.entries.length} onClick={onUndo}>
          <Icon name="reset" />{t.undoShort}
        </button>
      </div>
    </section>
  );
}
