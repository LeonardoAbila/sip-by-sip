import React from 'react';

// An original water-drop companion, drawn locally so it stays sharp on phones.
export default function WaterBuddy({ happy }) {
  return <svg className={`water-buddy${happy ? ' is-happy' : ''}`} viewBox="0 0 120 140" aria-hidden="true" focusable="false">
    <ellipse cx="60" cy="128" rx="31" ry="6" fill="currentColor" opacity=".1" />
    <g className="buddy-body">
      <path d="M59 8C55 32 19 53 19 83c0 26 17 42 41 42s42-17 42-42C102 52 68 33 59 8Z" fill="#55c9ed" stroke="#1886b4" strokeWidth="3" strokeLinejoin="round" />
      <path d="M59 8C54 35 29 56 27 80" fill="none" stroke="#d9f7ff" strokeWidth="7" strokeLinecap="round" />
      <path d="M24 95c17 17 48 20 72-2-4 19-17 30-36 30-18 0-31-10-36-28Z" fill="#25aed9" />
      <g className="buddy-face" fill="#133e56" stroke="#133e56" strokeWidth="3.5" strokeLinecap="round">
        {happy ? <><path d="M39 77q5-8 10 0M71 77q5-8 10 0" fill="none" /></>
          : <><ellipse cx="44" cy="76" rx="3" ry="4" /><ellipse cx="76" cy="76" rx="3" ry="4" /></>}
        <path d={happy ? 'M48 88q12 20 24 0Z' : 'M50 90q10 10 20 0'} fill={happy ? '#133e56' : 'none'} strokeLinejoin="round" />
      </g>
      <ellipse cx="33" cy="87" rx="6" ry="3" fill="#ec9db1" opacity=".8" />
      <ellipse cx="87" cy="87" rx="6" ry="3" fill="#ec9db1" opacity=".8" />
      <path d="M22 89 9 83" fill="none" stroke="#1886b4" strokeWidth="5" strokeLinecap="round" />
      <path className="buddy-wave" d="m100 87 11-13" fill="none" stroke="#1886b4" strokeWidth="5" strokeLinecap="round" />
    </g>
  </svg>;
}
