# Spec Delta

## Purpose

Allow a user to transfer one local browser profile's setup and hydration history through a versioned backup file while preserving other local profiles.

## ADDED Requirements

### Requirement: Export a single portable profile
The application SHALL let a signed-in user download a versioned JSON backup containing their profile setup, hydration settings, active counter, daily totals, entry snapshots, tracking start, and earned completion dates. It SHALL exclude passwords, hashes, salts, session tokens, other profiles, and browser-wide preferences.

#### Scenario: Export current recorded water
- **WHEN** the user records water and immediately exports their profile
- **THEN** the downloaded backup contains that latest recorded progress and supported historical data
- **AND** the file identifies its format, version, source display name, and export time without including credentials

#### Scenario: Export fails
- **WHEN** a consistent profile snapshot cannot be obtained or a download cannot be prepared
- **THEN** the application reports failure without changing saved data or claiming success

### Requirement: Confirm replacement of the destination profile
The application SHALL validate an imported file and preview its source and the signed-in destination before replacement. Only explicit confirmation SHALL replace destination setup and hydration data. Destination identity, username, and password SHALL remain unchanged; other profiles and browser-wide preferences SHALL remain unchanged.

#### Scenario: Transfer to another browser
- **WHEN** a user creates a destination profile in another browser, completes onboarding, signs in, selects a valid backup, and confirms replacement
- **THEN** that destination receives the backed-up age, weight, initial-goal setup, hydration settings, history, and rewards
- **AND** the destination username and password still work after logout and login

#### Scenario: Cancel replacement
- **WHEN** the user cancels file selection, cancels the preview, or presses Escape before confirmation
- **THEN** no profile or hydration data is changed

### Requirement: Reject unsupported or damaged backups
The application SHALL reject malformed JSON, wrong format identifiers, unsupported versions, files exceeding 10 MiB, missing required fields, invalid profile setup, and inconsistent hydration records before writing anything. It SHALL present a localized actionable error and allow a corrected file to be selected without silently replacing invalid values with defaults.

#### Scenario: Invalid file
- **WHEN** a file contains impossible dates, negative volumes, invalid container sizes, or entry amounts exceeding the associated total
- **THEN** import is rejected and existing data remains intact

#### Scenario: Unsupported or oversized file
- **WHEN** a selected file has an unsupported version or exceeds 10 MiB
- **THEN** the application explains the rejection and does not start replacement

### Requirement: Preserve calendar history semantics
Export and import SHALL preserve known zero totals, unknown dates, aggregate-only legacy days, recorded entry amounts and types, earned completion dates, and valid future-looking travel history. Opening the restored profile SHALL apply existing local-day rules without inventing records or duplicating rewards.

#### Scenario: Different destination date
- **WHEN** the backup contains progress for a date different from the destination's current local date
- **THEN** that dated progress remains stored and the current date restores its existing imported snapshot or starts at zero

#### Scenario: Legacy and travel history
- **WHEN** a backup contains aggregate-only history, a known zero, unknown dates, and valid dates ahead of the destination's local date
- **THEN** all known totals and future-looking records survive, unknown dates stay unknown, and undo removes only recorded entries

### Requirement: Replace data atomically and refresh the dashboard
The application SHALL make replacement durable as one operation before reporting success or showing restored data. A failed replacement SHALL leave destination setup and hydration data unchanged. In-flight saves from the importing dashboard SHALL not overwrite restored data.

#### Scenario: Persistence failure
- **WHEN** storage fails while replacing profile setup and progress
- **THEN** neither change is committed, the old dashboard remains usable, and the user can retry

#### Scenario: Successful replacement and reopen
- **WHEN** replacement completes successfully
- **THEN** the dashboard shows imported progress and settings, preserves the destination session, and retains the replacement after reopening

### Requirement: Accessible localized transfer controls
The application SHALL expose export, file selection, preview, confirmation, cancellation, progress, and error feedback through keyboard-accessible controls in dashboard settings, with Portuguese, English, and Spanish copy. Backup help SHALL explain that the file contains personal data and is not encrypted.

#### Scenario: Keyboard confirmation and cancellation
- **WHEN** the user performs import using only the keyboard
- **THEN** preview and confirmation are reachable, Escape cancels before commit, and completion or errors are announced accessibly
