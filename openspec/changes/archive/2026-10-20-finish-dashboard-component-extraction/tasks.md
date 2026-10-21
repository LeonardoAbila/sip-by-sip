# Tasks

## 1. Discoverable dashboard sections

- [x] 1.1 Extract DashboardNav.jsx and wire it into App with explicit inputs; verify home/benefits hash navigation, aria-current, settings opening, and logout using focused rendered interaction checks, preserving existing markup and focus ownership.
- [x] 1.2 Extract StreakCard.jsx and ReminderCard.jsx with explicit presentation inputs; verify streak text and reminder disabled/enabled/countdown/due states, timer accessibility attributes, and open-settings action using rendered checks with existing translations.
- [x] 1.3 Update the README dashboard file guide for all three new components and ProfileTransfer, plus pointers to translations/styles/state/storage; verify every listed path exists and each visible dashboard feature has a clear entry point.

## 2. Readable JSX

- [x] 2.1 Normalize two-space JSX nesting in App and dashboard components without changing behavior; review the diff for unchanged element hierarchy, classes, IDs, localized labels, handlers, and dialog draft boundaries, and run lint.

## 3. Integration verification

- [x] 3.1 Run npm run lint, npm test, npm run build, and openspec validate finish-dashboard-component-extraction --strict; verify all pass, including existing profile-transfer lifecycle coverage, and record results.
- [x] 3.2 Check affected navigation, streak/reminder cards, settings, logout, languages, responsive themes, and keyboard focus in an available browser; verify appearance and interaction preservation, or explicitly record browser limitations and the remaining manual checks.

## Verification record

- npm run lint, all 60 Node tests, npm run build, and strict OpenSpec validation passed.
- Extended jsdom/Vite coverage verifies hash routing and aria-current, home-heading focus, existing settings/logout and backup lifecycle, and streak/reminder presentation in Portuguese, English, and Spanish, including disabled, countdown, due, timer attributes, and opening callbacks.
- Reviewed the extraction for preserved DOM nesting, classes, IDs, translations, and handler ownership. Existing component formatting diffs are whitespace-only.
- No Chromium, Chrome, or Firefox executable or browser automation tool is available. Responsive light/dark/accent visuals, native keyboard navigation and dialog focus behavior remain manual checks. jsdom focus checks do not replace those checks. Task 3.2 permits recording this limitation.
