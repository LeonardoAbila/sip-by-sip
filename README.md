# Sip by Sip — learning React

A water bottle counter built with React and JavaScript. The interface supports Brazilian Portuguese (the default), English, and Spanish.

## Run it

Install Node.js 22.12 or newer, then run these commands in this folder:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. You must use the development server; opening `index.html` directly will not compile JSX.

```bash
npm run build    # Create the production app in dist/
npm run preview  # Preview that production build locally
npm test         # Check hydration rules, SQLite persistence, and migration
npm run lint     # Check JavaScript/JSX correctness and consistent style
npm run lint:fix # Apply automatic lint fixes
```

Lint checks and tests also run automatically on every push and pull request through
`.github/workflows/test.yml`, using Node.js 22 and `npm ci`. Check the
**Actions** tab for results.

## Publish on GitHub Pages

The site is configured for https://leonardoabila.github.io/sip-by-sip/.
In the GitHub repository, open **Settings → Pages** and select **GitHub Actions**
under **Build and deployment → Source**. GitHub Free requires a public repository
for Pages hosting.

Push changes to `main` to publish. `.github/workflows/deploy.yml` installs locked
dependencies with Node.js 22, builds the app, and deploys `dist/`. The **Actions**
tab shows deployment progress and errors. You can also select the deployment
workflow and choose **Run workflow** to publish manually.

If the first deployment failed before Pages was enabled, rerun that failed
workflow after selecting **GitHub Actions**. Changing the Pages source alone
does not rerun the Vite build. A blank page requesting `/src/main.jsx` means
the unbuilt source HTML was published; a successful deployment from this
workflow publishes compiled scripts under `/sip-by-sip/assets/` instead.

`vite.config.js` sets the `/sip-by-sip/` base path for scripts and assets. After
`npm run build`, preview the published layout with `npm run preview` and open
`http://localhost:4173/sip-by-sip/`. If the repository name or hosting path changes,
update the base path before deploying. Keep `dist/` out of Git; the workflow builds it.

Hosting does not add backend authentication or shared storage. Profiles and
progress remain local to each browser and origin; data saved on localhost is
separate from data saved on the published site.

## Browser database

Profiles and hydration progress are stored in **SQLite**, running in the browser
with **sql.js**. SQLite tables hold profiles (including password hashes and setup)
and each profile's hydration state. Progress is kept as JSON in a SQLite row so
the existing validation, new-day, points, and streak rules stay unchanged.

sql.js works in memory, so every save exports the SQLite file to **IndexedDB**.
The app loads that file before showing login and waits for profile saves before
continuing. Progress saves show the existing warning if persistence fails.
Writes read and update the latest file in one IndexedDB transaction, preventing
separate tabs from replacing unrelated profiles or progress. Two tabs editing
the same profile's progress still use the most recently saved state.

On the first successful upgrade, the app imports `aguaPrototypeProfiles`,
`aguaApp`, and every `aguaApp:perfil:*` entry from localStorage. The import and
its completion marker are saved together; failed imports can be retried.
Original entries stay untouched as backups and are not imported again after a
successful migration. Invalid legacy JSON uses the existing defaults. If the
database cannot be opened, the app offers **Tentar novamente** and does not
replace it with empty data.

Theme, language, and reminder preferences still use localStorage; the active
login still uses sessionStorage. Data stays in this browser and origin, survives
closing/reopening tabs, and does not sync between devices. Clearing site data
removes the database and backups.

No server or GitHub configuration change is needed. Vite bundles sql.js and its
WebAssembly file under `/sip-by-sip/assets/`, so the existing GitHub Pages
workflow publishes everything. After deployment, open the site in the same
browser/origin used before, log in with an existing profile, check its progress,
record water, then close and reopen the tab to confirm it was saved. Keep the
old localStorage entries until you have verified the upgrade.

## How React works here

React renders the interface from the current state instead of updating individual elements with `document.getElementById`.

1. **Components:** `src/App.jsx` connects the dashboard components in `src/dashboard/`, including the water cards, container illustrations, and dialogs. Each is a JavaScript function returning JSX, which looks like HTML inside JavaScript. `<WaterContainer />` selects the illustration for each recorded container.
2. **State:** `const [state, setState] = useState(() => readState(storageKey, profile?.goalLiters ?? 2))` stores today's count, volume, and settings. `setState` changes that data and asks React to update the screen.
3. **Events:** `onClick={recordWater}` connects the add button to a function. The function updates state; React updates the total, bottles, and progress ring.
4. **Derived values:** The percentage is calculated from the total and goal during rendering. It doesn't need separate state.
5. **Effects:** `useEffect` saves hydration state to SQLite and IndexedDB after a change. Another effect checks for a new day and cleans up its timer when the component is removed.
6. **Controlled inputs:** Each input's `value` comes from React state; `onChange` updates it. Inside the settings dialog, invalid values show a message and disable saving.
7. **Props:** `ResetDialog` receives `onConfirm` and `onClose` from `App`. Props let a parent component pass data or behavior to a child.

For example, clicking **Adicionar garrafa** follows this flow:

```text
click → recordWater() → setState(...) → React renders updated JSX
                                      → useEffect saves to SQLite and IndexedDB
```

`src/main.jsx` mounts the app inside `<div id="root">` in `index.html`. `src/styles.css` controls its appearance. `src/state.js` loads and validates hydration data; `src/database.js` handles SQLite, IndexedDB persistence, and the upgrade from localStorage on the same browser origin. `StrictMode` runs extra development checks, so effect setup must be safe to repeat.

## Behavior

Saved progress remains compatible with older profiles: the current dated counter
and known daily totals are retained, and newly saved dates also retain their
recorded entries. A legacy day with only an aggregate volume restores that
volume with no guessed entries or bottle count, so undo applies only to entries
actually recorded. Resetting a restored day saves a known zero when leaving it.
Invalid dates and numeric data are still rejected; valid dates ahead of today's
local date remain stored because travel can make them temporarily future-looking.

Before rolling back to an older app version, export or back up the browser's
stored database. Older loaders discard future-looking history and ignore the
new per-date entry snapshots, so opening the data with an older version can
lose travel history and undo information.

- Daily recorded totals are retained by local calendar date and profile when the day changes, including after closing and reopening the app. Adding water, undoing an entry, and confirming a reset update today's volume; resetting today preserves previous days and existing rewards. Changing container sizes or the goal preserves recorded volumes. Older saved data can recover only the dated total still present in the counter: previous completion symbols cannot reconstruct volumes. Days without a known total, including gaps while the app was closed, remain unknown rather than becoming zero.
- Calendar cells display recorded volumes directly beside the goal symbol, without clicking: for example, **1,5 L**, **250,25 ml**, or **0 ml** in Portuguese. Past days with unknown volumes show **Sem dados** (localized in other languages); future days show no volume. Day accessible names include the volume or lack of data. A preserved goal check can coexist with zero after resetting today's counter, because earned rewards remain unchanged.
- The hydration calendar shows each local day as goal achieved (check), missed (cross), today still pending (dot), or no history (dash). Future days stay neutral. A missed day is marked only after it ends, including days when the app was closed. Dates before tracking began are not counted as misses. Existing profiles keep their completion history; the earliest valid saved progress date or completion date becomes the tracking start when migrating old data. Month navigation runs from that start month through the current month. The calendar shows the current streak and monthly completion/miss totals, follows the selected language, supports dark mode, and uses text/symbols alongside colors.

- The dashboard shows consecutive completed days in a centered streak card above the daily intake and bottle log; accumulated points are not displayed. Completing the daily goal earns **10 points**, once per local calendar day, and adds that day to the profile's streak. More water earns no additional points. The streak counts consecutive completed days, preserving yesterday's streak while today's goal is pending; a missed calendar day breaks the streak, even if the app was closed. Points stay accumulated after a broken streak. Rewards are saved with each profile's progress. Previously saved state is supported, and duplicate and invalid completion dates are discarded when loading. Valid completion dates temporarily ahead of the local date after travel remain saved, while future calendar cells stay neutral.
- A completed day's reward stays earned if the user resets the water counter or later raises the goal. Resetting and reaching the goal again cannot earn a second reward. Lowering today's goal can complete it using water already recorded. The reset affects water and bottle counts only. Achievements are shown in the selected language.

- Password fields include an eye button to show or hide each password independently. Passwords start hidden when switching between login and registration.
- The prototype starts on a login page. **Cadastre-se** asks only for username, test password, and password confirmation. The first login opens a separate setup page explaining why age and weight are needed. **Descobrir minha meta** then reveals the estimated liters with an animated filling bottle and number counter. **Revisar idade e peso** returns to the inputs; **Começar meu dia** saves setup and opens the existing counter. Reduced-motion preferences disable the animation. Setup resumes after logging out or refreshing until it is completed; completed profiles go directly to the counter on later logins, including profiles created before this setup flow was added.
- The initial goal uses the supplied formula: up to 17 years, 40 ml/kg; 18–55, 35 ml/kg; 56–65, 30 ml/kg; 66+, 25 ml/kg. Age 55 belongs to the 35 ml/kg band. For example, age 30 and 70 kg produce 2.45 L/day. Settings can override the initial goal. The setup's expandable reference links to the [Food and Nutrition Board publication](https://www.nationalacademies.org/publications/10925), distinguishing its total-water guidance (food and beverages included) from the prototype's weight-based formula; the latter is not attributed to that publication.
- **Sair** returns to login; entering again restores that profile's saved progress and goal. Profiles and counters are local to this browser and origin; the active profile survives a refresh in the same tab. Existing pre-login progress is migrated into its own SQLite progress row under its original key, separate from the new profiles. Theme, language, and reminder preferences remain browser-wide.
- Login is a demonstration, with no server authentication, account recovery, or cross-device accounts. Use test credentials. Passwords are saved as salted SHA-256 hashes rather than plain text; this is not production authentication. Clearing browser site data removes profiles and progress. Malformed saved profile data falls back safely to the login screen.

- The web dashboard uses a responsive two-column layout with a circular daily goal and primary add-water action, alongside the bottle log, with both cards sharing the same width and height on desktop. A pair of compact streak and reminder cards sits above them, using the same equal-width columns on desktop. Goal and bottle size appear as compact details inside the bottle log; the hydration calendar follows below. On phones it stacks into one column, scales the progress ring to the card width, and uses a compact three-item navigation row with logout beside the brand. Mobile text remains readable, and the add-water button stacks its label and volume on narrow screens. Mobile controls have larger touch targets, settings fields stack vertically, and dialogs scroll within the viewport. All labels, number formatting, and the date follow the selected language.

- Dialogs, reminder notices, language options and reminder previews fade in and out over 240 ms. Theme colors and button states transition smoothly. Reduced-motion preferences disable these effects; Escape still closes dialogs.

- Enable water reminders by opening the **Lembretes de água** dashboard card and enter a custom interval in whole minutes or choose 15, 30, 60, or 120 minutes, then save. Custom intervals persist after reloading; empty, zero, negative, and fractional intervals cannot be saved. Preferences persist in this browser. A subtle countdown appears in the reminder card. Its per-profile deadline is saved, so reloading preserves the remaining time. The **Som de água enchendo um copo** checkbox enables a recording of water being poured into a cup, with two final drips, played with Web Audio; the visual reminder appears as a floating notice on both mobile and desktop. Saving enabled reminders prepares browser audio; playback may require a user interaction after reloading. The visual reminder always remains available. **Testar aviso** displays the same reminder inside the Reminders dialog immediately, even when reminders are disabled. Preview buttons dismiss the test without recording water or changing settings. Reminders are off by default and appear inside the open app; an overdue reminder appears when you return to the tab. **Adicionar garrafa** records water and restarts the interval; **Agora não** dismisses it and restarts the interval. No system notification permission is needed. Reopening restores the saved deadline; expired reminders appear when the app is visible. Alerts and sounds are delivered only while the page is visible. See the browser reminder limits below.

- The responsive top navigation includes the app name, **Início**, **Benefícios**, and **Configurações**. Open the dashboard reminder card to manage **Lembretes de água**. Navigation labels follow your chosen language.

- Each click on **Adicionar garrafa** opens a large popup showing a jug pouring water into a bottle and the recorded volume. It closes automatically after 3.4 seconds, or immediately with the close button or Escape. Closing the popup preserves the recorded water. The animation respects the system preference for reduced motion.
- The bottle log shows recorded bottles filled with water and remaining bottles as faint, dashed outlines. Remaining bottles are calculated from the water still needed and the current bottle size, rounding up; each group displays at most 24 illustrations with an overflow count.
- Use **Alterar ml** inside the bottle log to edit the bottle volume directly. Save applies a positive value to future bottles; Cancel or Escape discards edits. Recorded water is preserved and ghost bottles update to the new size.
- Add a bottle using its current size. Changing the size affects future bottles; it preserves water already recorded.
- Open **Configurações** to edit bottle size and daily goal. **Salvar** applies and saves both values; **Cancelar** or Escape discards edits. Changing the goal updates progress after saving.
- Open **Configurações** and click the **Idioma** button to choose **Português (BR)**, **English**, or **Español**. The dialog previews your chosen language; **Salvar** applies it to the app and number formatting, while **Cancelar** or Escape discards the change. Your selection is saved in this browser when storage is available; switching languages preserves your progress.
- Refresh to restore progress when browser storage is available.
- Hydration days follow the device's local calendar date. At local midnight, or when travel changes that date, the departing date's progress is saved and the destination date's progress is restored; a previously unrecorded date starts at zero. Changing time zones within the same date preserves progress. Returning to a date restores its volume and recorded entries, including undo; settings remain current. For example, travelling from London on October 15 to São Paulo on October 14 saves October 15 and restores October 14. Returning to October 15 restores that day's saved progress. Unknown skipped days remain unknown, distinct from a known zero.
- Confirm **Zerar dia** to reset today's progress manually. The original two reset actions had the same effect and are combined here.
- Saved data stays in this browser, with no account or backend.
- Open **Configurações**, change **Modo escuro**, and choose **Salvar** to switch themes. The app initially follows your system theme and saves your selection when browser storage is available.

The theme is another `useState` example: saving the appearance settings changes `theme`, and an effect sets `data-theme` on the document and saves the preference. CSS variables in `src/styles.css` provide the two palettes; `src/theme.js` reads the saved or system preference.

## Try a small React exercise

Change the dashboard heading inside `App.jsx`, then save the file while the dev server is running. Vite updates the page. Next, change the button text or the bottle colors. These edits let you explore JSX and CSS before changing state logic.

`SettingsDialog` holds temporary input state. Saving passes both values to `App` through the `onSave` prop; cancelling removes the dialog and discards that temporary state.

The reminder audio is **pouring with two drips at the end** by Mafon2, released under CC0 on [Freesound](https://freesound.org/people/Mafon2/sounds/330025/). Source and license details are in `src/assets/SOURCES.md`.

## Native iOS version

A separate SwiftUI implementation is in `ios/`. Open `ios/AguaDoDia.xcodeproj` on a Mac with Xcode. See `ios/README.md` for setup, features, and validation limits. Local backup archives are excluded from Git; the current web source is in this repository.

- Open **Benefícios** in the navigation to read about hydration, everyday tips, and the CDC source. **Voltar e registrar água** returns to your dashboard; progress and reminders stay active while reading. The screen supports Portuguese, English, Spanish, and direct access through `#benefits`.

- **Configurações** contains **Modo escuro** and a favorite-color selector (green, blue, purple, pink, or orange). **Salvar** applies and remembers appearance choices in this browser; **Cancelar** or Escape discards edits. **Sair** is in the navbar and signs out immediately.

## Water entries and undo

In **Consumo de hoje**, use the separate **Adicionar garrafa** and **Adicionar copo**
compact buttons side by side, labeled **Garrafa** and **Copo**. Both saved
volumes appear in **Suas garrafas**; button accessible names include their
action and volume. The rectangular
**Desfazer** button spans both columns below them. Bottles start at 500 ml and glasses at
250 ml. In **Suas garrafas**, open **Alterar ml** and choose the bottle or glass icon to edit
that container. You can edit both sizes before saving; Cancel or Escape discards
all pending edits. Sizes are saved per profile, and changing them preserves
previously recorded water. The remaining indicators show both bottles and glasses as alternatives.
Each count rounds up the remaining volume divided by its container size;
recording water, undoing, changing the goal, or editing either size recalculates
both counts. Both counts and their empty container illustrations appear together in one
shared indicator. Ghost illustrations show up to 24 of each, with an overflow
count. Reaching the goal replaces the indicators with a success message.

Recorded entries keep their actual volume and container. The log displays
bottle and glass illustrations together and shows separate counts. Older
entries whose container was not recorded, and custom amounts, appear as water
drops under other entries. Aggregate-only records also remain in that count.
The recording popup shows a glass when recording a glass.

Use **Alterar ml** to adjust the bottle or glass volume. Volumes
accept 0.01–1,000,000 ml with at most two decimal places; totals use integer
hundredths of a milliliter to prevent floating-point accumulation errors.

In **Consumo de hoje**, **Desfazer último registro** appears below **Adicionar copo**
and removes the latest known entry with its actual
volume, preserving earlier water and settings. Undo can be repeated and survives
reloads. A new day or manual reset clears its history but retains both container
sizes, selection, and earned achievements. Older aggregate-only records retain
their total and count; their unknown individual volumes cannot be undone.

## Browser reminder limits

Reminders are in-page alerts for this browser app. Their delivery depends on
the page being visible:

| Situation | What to expect |
| --- | --- |
| Page visible, reminder enabled | One alert appears when the interval expires and the browser runs its next timer check. Sound is attempted if enabled. |
| Another tab or app, minimized browser, or locked screen | No new alert or sound is triggered while the page is hidden. Browsers may delay or suspend background timers. |
| Tab or browser closed | No alert or sound can be delivered by this app while it is closed. |
| Return or reopen, then enter the same profile | One overdue alert appears once the page is visible, if the deadline was saved. Missed intervals are not replayed as multiple alerts. |
| Browser storage unavailable or cleared | The deadline cannot survive closing or reloading; a fresh interval starts on the next load. |

The app saves an absolute deadline per profile in localStorage. Reloading does
not normally restart the interval. Recording water or dismissing an alert starts
a new interval. Turning reminders off removes the active profile's deadline.

The water sound depends on browser playback restrictions, device volume, and
audio availability. **Testar aviso** lets you check it while interacting with
the page; this does not guarantee later background playback. The visual alert
still works if sound is blocked.

This version does not send operating-system notifications or use a push service.
Installing a shortcut does not add closed-tab scheduling. For reminders while
the app is closed, use a device alarm or a reminder app.

Browser references: [background timer limits](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API),
[audio playback restrictions](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices),
and [server-sent web push](https://developer.mozilla.org/en-US/docs/Web/API/Push_API).

## Minimal interface

The dashboard emphasizes today's total, goal, recording actions, and remaining
bottles or glasses. Decorative subtitles and duplicate goal/count summaries
are omitted. Undo has a short visible label and a descriptive accessible name.
Calendar legends, detailed settings explanations, benefit descriptions, and
onboarding calculation details expand on demand. Browser reminder limits and
the local-profile notice remain visible. All recording, editing, reset, theme,
language, and reminder features remain available.

The streak keeps its original dashboard card and calendar badge, with the
message explaining the current run of consecutive completed days.

## OpenSpec

O projeto está configurado com OpenSpec para planejar mudanças com o Codex.
Instale a ferramenta com `npm install -g @fission-ai/openspec@latest`.
No Codex, use `$openspec-propose` seguido da ideia para criar uma proposta,
`$openspec-apply-change` para implementar e `$openspec-archive-change` para arquivar.
No aplicativo desktop, selecione a habilidade correspondente na barra lateral.
Os requisitos e as propostas ficam em `openspec/`; as habilidades ficam em `.agents/skills/`.

## Linting

ESLint checks web source, Node tests, and JavaScript configuration files using
`eslint.config.js`. It enforces recommended JavaScript and React checks, single
quotes, semicolons, comma/key spacing, and clean line endings. Generated `dist/`
and dependencies are excluded. Run `npm run lint` before committing; CI rejects
errors and warnings. Use `npm run lint:fix` for automatic style fixes, then review
the diff. Swift and CSS are outside this JavaScript lint configuration.

## Dashboard file guide

`src/App.jsx` connects navigation, hydration state, preferences, and dialogs.
Find individual features in `src/dashboard/`:

- `HydrationCard.jsx`: daily progress ring and add/undo actions.
- `WaterLog.jsx`: recorded containers and remaining water; `WaterContainer.jsx` draws the icons.
- `BottleSizeEditor.jsx`: inline bottle/glass size form.
- `SettingsDialog.jsx`: goal, language, theme, and color edits.
- `RemindersDialog.jsx` and `ReminderNotice.jsx`: reminder settings, preview, and alert.
- `useWaterReminders.js`: saved preferences, per-profile deadlines, visibility checks, audio, and timer cleanup.
- `PourDialog.jsx` and `ResetDialog.jsx`: recording animation and reset confirmation.

Hydration rules remain in `src/state.js`, persistence in `src/database.js`, and
calendar rendering in `src/HydrationCalendar.jsx`. Dialogs keep draft edits local;
`App` applies confirmed changes. Keep these boundaries when adding features.

## Profile backup format

Profile backups are UTF-8 JSON files, limited to 10 MiB, identified by
`format: "sip-by-sip-profile"` and `version: 1`. They contain `exportedAt` (ISO
export time), `profile` (source display name, age, weight, initial goal, completed
setup), and `progress` (container sizes and selection, goal, active dated counter,
entries, tracking start, daily totals/snapshots, and earned completion dates).
The active date is exported as `YYYY-MM-DD`; unknown days remain absent.

Files are **not encrypted** and contain personal age, weight, and hydration data.
They exclude profile IDs, passwords, password hashes/salts, sessions, other
profiles, theme/language preferences, reminders, and reminder deadlines. Import
preserves the destination username and password. Unsupported versions and damaged
records are rejected before any replacement; they are not silently repaired.

For example, the portable envelope looks like this (the `progress` object must
contain the complete validated hydration state, not an abbreviated counter):

```json
{
  "format": "sip-by-sip-profile",
  "version": 1,
  "exportedAt": "2026-10-20T00:00:00.000Z",
  "profile": {
    "username": "Example",
    "age": 30,
    "weight": 70,
    "goalLiters": 2.45,
    "onboardingComplete": true
  },
  "progress": {
    "totalMl": 0,
    "garrafas": 0,
    "entries": [],
    "data": "2026-10-20",
    "startedOn": "2026-10-20",
    "dailyTotals": {},
    "dailyProgress": {},
    "completedDays": [],
    "container": "bottle",
    "mlGarrafa": 500,
    "mlCopo": 250,
    "metaLitros": 2.45
  }
}
```

## Move a profile to another browser

1. Sign in to the source profile and open **Configurações → Backup do perfil**
   (**Settings → Profile backup** in English).
2. Choose **Exportar backup / Export backup** and keep the downloaded JSON file.
3. In the destination browser, create or sign in to the profile you want to
   replace. Complete its age/weight onboarding first if it is new.
4. Close other tabs using that destination profile. Open its profile backup panel,
   choose the JSON file, and review the source and destination names.
5. Export the destination's current data first if you want to keep it, then choose
   **Confirmar substituição / Confirm replacement**. This replaces age, weight,
   water settings, progress, history, and achievements; it does not merge history.
   The destination username/password, other profiles, language/theme, and reminder
   preferences stay the same. The reminder countdown restarts after import.
6. After the success message, the dashboard shows the restored data. Refresh or
   reopen it to verify persistence. Reopen other tabs to load the restored data;
   existing same-profile tabs use the app's last-writer-wins policy.

Cancel the file picker, cancel the preview, or press Escape before confirmation
to leave the destination unchanged. During a transfer operation, wait for it to
finish before closing the dialog. A rejected file or failed storage write leaves
the original profile intact and allows retry. To recover after an unwanted
replacement, import your earlier destination backup through the same flow.
Backups do not sync automatically, and this format does not import into the iOS app.

### Transfer verification

`npm test` includes strict format checks, SQLite/IndexedDB round trips using
separate browser-storage simulations, injected write failures, and a focused
jsdom test loading the production React components through Vite. It exercises
file preview/cancellation, Escape, download initiation, pending-save handling,
replacement/retry, repeated import, destination credential retention, reminder
restart, localized controls, busy states, and reload persistence.

A real browser and screen reader were unavailable during implementation. Native
file-picker behavior, downloaded-file saving, modal focus trapping, screen-reader
announcements, mobile/light/dark visual layout, and transfer between two real
browser installations remain manual checks. The DOM tests simulate dialog APIs
and file selection; they do not substitute for those browser checks.
