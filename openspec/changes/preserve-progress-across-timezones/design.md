# Design

## Context

See proposal.md for the reproduction and motivation. In src/state.js, currentDay compares data with today(), archives only dates before today, and clears the counter for any mismatch. savedDay and validDay reject dates ahead of the current local date; readState also filters those totals and completions. This makes westbound travel destructive even without a midnight crossing.

SQLite stores each profile's state as JSON, so an additive state field needs no SQL schema change. calendarVolume already hides dates after the current local date. App checks the day every 30 seconds and on focus; counter operations also normalize the active day.

## Goals / Non-Goals

**Goals:** Make date transitions reversible and loading idempotent, preserve counter semantics, and keep validation separate from calendar presentation.

**Non-Goals:** Infer a user's physical location, configure a home time zone, use rolling 24-hour days, synchronize devices, or reconstruct already lost history. Manual device date changes follow the same local-date policy as travel.

## Decisions

### Use date identity, independently of time-zone offset

Keep local YYYY-MM-DD calendar keys and the compatible active data field. Distinguish structurally valid dates from dates eligible for display. Accept valid stored dates even when later than today; reject impossible dates and invalid totals. Date-only legacy values must retain their calendar identity rather than acquire an offset through UTC parsing.

A fixed home zone would require a new setting and conflict with the accepted device-local policy. A monotonic last-date rule would prevent restoring an earlier destination date.

### Snapshot outgoing progress and restore the destination

Add an optional per-date dailyProgress map containing totalMl, garrafas, and entries, alongside existing dailyTotals. On a date change, snapshot the outgoing active fields regardless of chronological direction and update its daily total. Restore the destination snapshot, otherwise its known aggregate total, otherwise zero. Remove the destination's inactive snapshot/total when activating it so active fields remain authoritative. Derive snapshots immutably and ensure repeated normalization of the same date is a no-op.

Aggregate-only legacy days restore volume with an empty undo stack and zero known entry count; do not guess bottle counts from current container size. Settings remain profile-global rather than being restored from old snapshots. Keeping entries only in active state would lose undo behavior after a round trip; using totals alone is therefore insufficient.

Reset writes zero into active progress; later snapshots replace earlier values for that date. A reload on a different local date must normalize the saved active day before choosing the destination. Invalid active data must not replace a valid historical snapshot with a fabricated zero.

### Preserve rewards without revealing future calendar data

Retain all structurally valid completion dates, including those ahead of today's local date. Credit a valid departing day before archiving it, and deduplicate by date. Calendar status and volume retain their future-date guards; streak calculations use the current local date, while already-earned points remain earned. Keep startedOn no later than the earliest known date or current date, so travelling before the tracking start does not break navigation.

### Keep current persistence and integration

Store the additive map through existing profile-keyed SQLite saveProgress JSON. Reuse the existing periodic/focus rollover and operation-time normalization; verify they persist normalized state on travel and reload. Adjust App or calendar only if required for these flows. Test loading before persistence, profile switching, and reopening the actual database.

## Risks / Trade-offs

- Valid future-looking saved dates cannot be distinguished reliably from manual clock edits → retain structurally valid records and hide their future calendar presentation.
- Retaining per-date entries increases storage → use the existing local database and compact snapshots; do not add an arbitrary retention cutoff that silently loses undo history.
- Active and inactive representations could disagree → active fields win for their date, snapshot on departure, and test repeated visits, resets, and reload idempotence.
- Existing history tests expect every future date to be discarded → update this expectation explicitly while keeping impossible-date and numeric validation.
- The prior unarchived daily-water-history delta rejects future records and starts all new days at zero → record the conflict here; when syncing these changes, reconcile that contract with restoration and retained travel records rather than silently publishing contradictory specs.

## Migration Plan

1. Load existing active fields and dailyTotals without inventing historical entries; validate any new snapshots independently.
2. Preserve valid records on both sides of the current local date and normalize to the destination date through one transition path.
3. Persist the additive state using existing JSON storage and test reopening, including profiles migrated from localStorage.
4. Update README to explain local-midnight behavior, date changes during travel, and restoration.
5. Rollback requires exporting the state first: older loaders discard future-looking records and ignore snapshots, so simply reopening in an older version is not a lossless rollback.
