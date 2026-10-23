import React from 'react';
import Icon from '../Icon.jsx';

export default function StreakCard({ label, text }) {
  return (
    <section className="achievement-panel" aria-label={label}>
      <div><span className="achievement-symbol" aria-hidden="true"><Icon name="flame" /></span><p>{label}</p><strong>{text}</strong></div>
    </section>
  );
}
