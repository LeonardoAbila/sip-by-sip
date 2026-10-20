import React, { useEffect, useRef } from 'react';

export default function ResetDialog({ onConfirm, onClose, t, fadingOut }) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog inert={fadingOut} ref={dialog} className="reset-dialog" onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="reset-title">
      <h2 id="reset-title">{t.resetTitle}</h2>
      <p>{t.resetHelp}</p>
      <div className="dialog-actions">
        <button autoFocus onClick={onClose} className="secondary">{t.cancel}</button>
        <button onClick={onConfirm} className="danger">{t.reset}</button>
      </div>
    </dialog>
  );
}
