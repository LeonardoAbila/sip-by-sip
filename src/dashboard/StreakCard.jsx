import React from 'react';

export default function StreakCard({ label, text }) {
  return (
    <section className="achievement-panel" aria-label={label}>
      <div><span className="achievement-symbol" aria-hidden="true">🔥</span><p>{label}</p><strong>{text}</strong></div>
    </section>
  );
}
