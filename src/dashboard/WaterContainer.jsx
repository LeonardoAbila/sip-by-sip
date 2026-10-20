import React from 'react';
import Icon from '../Icon.jsx';

function Bottle({ animated = false, ghost = false }) {
  return (
    <svg className={`bottle${animated ? ' bottle-filling' : ''}${ghost ? ' bottle-ghost' : ''}`} viewBox="0 0 40 80" aria-hidden="true">
      <rect x="14" y="2" width="12" height="10" rx="2" fill="#9cb4cd" />
      <rect x="10" y="12" width="20" height="60" rx="6" fill="#d9efff" stroke="#1e88e5" strokeWidth="2" />
      <rect className="bottle-water" x="12" y="20" width="16" height="48" rx="4" fill="#64b5f6" />
      <path d="M15 20 V62" stroke="white" strokeWidth="2" opacity=".55" strokeLinecap="round" />
    </svg>
  );
}

function Glass({ ghost = false }) {
  return <svg className={`bottle glass${ghost ? ' bottle-ghost' : ''}`} viewBox="0 0 40 80" aria-hidden="true">
    <path d="M7 16 H33 L29 72 H11 Z" fill="#d9efff" stroke="#1e88e5" strokeWidth="2" />
    <path className="glass-water" d="M10 34 H30 L27 69 H13 Z" fill="#64b5f6" />
    <path d="M14 23 L16 62" stroke="white" strokeWidth="2" opacity=".55" strokeLinecap="round" />
  </svg>;
}

export default function WaterContainer({ container, ghost = false }) {
  if (container === 'glass') return <Glass ghost={ghost} />;
  if (container === 'custom') return <span className="other-water-entry"><Icon name="drop" /></span>;
  return <Bottle ghost={ghost} />;
}

