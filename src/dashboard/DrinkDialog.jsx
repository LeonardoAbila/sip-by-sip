import React, { useEffect, useRef } from 'react';
import Icon from '../Icon.jsx';
import './drink-dialog.css';

export default function DrinkDialog({ entry, t, format, onClose }) {
  const dialog = useRef(null);
  const opener = useRef(document.activeElement);
  const isGlass = entry.container === 'glass';

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    const timer = setTimeout(onClose, 2800);
    return () => {
      clearTimeout(timer);
      element.close();
      if (opener.current?.isConnected) opener.current.focus();
    };
  }, [onClose]);

  return <dialog ref={dialog} className="drink-dialog" aria-labelledby="drink-title" aria-describedby="drink-amount"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <button autoFocus type="button" className="drink-close" aria-label={t.close} onClick={onClose}>×</button>
    <h2 id="drink-title">{t.drinkTitle}</h2>
    <p id="drink-amount" className="drink-amount"><Icon name={isGlass ? 'glass' : 'bottle'} />{isGlass ? t.glassChoice : t.bottleChoice} · +{format.format(entry.amount)} ml</p>
    <svg className="drink-scene" data-container={isGlass ? 'glass' : 'bottle'} viewBox="0 0 320 300" aria-hidden="true" focusable="false">
      <circle cx="160" cy="145" r="118" fill="var(--accent-soft)" />
      <ellipse cx="154" cy="277" rx="72" ry="8" fill="currentColor" opacity=".08" />
      <path d="M122 110h24v31h-24z" fill="#e8a77f" />
      <path d="M108 132q18-10 36 0l24 19 14 116H85l10-111q2-16 13-24Z" fill="var(--accent-button)" />
      <path d="m102 163-7 72q-1 12 12 14l22 2" fill="none" stroke="#efb58f" strokeWidth="17" strokeLinecap="round" />
      <path d="M106 143 99 171" fill="none" stroke="var(--accent-button)" strokeWidth="28" strokeLinecap="round" />
      <g className="drink-head">
        <path d="M93 77c0-23 12-40 34-40 24 0 35 17 35 37v13l9 10-12 3v8q-1 17-22 17-25-2-34-24Z" fill="#efb58f" />
        <path d="M97 94C82 64 91 31 121 29c21-3 36 7 43 23-15 9-28 5-40-4l-12 24-5 23Z" fill="#263d4c" />
        <circle cx="108" cy="91" r="8" fill="#efb58f" />
        <path d="M106 88q6-2 5 5" fill="none" stroke="#cf8c69" strokeWidth="2" strokeLinecap="round" />
        <path d="M144 79h5M151 104h7" fill="none" stroke="#263d4c" strokeWidth="3" strokeLinecap="round" />
        <circle cx="147" cy="88" r="2.5" fill="#263d4c" />
        <ellipse cx="146" cy="99" rx="5" ry="3" fill="#df967e" />
      </g>
      <g className="drink-arm">
        <path d="m141 153 54-14-7-49" fill="none" stroke="#efb58f" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m140 153 15-4" fill="none" stroke="var(--accent-button)" strokeWidth="29" strokeLinecap="round" />
        <g className="drink-vessel">
          <g transform="translate(158 104) rotate(-125)">
            {isGlass ? <>
              <path d="M-14 0h28l-4 42h-20Z" fill="#e1f7ff" stroke="#238bb4" strokeWidth="2.5" strokeLinejoin="round" />
              <path className="drink-water" d="M-11 11h22L8 38H-8Z" fill="#4dbde5" />
              <path d="M-8 5-6 32" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </> : <>
              <path d="M-6 0H6v12l8 8v33q0 5-5 5H-9q-5 0-5-5V20l8-8Z" fill="#e1f7ff" stroke="#238bb4" strokeWidth="2.5" strokeLinejoin="round" />
              <path className="drink-water" d="M-11 25h22v27q0 3-3 3H-8q-3 0-3-3Z" fill="#4dbde5" />
              <path d="M-8 27v20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              <rect x="-13" y="32" width="26" height="13" rx="3" fill="#fff" />
              <path d="M0 34q-6 7 0 9 6-2 0-9Z" fill="#238bb4" />
            </>}
          </g>
        </g>
        <path d="m186 89 8-4m-8-1 7-3" fill="none" stroke="#efb58f" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="drink-sparkles" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
        <path d="M246 47v14m-7-7h14M70 123v10m-5-5h10" />
        <circle cx="236" cy="205" r="4" />
      </g>
    </svg>
    <p className="drink-caption">{t.drinkCaption}</p>
  </dialog>;
}
