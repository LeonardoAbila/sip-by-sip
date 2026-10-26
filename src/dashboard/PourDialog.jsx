import React, { useEffect, useRef } from 'react';

export default function PourDialog({ t, amount, container, onClose, fadingOut }) {
  const dialog = useRef(null);
  const opener = useRef(document.activeElement);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    const timer = setTimeout(onClose, 3400);
    return () => {
      clearTimeout(timer);
      element.close();
      if (opener.current?.isConnected) opener.current.focus();
    };
  }, [onClose]);

  return (
    <dialog inert={fadingOut} ref={dialog} className="pour-dialog" aria-labelledby="pour-title" aria-describedby="pour-amount" onCancel={event => { event.preventDefault(); onClose(); }}>
      <button autoFocus type="button" className="pour-close" onClick={onClose} aria-label={t.close}>×</button>
      <h2 id="pour-title">{t.waterAdded}</h2>
      <p id="pour-amount" className="pour-amount">+{amount} ml</p>
      <svg className="pour-scene" data-container={container === 'glass' ? 'glass' : 'bottle'} focusable="false" viewBox="0 0 320 300" aria-hidden="true">
        <ellipse cx="186" cy="278" rx="66" ry="10" fill="currentColor" opacity=".08" />
        <g className="pour-jug">
          <path d="M70 48 H105 L120 64 H176 L153 88 L144 142 Q140 156 126 156 H83 Q70 156 68 141 L58 64 Z"
            fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M66 82 H150 L140 139 Q138 148 125 148 H85 Q77 148 76 137 Z" fill="color-mix(in srgb, var(--accent) 62%, white)" />
          <path d="M64 75 H49 Q30 75 34 101 Q36 122 66 122" fill="none" stroke="var(--accent)" strokeWidth="9" />
          <path d="M86 67 L92 130" stroke="white" strokeWidth="5" opacity=".65" strokeLinecap="round" />
        </g>
        <path className="pour-stream" d="M176 64 Q188 86 188 135" fill="none" stroke="color-mix(in srgb, var(--accent) 62%, white)" strokeWidth="9" strokeLinecap="round" />
        <path d={container === 'glass' ? 'M150 126 H226 L214 270 H162 Z' : 'M173 126 H203 V150 Q222 160 222 178 V255 Q222 270 208 270 H168 Q154 270 154 255 V178 Q154 160 173 150 Z'}
          fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="4" />
        {container === 'glass'
          ? <path className="pour-water" d="M161 174 H215 L207 264 H169 Z" fill="var(--accent)" />
          : <rect className="pour-water" x="160" y="174" width="56" height="90" rx="10" fill="var(--accent)" />}
        <path d="M167 181 V250" stroke="white" strokeWidth="5" opacity=".65" strokeLinecap="round" />
        <rect x="163" y="200" width="50" height="30" rx="8" fill="#fff" opacity=".85" />
        <path d="M188 205 Q177 216 188 224 Q199 216 188 205" fill="var(--accent)" />
      </svg>
    </dialog>
  );
}
