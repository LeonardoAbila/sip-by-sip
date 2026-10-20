# Proposal

## Why

Issue #10 requests a way to move a local profile and its hydration history between browsers. Currently clearing browser data or moving devices leaves that data inaccessible because there is no export, import, or sync service.

## What Changes

- Export the signed-in profile's setup, hydration settings, current progress, daily totals, entry snapshots, and earned completion dates as a versioned JSON file.
- Import a compatible file into the signed-in destination profile, with a preview and explicit replacement confirmation. Existing destination history is replaced, not merged; other profiles remain untouched.
- Preserve destination identity and password. Exclude credential material from backups; the source username is descriptive metadata, while age, weight, and completed setup are portable.
- Validate the complete file before any write and commit profile setup and progress atomically. Show localized errors without losing existing data.
- Provide controls through dashboard settings, available after creating/logging into a destination profile and completing onboarding in a fresh browser.
- Exclude native iOS transfer, cloud synchronization, multi-profile archives, and browser-wide appearance/reminder preferences.

## Capabilities

### New Capabilities

- `profile-portability`: Versioned single-profile export and confirmed, validated replacement import across browsers.

### Modified Capabilities

None. Preserve current daily-history and travel behavior, including future-looking dates and unknown volumes.

## Impact

- Add portable-format validation and serialization helpers, and a dashboard data-transfer component.
- Extend `src/database.js` with atomic single-profile restore and consistent export snapshot operations using its existing IndexedDB queue.
- Wire settings and post-import profile/state refresh through `src/App.jsx` and `src/Prototype.jsx`; add localized copy and styles.
- Extend Node persistence and format tests and document transfer steps and file contents in `README.md`.
- No server, database-schema replacement, or new runtime dependency is expected.
