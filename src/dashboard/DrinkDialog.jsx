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
    <svg className="drink-scene" data-container={isGlass ? 'glass' : 'bottle'} viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="108" cy="45" r="18" />
        <path d="M108 63v83m0 0-28 59m28-59 29 59M108 83l-25 30 7 28" />
        <g className="stick-drinking-arm">
          <path d="m108 83 45 20V56" />
          <g className="stick-vessel" transform="translate(153 54) rotate(-65)" stroke="var(--accent-text)" strokeWidth="3">
            {isGlass ? <>
              <path d="M-9-26H9L6 2H-6Z" fill="var(--surface)" />
              <path d="M-7-13H7L5 0H-5Z" fill="var(--accent-soft)" stroke="none" />
              <path d="M-7-13H7" />
            </> : <>
              <path d="M-4-28H4v7l5 6V2H-9v-17l5-6Z" fill="var(--surface)" />
              <path d="M-7-9H7V0H-7Z" fill="var(--accent-soft)" stroke="none" />
              <path d="M-4-21H4M-8-9H8" />
            </>}
          </g>
        </g>
      </g>
    </svg>
  </dialog>;
}
