# Tasks

## 1. Local profile selection and honest entry

- [x] 1.1 Add a labeled native saved-profile selector alongside typed username entry and registration; clear password/confirmation/errors on deliberate selection/mode changes, hide the chooser for an empty valid-profile list, and retain normal password verification; verify DOM cases for two profiles, selection without entry, missing/wrong/correct password, typed fallback, and no accidental saves.
- [x] 1.2 Refresh the signed-out list on return/focus, safely handle stale selections and refresh failures, and reread selected identity before submit; verify DOM/database cases for another-tab additions, stale selection, retained typed drafts, recoverable storage failure, and proper listener cleanup.
- [x] 1.3 Add the visible Portuguese local-entry notice associated with login and registration forms; verify both forms explain browser-only storage, no encryption/browser-access protection, no online account/sync/recovery, and test-password use without requiring a link or showing technical internals.
- [x] 1.4 Verify compatibility with preexisting credentials, IDs, progress/rewards, pending onboarding, valid sessions, logout, and profile-isolated backup restore using focused regression cases; document the selectable-name visibility and local-entry contract in README and update the feature-file guide if a component is added.

## 2. Predictable focus and accessible feedback

- [x] 2.1 Add transition-specific focus for entry/registration/logout/profile choice and restore the inline volume-editor opener after save/cancel/Escape; preserve existing Home/Benefits/onboarding focus and verify DOM focus checks plus rerenders/timer ticks do not steal focus.
- [x] 2.2 Associate profile/onboarding errors and help with affected inputs, expose invalid/selected/busy state and meaningful status feedback, and preserve quiet countdowns; verify rendered names/attributes/announcements structure and unchanged validation outcomes across existing forms.
- [ ] 2.3 Verify and correct focus/keyboard defects in settings, reminders, reset, pour, and nested transfer transitions, including native modal containment, cancellation, import busy/failure, and remounted success; add focused regressions for each confirmed fix and preserve drafts, commit guards, and data.
- [ ] 2.4 Verify visible focus and reachable controls for PT-BR/EN/ES dashboards, narrow viewport, reduced motion, light/dark themes, and all accent colors; correct affected styles/semantics only, add a skip-to-main control if the keyboard audit establishes that need, and document the scope and observed results in docs/accessibility-audit.md.

## 3. Full keyboard and screen-reader audit

- [ ] 3.1 Add a keyboard-only Playwright journey using standard navigation/activation keys through profile selection, password entry, onboarding, Home/Benefits, water add/undo, size editing, settings, calendar controls, reminders, reset, backup controls, and logout; verify native focus and observable outcomes with no pointer/programmatic-focus shortcuts hiding tab-order defects, using preexisting history fixtures where needed for calendar navigation.
- [ ] 3.2 Audit the complete journey matrix from design.md, including startup storage retry, in a real browser using only the keyboard; record browser/OS/version, focus order, modal containment/restoration, error/status access and every confirmed issue/fix/retest in docs/accessibility-audit.md, supported by browser regressions for confirmed defects.
- [ ] 3.3 Attempt the same journey matrix with an available screen reader and record OS/browser/reader versions, actual speech/name/order observations, fixes and retests; explicitly list unavailable or unverified combinations and checks without claiming DOM/native-keyboard automation proves screen-reader behavior.
- [ ] 3.4 Document keyboard operation, focus destinations, local-entry limits, and remaining manual checks in README alongside the audit report; verify the instructions match implemented controls and the audit distinguishes passing, failing, and unavailable checks.

## 4. Combined verification with issue 11

- [ ] 4.1 Integrate profile chooser coverage with existing e2e login helpers while retaining typed entry, real backup transport, and credential-retention assertions; verify shared navigation/dialog tests support both changes without duplicating infrastructure or weakening the original issue #11 checklist.
- [ ] 4.2 Run lint, all Node/DOM tests, production build, actual Chromium journeys, and openspec validate accessible-local-profile-entry --strict; verify profile isolation, storage/backup compatibility, keyboard regressions, and unchanged localized behavior all pass, and record any unobserved hosted CI separately.

## Workflow follow-up

- Finish the six pending tasks in add-ui-interaction-coverage under its own apply workflow: browser journeys, browser documentation, required CI job, and full acceptance remain owned there. Do not mark them done from this change's artifact status.
- Browser system libraries may require interactive administrator installation; #11 still requires actual Chromium execution. Screen-reader unavailability must be reported explicitly as required by #12.
- Assess #11, #12, and #13 independently before closure; all three are complete only when their own acceptance evidence is recorded. Archive each change after review and required spec sync.
