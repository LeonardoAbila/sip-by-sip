import React, { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { remainingWater } from '../state.js';

export default function HydrationCard({ state, t, format, recordWater, onUndo, earnedToday }) {
  const percentage = Math.min((state.totalMl / (state.metaLitros * 1000)) * 100, 100);
  const total = state.totalMl >= 1000 ? `${format.format(state.totalMl / 1000)} L` : `${format.format(state.totalMl)} ml`;
  const remaining = remainingWater(state).ml;
  const remainingLabel = remaining >= 1000 ? `${format.format(remaining / 1000)} L` : `${format.format(remaining)} ml`;
  const previousReward = useRef(earnedToday);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (earnedToday && !previousReward.current) setCelebrating(true);
    previousReward.current = earnedToday;
  }, [earnedToday]);
  useEffect(() => { if (percentage < 100) setCelebrating(false); }, [percentage]);
  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), 1800);
    return () => clearTimeout(timer);
  }, [celebrating]);
  const encouragement = percentage >= 100 ? t.buddyComplete : percentage >= 50 ? t.buddyProgress : t.buddyStart;
  return (
    <section className={`hydration-card${celebrating ? ' is-celebrating' : ''}`} aria-label={t.consumption}>
      {celebrating && <div className="goal-celebration" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>}
      <div className="card-heading">
        <h2><Icon name="drop" />{t.consumption}</h2>
        <p className="buddy-encouragement">{encouragement}</p>
      </div>
      <div className="hydration-workspace">
      <div className="progress-overview">
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
      <p className={`buddy-message${percentage >= 100 ? ' success' : ''}`} role={percentage >= 100 ? 'status' : undefined}>
        {percentage >= 100 ? t.success : t.remainingToday(remainingLabel)}
      </p>
      </div>
      <div className="record-panel">
      <h3>{t.addDrink}</h3>
      <p className="record-help">{t.chooseContainer}</p>
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
      </div>
      </div>
    </section>
  );
}
