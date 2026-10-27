# Sip by Sip — native iOS app

A separate SwiftUI implementation of the water tracker for iPhone and iPad, targeting iOS 17 or later. The web app stays in the repository root. Browser and iOS progress are stored independently; there is no account or sync service.

## Visual preview

[Open the interactive iOS layout preview](https://leonardoabila.github.io/sip-by-sip/preview-ios/).

This browser preview demonstrates the mobile layout and uses temporary sample data.
It is not a compiled iOS app and does not read or sync your web or native progress.
Locally, run the web development server from the repository root and open
`/sip-by-sip/preview-ios/`.

## Open on a Mac

1. Install Xcode with an iOS 17 or newer SDK.
2. Open `AguaDoDia.xcodeproj` and select the shared **AguaDoDia** scheme.
3. Choose an iPhone simulator and press **Run** (⌘R).
4. For a physical iPhone, select your development team in **Signing & Capabilities** and replace `com.example.AguaDoDia` with your own bundle identifier.

No third-party packages are required. Xcode's build phase converts the bundled real pouring recording to a PCM WAV using macOS `afconvert`, because custom system notification sounds require a supported system audio format. The MP3 is used for in-app playback. Credits and CC0 license details are in `AguaDoDia/Resources/SOURCES.md`.

## Features

- Black and white surfaces with a blue accent, matching the approved web layout.
- Combined Home and History: intake ring, bottle/glass recording, undo, calendar and container metrics. Consecutive days appear beside the Sip by Sip name in the navigation header; points are absent.
- A compact Home/Benefits navigation bar with short transitions and reduced-motion support.
- Bottle and glass sizes can be edited in Settings. The centered **Alterar ml** button opens those settings. Previous entries retain their recorded amount and container.
- `UserDefaults` stores settings, dated entry snapshots and completed dates. Existing settings and bottle totals migrate without inventing undoable entries or historical daily volumes.
- Local date changes save the departing date and restore an existing snapshot when revisiting a date, including after time-zone travel. Unknown days remain distinct from known zero totals. Resetting today preserves other dates and completed-date history.
- Português (BR), English and Español, with localized dates/numbers; system, light and dark themes.
- Native Settings and Reminders sheets with temporary drafts, save and cancellation.
- A pouring popup for the matching bottle/glass, automatic dismissal and accessibility focus return.
- Native water reminders every 15, 30, 60 or 120 minutes, subject to notification permissions and iOS delivery settings. Foreground delivery shows an in-app reminder; adding water or dismissing it restarts the schedule. **Test reminder** previews without changing progress.

## Validation status

This project was generated in Linux, where Xcode and the iOS simulator are unavailable. Native compilation and model tests are configured in `.github/workflows/ios.yml` to run on macOS; consult the workflow result before treating the native build as verified. Native compilation, sound conversion, VoiceOver, and notification delivery must still be verified on macOS/iOS.

On a Mac, run:

```sh
swift test --package-path .
xcodebuild -project AguaDoDia.xcodeproj -scheme AguaDoDia -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Check saving and cancelling settings, adding bottles with changed sizes, persistence after relaunch, reset confirmation, decimal entry in each language, reduced motion, sound preview, notification permissions (allowed/denied), foreground/background notification delivery, and a new local day. Provide app icons and your signing configuration before App Store distribution.

The Swift package tests cover settings migration, legacy totals, bottle/glass undo
after reload, decimal arithmetic, known zero versus unknown dates, preserved
completion dates, streak boundaries, saved future snapshots and local date keys.
