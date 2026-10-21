# Proposal

## Why

Issues #12 and #13 ask for usable keyboard/screen-reader journeys and an honest explanation of the local login. The user chose selectable local profiles with passwords; this change makes that entry flow explicit while preserving existing data and coordinating verification with issue #11.

## What Changes

- Show saved local profiles as an accessible selection before password entry, while preserving typed-username entry and new-profile registration.
- Require the selected profile's existing password in the normal UI flow; clear secret/error drafts when changing profiles and preserve pending onboarding and valid sessions.
- Explain next to login/registration that profiles and history live in this browser/origin, passwords do not encrypt the database or prevent browser-level access, there is no cloud account/recovery, and a test password should be used.
- Audit all web journeys using keyboard and a screen reader when available; fix focus, accessible-name, error/status, and keyboard obstacles and report unverified combinations explicitly.
- Add regression coverage using the existing DOM harness and Chromium runner; preserve Portuguese, English, and Spanish dashboard behavior.
- Coordinate completion of add-ui-interaction-coverage (#11) without duplicating its browser installation, backup journey, or CI ownership.

## Capabilities

### New Capabilities

- `local-profile-entry`: Select local profiles, enter with their existing password, preserve compatibility, and clearly explain the purpose and limits of local entry.
- `keyboard-access`: Complete web app journeys using keyboard controls, predictable focus, and accessible names and feedback.

### Modified Capabilities

None. No main specs currently exist. Existing backup/travel changes remain authoritative for their features and are not rewritten.

## Impact

Affects Prototype.jsx and a focused profile-selection component if useful, App/navigation, affected dashboard forms/dialogs, localized copy, styles, README, and tests/e2e. No backend, cloud identity, encryption, password reset, passwordless bypass, data-schema migration, or native iOS work. Existing profile IDs, password hashes/salts, per-profile history, rewards, sessions, and backup format must remain compatible. The testing-only change add-ui-interaction-coverage stays separate and must also finish before claiming all three issues complete.
