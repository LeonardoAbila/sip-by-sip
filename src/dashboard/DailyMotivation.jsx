import React from 'react';
import Icon from '../Icon.jsx';

export default function DailyMotivation({ rewards, t, format }) {
  return <dl className="daily-motivation" aria-label={t.achievements}>
    <div className="motivation-streak">
      <dt><Icon name="flame" /><span className="sr-only">{t.streak}</span></dt>
      <dd>{t.streakDays(rewards.streak)}</dd>
    </div>
    <div className="motivation-points">
      <dt><Icon name="star" /><span className="sr-only">{t.points}</span></dt>
      <dd>{t.pointsCount(format.format(rewards.points))}</dd>
    </div>
  </dl>;
}
