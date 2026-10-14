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
```

Tests also run automatically on every push and pull request through
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

1. **Components:** `src/App.jsx` contains `App`, `Bottle`, and `ResetDialog`. Each is a JavaScript function returning JSX, which looks like HTML inside JavaScript. `<Bottle />` reuses the bottle illustration.
2. **State:** `const [state, setState] = useState(readState)` stores today's count, volume, and settings. `setState` changes that data and asks React to update the screen.
3. **Events:** `onClick={addBottle}` connects the add button to a function. The function updates state; React updates the total, bottles, and progress bar.
4. **Derived values:** The percentage is calculated from the total and goal during rendering. It doesn't need separate state.
5. **Effects:** `useEffect` saves hydration state to SQLite and IndexedDB after a change. Another effect checks for a new day and cleans up its timer when the component is removed.
6. **Controlled inputs:** Each input's `value` comes from React state; `onChange` updates it. Inside the settings dialog, invalid values show a message and disable saving.
7. **Props:** `ResetDialog` receives `onConfirm` and `onClose` from `App`. Props let a parent component pass data or behavior to a child.

For example, clicking **Adicionar garrafa** follows this flow:

```text
click → addBottle() → setState(...) → React renders updated JSX
                                      → useEffect saves to SQLite and IndexedDB
```

`src/main.jsx` mounts the app inside `<div id="root">` in `index.html`. `src/styles.css` controls its appearance. `src/state.js` loads and validates hydration data; `src/database.js` handles SQLite, IndexedDB persistence, and the upgrade from localStorage on the same browser origin. `StrictMode` runs extra development checks, so effect setup must be safe to repeat.

## Behavior

- The hydration calendar shows each local day as goal achieved (check), missed (cross), today still pending (dot), or no history (dash). Future days stay neutral. A missed day is marked only after it ends, including days when the app was closed. Dates before tracking began are not counted as misses. Existing profiles keep their completion history; the earliest valid saved progress date or completion date becomes the tracking start when migrating old data. Month navigation runs from that start month through the current month. The calendar shows the current streak and monthly completion/miss totals, follows the selected language, supports dark mode, and uses text/symbols alongside colors.

- The dashboard shows consecutive completed days in a centered streak card above the daily intake and bottle log; accumulated points are not displayed. Completing the daily goal earns **10 points**, once per local calendar day, and adds that day to the profile's streak. More water earns no additional points. The streak counts consecutive completed days, preserving yesterday's streak while today's goal is pending; a missed calendar day breaks the streak, even if the app was closed. Points stay accumulated after a broken streak. Rewards are saved with each profile's progress. Previously saved state is supported, and duplicate, invalid, and future completion dates are discarded when loading.
- A completed day's reward stays earned if the user resets the water counter or later raises the goal. Resetting and reaching the goal again cannot earn a second reward. Lowering today's goal can complete it using water already recorded. The reset affects water and bottle counts only. Achievements are shown in the selected language.

- Password fields include an eye button to show or hide each password independently. Passwords start hidden when switching between login and registration.
- The prototype starts on a login page. **Cadastre-se** asks only for username, test password, and password confirmation. The first login opens a separate setup page explaining why age and weight are needed. **Descobrir minha meta** then reveals the estimated liters with an animated filling bottle and number counter. **Revisar idade e peso** returns to the inputs; **Começar meu dia** saves setup and opens the existing counter. Reduced-motion preferences disable the animation. Setup resumes after logging out or refreshing until it is completed; completed profiles go directly to the counter on later logins, including profiles created before this setup flow was added.
- The initial goal uses the supplied formula: up to 17 years, 40 ml/kg; 18–55, 35 ml/kg; 56–65, 30 ml/kg; 66+, 25 ml/kg. Age 55 belongs to the 35 ml/kg band. For example, age 30 and 70 kg produce 2.45 L/day. Settings can override the initial goal. The setup's expandable reference links to the [Food and Nutrition Board publication](https://www.nationalacademies.org/publications/10925), distinguishing its total-water guidance (food and beverages included) from the prototype's weight-based formula; the latter is not attributed to that publication.
- **Sair** returns to login; entering again restores that profile's saved progress and goal. Profiles and counters are local to this browser and origin; the active profile survives a refresh in the same tab. Existing pre-login progress is migrated into its own SQLite progress row under its original key, separate from the new profiles. Theme, language, and reminder preferences remain browser-wide.
- Login is a demonstration, with no server authentication, account recovery, or cross-device accounts. Use test credentials. Passwords are saved as salted SHA-256 hashes rather than plain text; this is not production authentication. Clearing browser site data removes profiles and progress. Malformed saved profile data falls back safely to the login screen.

- The web dashboard uses a responsive two-column layout with a circular daily goal and primary add-water action, alongside the bottle log. A pair of compact streak and reminder cards sits above them. Goal and bottle size appear as compact details inside the bottle log; the hydration calendar follows below. On phones it stacks into one column, scales the progress ring to the card width, and arranges navigation in two columns. Mobile controls have larger touch targets, settings fields stack vertically, and dialogs scroll within the viewport. All labels, number formatting, and the date follow the selected language.

- Dialogs, reminder notices, language options and reminder previews fade in and out over 240 ms. Theme colors and button states transition smoothly. Reduced-motion preferences disable these effects; Escape still closes dialogs.

- Enable water reminders by opening the **Lembretes de água** dashboard card and choose 15, 30, 60, or 120 minutes, then save. Preferences persist in this browser. The **Som de água enchendo um copo** checkbox enables a real recording of water being poured into a cup, with two final drips for each reminder and test. Saving enabled reminders prepares browser audio; playback may require a user interaction after reloading. The visual reminder always remains available. **Testar aviso** displays the same reminder inside the Reminders dialog immediately, even when reminders are disabled. Preview buttons dismiss the test without recording water or changing settings. Reminders are off by default and appear inside the open app; an overdue reminder appears when you return to the tab. **Adicionar garrafa** records water and restarts the interval; **Agora não** dismisses it and restarts the interval. No system notification permission is needed. Reopening the app starts a fresh interval.

- The responsive top navigation includes the app name, **Início**, **Benefícios**, and **Configurações**. Open the dashboard reminder card to manage **Lembretes de água**. Navigation labels follow your chosen language.

- Each click on **Adicionar garrafa** opens a large popup showing a jug pouring water into a bottle and the recorded volume. It closes automatically after 3.4 seconds, or immediately with the close button or Escape. Closing the popup preserves the recorded water. The animation respects the system preference for reduced motion.
- The bottle log shows recorded bottles filled with water and remaining bottles as faint, dashed outlines. Remaining bottles are calculated from the water still needed and the current bottle size, rounding up; each group displays at most 24 illustrations with an overflow count.
- Add a bottle using its current size. Changing the size affects future bottles; it preserves water already recorded.
- Open **Configurações** to edit bottle size and daily goal. **Salvar** applies and saves both values; **Cancelar** or Escape discards edits. Changing the goal updates progress after saving.
- Open **Configurações** and click the **Idioma** button to choose **Português (BR)**, **English**, or **Español**. The dialog previews your chosen language; **Salvar** applies it to the app and number formatting, while **Cancelar** or Escape discards the change. Your selection is saved in this browser when storage is available; switching languages preserves your progress.
- Refresh to restore progress when browser storage is available.
- Start a new calendar day to reset the count and volume, keeping settings.
- Confirm **Zerar dia** to reset today's progress manually. The original two reset actions had the same effect and are combined here.
- Saved data stays in this browser, with no account or backend.
- Open **Configurações**, change **Modo escuro**, and choose **Salvar** to switch themes. The app initially follows your system theme and saves your selection when browser storage is available.

The theme is another `useState` example: saving the appearance settings changes `theme`, and an effect sets `data-theme` on the document and saves the preference. CSS variables in `src/styles.css` provide the two palettes; `src/theme.js` reads the saved or system preference.

## Try a small React exercise

Change the subtitle inside `App.jsx`, then save the file while the dev server is running. Vite updates the page. Next, change the button text or the bottle colors. These edits let you explore JSX and CSS before changing state logic.

`SettingsDialog` holds temporary input state. Saving passes both values to `App` through the `onSave` prop; cancelling removes the dialog and discards that temporary state.

The reminder audio is **pouring with two drips at the end** by Mafon2, released under CC0 on [Freesound](https://freesound.org/people/Mafon2/sounds/330025/). Source and license details are in `src/assets/SOURCES.md`.

## Native iOS version

A separate SwiftUI implementation is in `ios/`. Open `ios/AguaDoDia.xcodeproj` on a Mac with Xcode. See `ios/README.md` for setup, features, and validation limits. Local backup archives are excluded from Git; the current web source is in this repository.

- Open **Benefícios** in the navigation to read about hydration, everyday tips, and the CDC source. **Voltar e registrar água** returns to your dashboard; progress and reminders stay active while reading. The screen supports Portuguese, English, Spanish, and direct access through `#benefits`.

- **Configurações** contains **Modo escuro** and a favorite-color selector (green, blue, purple, pink, or orange). **Salvar** applies and remembers appearance choices in this browser; **Cancelar** or Escape discards edits. **Sair** is in the navbar and signs out immediately.
