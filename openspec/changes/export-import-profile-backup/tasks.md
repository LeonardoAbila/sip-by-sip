# Tasks

## 1. Portable format and validation

- [x] 1.1 Add version-1 allowlisted serialization and strict parsing in `src/profileBackup.js`; verify Node round-trip tests preserve setup, decimal amounts, container types, daily snapshots, known zero, unknown gaps, rewards, and valid future dates while excluding credentials, IDs, and unrelated preferences.
- [x] 1.2 Enforce format/version, 10 MiB limit, required fields, valid dates/numeric bounds, and counter/history consistency; verify rejection tests cover malformed JSON, unsupported versions, missing fields, impossible dates, inconsistent entries, and invalid profile setup without fallback defaults.
- [x] 1.3 Document the portable format and excluded fields in README; verify the documented example matches the serializer output and explains personal data and lack of encryption.

## 2. Consistent export and atomic restore

- [x] 2.1 Add queued database snapshot export after prior writes; verify immediate-save-then-export includes the latest water entry and read/save failures never return a falsely successful stale backup.
- [x] 2.2 Add atomic profile setup/progress replacement that rereads destination identity inside the existing IndexedDB write transaction; verify integration tests preserve destination ID, username, password hash/salt, other profiles, and migration metadata after reopening.
- [x] 2.3 Verify cross-browser round trips using separate IDBFactory instances, local-day normalization, legacy aggregate-only entries, and future travel history; verify existing undo and reward rules remain correct after import.
- [x] 2.4 Inject restore transaction failure and retry; verify both profile/setup and progress remain unchanged on failure, caches stay valid, and a subsequent retry succeeds.

## 3. Transfer controls and dashboard lifecycle

- [x] 3.1 Add a focused dashboard transfer component linked from settings, with JSON download, labeled file input, validated preview, explicit replacement confirmation, cancel, busy, success, and error states; verify keyboard access and cancellation before commit cause no writes.
- [x] 3.2 Coordinate export with latest hydration saves and freeze/drain importing-tab autosave before restore; refresh the destination profile in Prototype and remount App after commit; verify restored data survives pending effects, refresh, logout/login, and repeat import while failed imports keep the old dashboard usable.
- [x] 3.3 Keep settings drafts independent from transfer actions and resume destination reminder preferences with a fresh deadline after import; verify canceled drafts are not saved, duplicate confirmation is blocked during commit, and source preferences do not overwrite destination preferences.
- [x] 3.4 Add Portuguese, English, and Spanish transfer labels, preview/replacement explanation, progress/errors, and file-content help; verify all supported languages, responsive dialog layout, keyboard focus, Escape before commit, and accessible announcements with a focused interaction test or documented manual checks when browser tooling is unavailable.
- [x] 3.5 Document export and cross-browser replacement steps, destination-profile/onboarding prerequisites, retained password, other-tab reload limitation, and recovery using a saved backup; verify instructions against the implemented controls.

## 4. Integration verification

- [x] 4.1 Run `npm run lint`, `npm test`, `npm run build`, and `openspec validate export-import-profile-backup --strict`; verify all pass and record any unavailable browser checks.
- [x] 4.2 Exercise a real browser-to-browser transfer including export, preview cancellation, confirmed replacement, and reopen; verify history/settings/rewards match and unrelated profiles remain unchanged, or explicitly report unavailable browser environments.

## Verification record

- All 60 Node tests passed, including the focused jsdom/Vite React integration test.
- `npm run lint`, `npm run build`, and `openspec validate export-import-profile-backup --strict` passed.
- Storage tests simulate separate browsers and injected transaction failures; UI tests cover preview/cancel/Escape, failed-import retry, repeat import, latest-entry export, refresh persistence, retained identity, and reminder restart.
- Portuguese, English, and Spanish settings/transfer controls passed DOM checks. A pre-existing misplaced Spanish appearance dictionary was corrected because it prevented access to settings in Spanish.
- No real browser or screen reader was available. Real cross-browser transfer, file-picker/download behavior, native dialog focus trapping, assistive announcements, and responsive/theme visuals remain unverified; the README lists these manual checks. Tasks 3.4 and 4.2 explicitly allow reporting unavailable browser environments.
