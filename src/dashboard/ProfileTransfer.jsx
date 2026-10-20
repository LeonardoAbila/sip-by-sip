import React, { useRef, useState } from 'react';
import { readBackupFile, serializeBackup } from '../profileBackup.js';

export default function ProfileTransfer({ profile, t, onExport, onImport, onBack, onBusy }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const fileInput = useRef(null);

  async function run(action) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true); onBusy(true); setError(''); setStatus('');
    try { await action(); } catch (failure) {
      setError(t.transferErrors[failure.code] ?? t.transferErrors.failed);
    } finally {
      locked.current = false; setBusy(false); onBusy(false);
    }
  }

  function download() {
    void run(async () => {
      const backup = await onExport();
      const blob = new Blob([serializeBackup(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      try {
        link.href = url;
        link.download = `sip-by-sip-${backup.exportedAt.slice(0, 10)}.json`;
        document.body.append(link);
        link.click();
        setStatus(t.transferDownloaded);
      } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
  }

  function selectFile(event) {
    const file = event.target.files?.[0];
    setPreview(null); setError(''); setStatus('');
    event.target.value = '';
    if (file) void run(async () => { setPreview(await readBackupFile(file)); });
  }

  return <section className="profile-transfer" aria-labelledby="transfer-title">
    <h2 id="transfer-title" tabIndex={-1}>{t.transferTitle}</h2>
    <p>{t.transferHelp}</p>
    <p className="settings-help">{t.transferPrivacy}</p>
    <p className="settings-help">{t.transferOtherTabs}</p>
    <fieldset disabled={busy}>
      <legend className="sr-only">{t.transferTitle}</legend>
      <button type="button" className="save-button" onClick={download}>{t.transferExport}</button>
      <label htmlFor="profile-backup-file">{t.transferChoose}</label>
      <input autoFocus ref={fileInput} id="profile-backup-file" type="file" accept=".json,application/json" onChange={selectFile} />
      {preview && <div className="transfer-preview" role="region" aria-label={t.transferPreview}>
        <h3>{t.transferPreview}</h3>
        <p>{t.transferSource}: <strong>{preview.profile.username}</strong></p>
        <p>{t.transferDestination}: <strong>{profile.username}</strong></p>
        <p>{t.transferExported}: {preview.exportedAt}</p>
        <p>{t.transferReplaceHelp}</p>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={() => { setPreview(null); fileInput.current?.focus(); }}>{t.cancel}</button>
          <button type="button" className="danger" onClick={() => { void run(() => onImport(preview)); }}>{t.transferConfirm}</button>
        </div>
      </div>}
      <div className="dialog-actions"><button type="button" className="secondary" onClick={onBack}>{t.transferBack}</button></div>
    </fieldset>
    {busy && <p role="status">{t.transferWorking}</p>}
    {status && <p role="status">{status}</p>}
    {error && <p className="notice" role="alert">{error}</p>}
  </section>;
}
