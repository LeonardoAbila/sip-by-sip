# Design

## Context

See proposal.md for motivation. `database.js` serializes local operations and loads the latest SQLite file inside each IndexedDB transaction, updating its cache only after commit. Profile setup and progress currently have separate save methods. `App.jsx` automatically saves state in an effect, and `Prototype.jsx` owns the active profile object and keys App by profile ID. `readState` is intentionally forgiving and rolls dates forward/backward; it is unsuitable as the sole validator of a user-selected file. Existing change specs require preservation of future-looking travel records, superseding an older history scenario that discarded future dates; this change preserves current travel behavior. No main specs exist yet.

## Goals / Non-Goals

**Goals:** Keep transport validation separate from forgiving startup migration, preserve the existing transaction/cache model, and provide explicit lifecycle coordination so stale React state cannot undo an import.

**Non-Goals:** No raw SQLite restore, identity/password transfer, history merging, native iOS support, or browser-wide preference migration. Avoid adding runtime dependencies or broadening issue #11 into a whole-app interaction test project.

## Decisions

### Versioned single-profile JSON

Add `src/profileBackup.js` with pure construction, parsing, and validation functions. Version 1 uses `format: "sip-by-sip-profile"`, `version: 1`, `exportedAt` (ISO timestamp), `profile` (source username plus age, weight, initial goal, completed setup), and `progress` (all supported hydration fields). Explicit allowlists exclude source IDs, hashes, salts, arbitrary extra properties, and session information. A file contains personal age/weight/history data and is unencrypted; explain this in the transfer UI and README. Do not export browser preferences or reminder deadlines.

Alternatives: raw SQLite would expose every profile and credentials and couple portability to the database layout. CSV cannot retain entry snapshots and rewards. JSON supports precise, complete round trips with built-in browser APIs.

### Strict transport validation before normalization

Check the File size before reading (maximum 10 MiB), then validate JSON root, format/version, timestamp, profile fields using existing age/weight/goal bounds, and every required progress field. Reject invalid dates, non-finite or negative totals, unsupported precision, unsafe numeric units, unknown container types, impossible counts, entry sums above totals, conflicting total/snapshot records, duplicate completion dates, and invalid tracking starts. Do not reject valid future-looking dates. Require supported numeric types rather than coercing arbitrary strings. Reconstruct allowlisted objects; reject missing/invalid fields rather than silently applying startup defaults. Only after validation, apply existing `readState`/`currentDay` semantics to choose the destination's current local date. Preserve aggregate-only legacy days and unknown gaps.

Alternative: using only `readState` would silently discard malformed records and turn a damaged file into a misleading successful replacement. Version 1 exports must themselves satisfy the same validator; unsupported future versions fail clearly instead of attempting migration.

### Export snapshot and atomic replacement

Expose database operations for a queued consistent snapshot and queued profile restore. Export begins after prior local hydration saves have completed and reads the selected profile/setup and progress from the same refreshed database snapshot; coordinate with App's current state so immediate add-then-export includes the latest entry. If an outstanding save failed, surface that failure instead of exporting stale data.

Restore takes the authenticated destination ID and validated portable data. Inside one existing queued readwrite operation, reread the destination profile, preserve its ID, username, salt, and passwordHash, replace only age/weight/goal/setup, and upsert only its `aguaApp:perfil:<destination-id>` progress row. Throw if the destination disappeared. Export SQLite and commit via the existing IndexedDB transaction; failure preserves old cache and persisted file. All unrelated rows and legacy migration metadata remain intact. No schema migration is needed.

Alternative: calling saveProfile then saveProgress independently can commit half a restore. Replacing the full database would destroy unrelated data.

### Dedicated transfer UI and import lifecycle

Add `src/dashboard/ProfileTransfer.jsx`, opened from settings, with download, labeled file input, validation errors, source/destination preview, explicit replacement action, and cancellation. Keep its independent actions outside the settings Save form so canceling draft settings cannot commit them during transfer. Reuse native dialog/Fade conventions, accessible status/error feedback, and translations in `language.js`. Fresh-browser instructions require creating/logging into a destination profile and completing onboarding first.

On valid confirmation, freeze hydration mutations and autosave in the importing dashboard, await outstanding writes, then commit replacement. Do not set React state to imported data before persistence succeeds. On success notify Prototype of refreshed destination setup and advance an App generation key, forcing a fresh state load and closing settings drafts/pour state. Resume reminders from destination preferences, with a fresh destination reminder cycle rather than imported deadlines. On failure keep the original dashboard/profile and re-enable controls; preserve file preview for retry. Once commit begins, disable duplicate confirmation and close/cancel controls until success or failure is known.

Keep the existing cross-tab same-profile last-writer-wins policy: other already-open tabs must be reloaded after import; show/document that limitation. The importing tab's queued saves are explicitly controlled. Do not add a new cross-tab conflict system here.

### Focused validation

Add Node tests for serialization/strict rejection and SQLite restore with separate IDBFactory instances to simulate another browser. Cover export immediately after a save, destination identity/password retention, untouched second profiles, read-after-reopen, future dates, known zero/unknown gaps, aggregate-only history, undo, and failed-transaction retry. Verify UI cancellation, confirmation, busy states, and stale-save prevention with a focused interaction test using an appropriate test environment if available; otherwise record specific manual checks and their execution limitations. Run existing lint, tests, build, and OpenSpec strict validation.

## Risks / Trade-offs

- Replacement discards destination history → Preview states replacement explicitly and offers export before confirmation; cancellation writes nothing.
- Plain JSON includes personal details → Explain file contents and lack of encryption; omit credentials and unrelated profiles.
- Startup normalization could hide damage → Strict transport validation runs first, with explicit field allowlists and rejection tests.
- Old dashboard or tab overwrites restored data → Freeze/drain importing-tab autosave and remount after commit; document reload of other same-profile tabs under existing last-writer-wins behavior.
- 10 MiB cap limits unusually large archives → Clear localized size error; keep the format versioned for future changes.

## Migration Plan

Ship additive helpers and UI using current tables. Existing data remains unchanged until explicit import confirmation. Validate cross-browser transfer and reopen before release. Rollback removes the UI/helpers without changing stored schema; restored data remains readable by the current hydration model. Keep backup files for recovery because replacement itself has no merge/undo facility.
