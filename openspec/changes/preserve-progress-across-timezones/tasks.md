# Tasks

## 1. Reversible date transitions

- [x] 1.1 Add deterministic clock/time-zone regression coverage for the issue #14 reproduction at 2026-10-15T01:30:00Z in America/Sao_Paulo and Europe/London, restoring clock and TZ after each test; verify the westbound case fails on the current implementation and asserts retained departing progress.
- [x] 1.2 Separate structural date validation from current-date display eligibility and add optional dailyProgress snapshots in src/state.js; verify impossible dates, invalid volumes, corrupt snapshots, and date-only legacy keys with focused state tests.
- [x] 1.3 Save the departing date and restore the destination snapshot or aggregate total for both date directions; verify round trips, repeated normalization, midnight, multi-day gaps, same-date zone changes, and daylight-saving transitions.
- [x] 1.4 Preserve active-date add, undo, reset, settings, and once-per-date completions; verify revisited entry stacks, aggregate-only legacy totals, zero after reset and revisit, and goal reward deduplication.
- [x] 1.5 Document local-date selection and reversible travel behavior in README; verify the description matches the tested examples and distinguishes unknown days from known zero.

## 2. Migration, persistence, and calendar integration

- [x] 2.1 Update readState migration to retain valid future-looking totals, snapshots, and completions without replacing valid history with invalid active data; verify repeated loading, missing fields, legacy JSON/localStorage inputs, and future-record retention alongside strict impossible-date and numeric rejection.
- [x] 2.2 Exercise the existing SQLite save/reopen flow and profile switching with travel snapshots; verify separate profiles restore different totals and entries after changing the local date and reopening the database.
- [x] 2.3 Verify App periodic/focus checks and action-triggered normalization persist date transitions; adjust integration only as needed and verify no repeated reset or lost volume on refresh, focus, or profile switch.
- [x] 2.4 Preserve neutral future calendar cells while retaining their stored progress and completions, and handle travel before startedOn; verify calendar status/volume, navigation bounds, streaks, and points with focused calendar/achievement tests.
- [x] 2.5 Document migration compatibility and the older-loader rollback limitation in README; verify documentation covers aggregate-only legacy restoration without invented entries.

## 3. Integration validation

- [x] 3.1 Run npm test, npm run build, and openspec validate preserve-progress-across-timezones --strict; verify all pass and review changes for unintended effects on existing hydration history.
- [x] 3.2 When a browser is available, verify eastbound and westbound date changes, reload, undo, reset confirmation/cancellation, profile switching, themes, and calendar behavior; record actual results and any environment limitation.

## Workflow follow-up

- Before syncing or archiving, reconcile the previous unarchived daily-water-history future-date rejection and zero-on-rollover wording with this change's travel contract.
- Archive this change after implementation and review, preserving its verified specifications.

## Verification results

- Reproduced the original failure before implementation: westbound travel at 2026-10-15T01:30:00Z lost the London October 15 total (expected 750 ml, received undefined).
- Automated verification: 51 tests pass, including 12 deterministic travel tests and SQLite legacy import/save/reopen checks for two separate profiles. Production build and strict validation of this change pass.
- App integration review: App initializes with readState; periodic checks (30 seconds) and window focus call setState(currentDay); additions, undo, and reset normalize the active date; the state/storageKey effect persists the resulting state. Prototype keys App by profile.id, so switching profiles initializes the correct profile state. These paths reuse the verified transition and persistence functions; no App changes were needed.
- Browser verification unavailable: launching installed Chromium fails with missing libnspr4.so (other unresolved libraries include NSS and ALSA). No browser results are claimed for live focus/timer events, dialog confirmation/cancellation, themes, or visual calendar rendering. Calendar date/status/volume/navigation bounds and restored counter operations were verified with automated tests.
