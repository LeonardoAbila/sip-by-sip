# Tasks

## 1. Discoverable dashboard sections

- [ ] 1.1 Extract DashboardNav.jsx and wire it into App with explicit inputs; verify home/benefits hash navigation, aria-current, settings opening, and logout using focused rendered interaction checks, preserving existing markup and focus ownership.
- [ ] 1.2 Extract StreakCard.jsx and ReminderCard.jsx with explicit presentation inputs; verify streak text and reminder disabled/enabled/countdown/due states, timer accessibility attributes, and open-settings action using rendered checks with existing translations.
- [ ] 1.3 Update the README dashboard file guide for all three new components and ProfileTransfer, plus pointers to translations/styles/state/storage; verify every listed path exists and each visible dashboard feature has a clear entry point.

## 2. Readable JSX

- [ ] 2.1 Normalize two-space JSX nesting in App and dashboard components without changing behavior; review the diff for unchanged element hierarchy, classes, IDs, localized labels, handlers, and dialog draft boundaries, and run lint.

## 3. Integration verification

- [ ] 3.1 Run npm run lint, npm test, npm run build, and openspec validate finish-dashboard-component-extraction --strict; verify all pass, including existing profile-transfer lifecycle coverage, and record results.
- [ ] 3.2 Check affected navigation, streak/reminder cards, settings, logout, languages, responsive themes, and keyboard focus in an available browser; verify appearance and interaction preservation, or explicitly record browser limitations and the remaining manual checks.
