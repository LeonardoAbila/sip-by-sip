# Agent instructions

## Project

Sip by Sip is a local-first hydration tracker and React learning project. The web app uses React 19, JavaScript modules, Vite 7, and sql.js; there is no backend. Brazilian Portuguese is the default language, with English and Spanish supported in the dashboard. Some login and onboarding copy is currently Portuguese only. Keep code approachable.

`ios/` contains Água do Dia, a separate SwiftUI implementation targeting iOS 17+. It has independent storage and no account or progress sync with the browser app. See `README.md` and `ios/README.md` for behavior and setup details.

## Main files

- `src/main.jsx`: theme initialization, SQLite/Wasm startup, storage-error retry, and mounting `Prototype` in React StrictMode.
- `src/Prototype.jsx`: local profile registration, login, session routing, and logout.
- `src/profiles.js`: profile validation, password hashing, sessionStorage, and initial goal calculation.
- `src/Onboarding.jsx`: age/weight setup and initial goal presentation.
- `src/App.jsx`: hydration dashboard, water entries, settings, reminders, and dialogs.
- `src/state.js`: hydration rules, entry undo, saved-state validation/migration, daily history, rewards, and local-date transitions.
- `src/database.js`: browser SQLite, IndexedDB persistence, profile/progress isolation, and legacy localStorage import.
- `src/calendar.js` and `src/HydrationCalendar.jsx`: calendar calculations and localized history display.
- `src/language.js`: dashboard translations and locale preferences.
- `src/theme.js`: theme and accent-color preferences.
- `src/reminders.js` and `src/reminderSound.js`: reminder preferences/deadlines and browser audio.
- `src/WaterBenefits.jsx`, `src/Fade.jsx`, and `src/Icon.jsx`: benefits content, transitions, and icons.
- `src/styles.css`: responsive layouts, styling, and theme palettes.
- `src/assets/` and `src/assets/SOURCES.md`: web sound asset and attribution.
- `tests/*.test.mjs`: Node tests for entries, achievements, history, time-zone travel, reminders, and database persistence/migration.
- `ios/AguaDoDia/`: native views, `WaterStore.swift`, localized `Copy.swift`, and resources; `ios/AguaDoDia.xcodeproj` contains the shared `AguaDoDia` scheme.
- `openspec/`: workflow configuration and change artifacts; consult relevant artifacts when working on their features.
- `.github/workflows/test.yml` and `.github/workflows/deploy.yml`: automated tests and GitHub Pages deployment.

## Working conventions

- Make focused changes and preserve unrelated work.
- Maintain existing Portuguese, English, and Spanish translations and locale-aware dates/numbers when changing localized UI. Check component-local copy as well as `src/language.js`; native copy lives in `ios/AguaDoDia/Copy.swift`.
- Prefer simple React components and built-in browser features. Add dependencies only when needed. Keep effects safe under StrictMode.
- Preserve recorded volume when bottle/glass sizes or goals change. Undo must remove the actual recorded amount and container type, including after reload.
- Follow local calendar dates for day transitions. Preserve settings, known daily totals, per-date entry snapshots, and earned rewards; revisiting a date after time-zone travel restores its saved progress. Do not discard valid future-looking history or invent totals/entries for unknown days.
- Award goal points only once per date. Resetting water or raising the goal must not revoke earned rewards; resetting today must preserve other dates.
- Keep profiles and progress isolated. SQLite is exported to IndexedDB; theme, language, and reminder preferences use localStorage, and the active profile uses sessionStorage. Preserve legacy import backups and never overwrite an unreadable database with defaults.
- Login is a local demonstration using salted SHA-256 password hashes, not server authentication. Do not imply accounts sync across browsers or devices.
- Web reminders work while the page is visible and can show one overdue reminder on return. Do not promise closed-tab/background delivery; native iOS notifications have a separate implementation.
- Preserve keyboard access, dialog save/cancellation behavior, responsive layouts, light/dark themes, accent colors, and reduced-motion support when changing the interface.
- Update the appropriate README when setup or documented behavior changes. Preserve asset credits when changing bundled media.
- Edit source files; `dist/` is generated and stays out of Git. GitHub Pages uses the `/sip-by-sip/` base path from `vite.config.js`.

## Commands and validation

Use Node.js 22.12 or newer from the repository root:

- `npm ci`: install locked dependencies (also used by CI); `npm install` when intentionally updating dependencies.
- `npm run dev`: start the Vite development server.
- `npm test`: run the Node test suite (`node --test`). Tests use sql.js and fake-indexeddb for persistence checks and jsdom/Vite for rendered UI interactions.
- `npm run build`: build the production app into `dist/`.
- `npm run preview`: serve the production build; open `/sip-by-sip/` locally.

`npm run lint` checks JavaScript and JSX. There is currently no real-browser interaction suite. For web app changes, run `npm test` and `npm run build`. When a browser is available, manually check affected behavior: registration/login and onboarding, profile switching, adding/undoing water with different containers, saving/cancelling settings, refresh persistence, reset confirmation, calendar history, reminders, languages, themes, and keyboard access. Report checks that could not be performed. Documentation-only edits need a review against the referenced files and commands.

For iOS changes, use macOS with Xcode and an iOS 17+ SDK. From the repository root:

```sh
xcodebuild -project ios/AguaDoDia.xcodeproj -scheme AguaDoDia -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Follow `ios/README.md` for simulator/device checks, audio conversion, and notification validation. Linux cannot compile or run the native app; report that limitation when applicable.

## Commits

- After completing every task, commit all changes in the workspace, including any existing changes, unless the user explicitly instructs otherwise.
