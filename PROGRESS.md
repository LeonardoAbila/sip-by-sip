# Saved progress — 2026-10-12

This note records an earlier source snapshot from 2026-10-12. See README.md for current features and setup.

## Current developer handoff

The web and iOS source, dependency lockfile, tests, and documentation are now maintained in Git. Local backup archives are excluded from version control and are not required to run either project.

The web app now also includes local demonstration profiles, onboarding, points and streaks, a hydration calendar, hydration benefits, and favorite-color settings. Current verification: `node --test tests/achievements.test.mjs` and `npm run build` pass. Native compilation and simulator/device validation still require macOS and Xcode.

## Web app

React/Vite app in `src/`. Latest design: responsive teal dashboard, circular water goal, localized date, goal/bottle-size cards, bottle log, remaining volume and reminder status. Existing features remain: daily reset, saved progress, settings, Portuguese BR/English/Spanish, light/dark themes, pouring popup, fades, reminder intervals, test reminder and real liquid-pouring notification sound.

Audio source and CC0 license: `src/assets/SOURCES.md`. Settings and progress use browser localStorage. Reminders work while the web app is open. The preview does not record water.

Latest verification: production build passed; dashboard rendered in all three languages at 0, 3 and 28 bottles. Local server returned HTTP 200 at http://localhost:5173/. Visual browser checks, audio playback, timed reminder delivery and interactive fade checks remain unverified.

Run `npm install` then `npm run dev -- --port 5173 --strictPort`. If Node is absent from PATH in this workspace, the existing installation is `/tmp/node-v22.14.0-linux-x64/bin`; prepend it to PATH. Development server may need sandbox approval to listen. A running server is not guaranteed to survive the session.

## Native iOS app

Separate SwiftUI project at `ios/AguaDoDia.xcodeproj`; setup in `ios/README.md`. Includes saved tracking, language/theme settings, pouring popup, native reminders, and audio preview. Xcode project references, scheme, translation keys and resources were checked. Requires macOS/Xcode for compilation and simulator/device validation; neither was available here.

## Backups

- `WebAplicatoin.tar.gz`: earlier web snapshot, before the dashboard redesign; preserved.
- `AguaDoDia-iOS.tar.gz`: native iOS project snapshot.
- `AguaDoDia-progress-2026-10-12.tar.gz`: latest combined source snapshot, including the web redesign, native iOS project, this note, and dependency lockfile. Excludes generated builds, dependencies, Git internals and other archives. Run `npm install` after restoring the web source.

At the time of this earlier snapshot, project files were untracked and backups preserved them independently.

## Resume tomorrow

Start the web server, open the dashboard, and review the new design on desktop and mobile in both themes. Continue from the user's next requested change. Do not assume the earlier web snapshot contains the newest design.
