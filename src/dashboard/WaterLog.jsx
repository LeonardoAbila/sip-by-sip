import React from 'react';
import Icon from '../Icon.jsx';
import BottleSizeEditor from './BottleSizeEditor.jsx';
import WaterContainer from './WaterContainer.jsx';
import { remainingWater } from '../state.js';

export default function WaterLog({ state, t, format, onSaveSizes }) {
  const remaining = remainingWater(state);
  const remainingMl = remaining.ml;
  const bottleCount = state.entries.filter(entry => entry.container === 'bottle').length;
  const glassCount = state.entries.filter(entry => entry.container === 'glass').length;
  const otherCount = state.garrafas - bottleCount - glassCount;
  const legacyCount = state.garrafas - state.entries.length;
  const recordedContainers = Array.from({ length: Math.min(state.garrafas, 24) }, (_, index) =>
    index < legacyCount ? 'custom' : state.entries[index - legacyCount].container);
  return (
    <section className="bottle-card" aria-labelledby="bottle-log-title">
  <div className="card-heading"><h2 id="bottle-log-title">{t.bottleLog}</h2></div>
  <dl className="container-volumes">
    <div><dt><Icon name="bottle" />{t.bottleChoice}</dt><dd>{format.format(state.mlGarrafa)} ml</dd></div>
    <div><dt><Icon name="glass" />{t.glassChoice}</dt><dd>{format.format(state.mlCopo)} ml</dd></div>
  </dl>
  <BottleSizeEditor bottleSize={state.mlGarrafa} glassSize={state.mlCopo} t={t}
    onSave={onSaveSizes} />
  <p className="section-description" aria-live="polite">{t.containerCounts(bottleCount, glassCount, otherCount)}</p>
  <div className="bottles" aria-hidden="true">
    {recordedContainers.map((container, index) => <WaterContainer container={container} key={index} />)}
    {state.garrafas > 24 && <span className="overflow-count">+{state.garrafas - 24}</span>}
  </div>
  <div className="remaining-row"><span>{t.remaining}</span><strong>{format.format(remainingMl / 1000)} L</strong></div>
  <section className="remaining-containers" aria-label={t.remaining}>
    {remainingMl > 0 && <>
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
  );
}
