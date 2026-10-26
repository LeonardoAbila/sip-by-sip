import React from 'react';
import Icon from '../Icon.jsx';

export default function DailyMotivation({ rewards, t }) {
  return <dl className="daily-motivation" aria-label={t.streak}>
    <div className="motivation-streak">
      <dt><Icon name="flame" /><span className="sr-only">{t.streak}</span></dt>
      <dd>{t.streakDays(rewards.streak)}</dd>
    </div>
  </dl>;
}
