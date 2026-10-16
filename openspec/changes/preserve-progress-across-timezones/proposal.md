# Proposal

## Why

Issue #14 reports unexpected day resets while travelling. Reproduction at the same instant (2026-10-15T01:30:00Z) with 750 ml showed that São Paulo → London resets into October 15, while London → São Paulo resets into October 14 and loses the October 15 volume, including on reload.

## What Changes

- Keep hydration days tied to the device’s local calendar date.
- Save the departing date before forward or backward date changes and restore the destination date’s recorded progress, or zero if unknown.
- Retain valid saved dates temporarily ahead of the current local date after westbound travel, while keeping future calendar cells neutral.
- Preserve per-profile progress, undoable entries, settings, and once-per-date achievements across travel and reloads.
- Document travel behavior and add deterministic regression coverage.

## Capabilities

### New Capabilities

- `hydration-day-boundaries`: Local-date transitions, progress restoration, and travel-safe loading.

### Modified Capabilities

None. The main-spec inventory is empty. The completed but unarchived `show-daily-water-volumes` change defines `daily-water-history`; its assumption that all future-dated saved records are invalid must be reconciled during later spec synchronization, because legitimate travel records must now survive.

## Impact

Primarily `src/state.js`, existing calendar helpers and App rollover integration where needed, state/history/database tests, and README behavior documentation. Keep the existing SQLite JSON persistence and profile isolation; no new dependency, geolocation permission, fixed home time zone, or server is required. No app code is changed by this proposal.
