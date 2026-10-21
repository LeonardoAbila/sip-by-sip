# Design

## Context

See proposal.md for motivation and the two delta specs for contracts. Prototype.jsx currently accepts typed usernames/passwords, owns session routing, and has no saved-profile chooser. readProfiles filters valid stored records; submit refreshes IndexedDB before verifying a salted SHA-256 hash. Existing sessions use profile IDs in sessionStorage. Profiles and history share a readable local SQLite database, so the UI password is not a confidentiality boundary.

The user confirmed keeping selectable profiles with passwords and retaining existing data. Existing entry copy is Portuguese only; dashboard copy supports PT-BR/EN/ES. The current short prototype notice does not explicitly explain lack of encryption/browser-level protection. Existing notices are not consistently associated with specific invalid inputs.

App focuses its home heading on screen changes; WaterBenefits already focuses its own heading on mount. Onboarding focuses its heading between form/result states. Native dialog components use showModal and Escape handlers. The inline BottleSizeEditor removes the focused input/form on save/cancel without restoring focus to its replacement edit button. Busy transfer controls and Fade inert behavior already exist and must be preserved.

Issue #11 is tracked separately in add-ui-interaction-coverage: 9/15 tasks complete, 80 passing Node/DOM tests, Playwright installed, one draft journey. Chromium launch failed for missing libnspr4.so; the OS installer requires interactive sudo. That change owns remaining browser infrastructure, backup transfer journey, and CI. No main specs exist; profile portability and travel contracts remain in their existing changes.

## Goals / Non-Goals

**Goals:** Add an explicit profile chooser without changing credential/storage semantics; make the local-entry limitation visible; fix predictable focus/error-association gaps and validate the entire web journey by keyboard and assistive technology where available.

**Non-Goals:** No real authentication service, encryption, credential reset, passwordless bypass, profile deletion, appearance redesign, native iOS changes, blanket accessibility certification, or full localization of currently Portuguese-only entry/onboarding flows.

## Decisions

### Keep typed entry and add a native local-profile selector

Add a labeled native select in the signed-out login form only when valid profiles exist. Use an empty choose-profile option, profile ID values, and username labels; never display age, weight, totals, hashes, or salts. Selecting a profile fills the existing username field and clears password/confirmation/error state. Editing the username clears the selected ID and returns to existing case-insensitive typed-name lookup. Keep registration as a separate mode and preserve existing autocomplete semantics. Do not auto-enter or auto-select a profile on behalf of a signed-out user.

A native select provides built-in keyboard interaction without a custom listbox. An identity-only array feeds the selector, derived from readProfiles; the full credential record remains in the existing verification path. A focused component under src/profile/ is reasonable if it keeps Prototype readable, but a generic authentication framework is unnecessary.

Refresh the list on returning to signed-out login and on window focus while signed out. Remove listeners when leaving that state. Await refreshDatabase, surface load errors accessibly, and re-enable controls on failure. Avoid overwriting the user's typed draft during refresh. On submit, refresh again and resolve a selected ID against current storage; reject a missing selection rather than falling back to a different profile. Typed entry keeps existing normalized-name behavior. Use one source of truth per entry mode so stale selection and typed username cannot silently disagree.

Retain current hashPassword, saveProfile, IDs, schema, and session rules. A valid preexisting session still opens its profile without an extra password prompt; logging out clears it and refreshes the chooser. Incomplete onboarding resumes normally. Do not add unneeded cryptography changes to an honesty/accessibility issue.

### State the local-entry contract next to both forms

Use a visible, concise Portuguese notice linked with aria-describedby to the form/credential controls. Proposed content: profiles and history stay in this browser; the password is for local profile entry and does not encrypt data or protect it from someone with browser access; there is no online account, automatic sync, or password recovery; use a test password. Keep the explanation in the form flow rather than requiring a documentation link or expandable disclosure. Do not expose implementation jargon such as SQLite or hashing algorithm in the product flow.

Update README consistently, including that names are listed before entry and already-active sessions persist per tab. Preserve destination password retention and unencrypted-backup explanations. Existing backup and database behavior do not change.

### Focus ownership and feedback

Keep focus effects in the component that owns each transition and guard them against ordinary rerenders. Add meaningful focus on login/registration mode transitions and logout, and to the selected password field after intentional profile selection. Do not focus a selector merely because its list refreshed. Preserve existing home/Benefits/onboarding heading focus.

Restore inline-editor focus after its replacement edit control mounts; a ref plus transition-aware effect is preferable to arbitrary timeouts. For settings/reminders/reset/pour dialogs, preserve native modal semantics and inspect opener restoration through Fade/StrictMode. Save/cancel/Escape should return to the opener when available. After import remounts App, use the visible heading or success destination instead of an obsolete dialog ref. For nested settings/transfer transitions, restore a meaningful control on return; avoid placing focus in an inert fading shell.

Add aria-invalid and error/help associations to entry and onboarding fields where they are currently missing. Keep visible errors with appropriate live feedback; announce meaningful completion and storage failures without duplicating announcements or reading countdown changes every second. Preserve native keyboard keys and constraints. Use focus-visible styling with adequate visibility across supported themes/accents and include any new select/skip control in existing responsive styles. Add a skip-to-main link where the audit shows repeated header navigation needs it; it must move focus to the visible main content, including Benefits.

### Audit surface and evidence

Record the audit in docs/accessibility-audit.md. Cover registration, profile selection/password visibility/wrong password, pending onboarding/review, home and Benefits navigation, bottle/glass add and pour close, undo, inline sizes, settings language/theme/color and draft cancellation, calendar month controls/details, reminders and preview/dismissal, reset, backup preview/cancel/confirm/failure/busy, logout, and storage startup retry.

For each journey, record focus order, initial and restored focus, keyboard activation, names/states, error/help associations, announcements, and remaining limitations. Inspect PT-BR/EN/ES dashboard labels, narrow desktop/mobile viewport, reduced motion, light/dark and supported accent focus visibility. A visual style check does not prove screen-reader output. Use at least one real browser/screen-reader combination if available and name OS/browser/reader versions. If unavailable, record the exact unavailable checks as unverified, as issue #12 requests; do not relabel DOM/accessibility-tree checks as a screen-reader pass.

Static findings guide targeted fixes now: inline editor focus restoration and entry/onboarding error associations. Native dialog trapping/restoration, input announcements, busy states, narrow layouts, and actual reader speech need runtime verification. Extend only the affected accessibility code when audit findings establish a defect; unrelated design/product changes remain out of scope.

### Coordinate tests and ownership across issues

Reuse tests/helpers/ui.mjs and the existing Playwright configuration. Add focused local-profile and accessibility DOM tests and a keyboard-only e2e spec; the keyboard journey must use Tab/Shift+Tab, Enter/Space, arrows for native controls, and Escape rather than programmatic focus/click shortcuts that hide tab-order defects. Assert actual activeElement, native modal containment, preserved drafts/data, and observable results. Existing mouse journeys remain useful separately.

Retain the test dependency/CI ownership in add-ui-interaction-coverage; do not copy its pending checklist into this change or mark it complete from this change's status. Its 3.3 navigation/dialog assertions can share browser helpers/specs with this change, but completion requires verifying each original checkbox in that change. Adapt its UI helper to support selecting an existing profile while retaining typed entry coverage. Preserve existing wrong-password, registration, transfer failure/retry, reload, reminder, and profile-isolation assertions.

Suggested order: unblock browser system dependencies under #11; land the new profile entry and focused tests; fix identified focus/feedback gaps; run full keyboard audit and add regressions; finish #11 browser journeys/CI; run combined acceptance. None of the three issues is closed until its own acceptance evidence is recorded. No changes to #11 planning artifacts are made in this proposal.

## Risks / Trade-offs

- Listing profile names reveals local identities before password entry -> display only names and explain local visibility; no claim of confidentiality.
- Refresh races erase drafts or select the wrong user -> preserve draft inputs during refresh, use selected ID only in selector mode, and recheck before entry.
- Focus effects steal focus on rerender/StrictMode -> bind them to explicit transitions and verify timer/rerender stability.
- Audit automation overstates accessibility -> separate DOM/native keyboard evidence from actual screen-reader verification and manual visual checks.
- Browser or reader unavailable -> keep native Chromium execution required by #11; record reader limitations explicitly without claiming certification.

## Migration Plan

This change requires no data migration. Verify a seeded pre-change completed profile, incomplete onboarding profile, and two independent progress histories with their existing credentials before release. Verify valid saved sessions, logout, refresh, backup export/import, and destination password retention. Rollback removes the chooser/copy/accessibility changes while leaving the unchanged stored data readable.
