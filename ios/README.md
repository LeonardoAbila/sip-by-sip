# Água do Dia — native iOS app

A separate SwiftUI implementation of the water tracker for iPhone and iPad, targeting iOS 17 or later. The web app stays in the repository root. Browser and iOS progress are stored independently; there is no account or sync service.

## Open on a Mac

1. Install Xcode with an iOS 17 or newer SDK.
2. Open `AguaDoDia.xcodeproj` and select the shared **AguaDoDia** scheme.
3. Choose an iPhone simulator and press **Run** (⌘R).
4. For a physical iPhone, select your development team in **Signing & Capabilities** and replace `com.example.AguaDoDia` with your own bundle identifier.

No third-party packages are required. Xcode's build phase converts the bundled real pouring recording to a PCM WAV using macOS `afconvert`, because custom system notification sounds require a supported system audio format. The MP3 is used for in-app playback. Credits and CC0 license details are in `AguaDoDia/Resources/SOURCES.md`.

## Features

- Saved water volume, bottle count, bottle size, and daily goal using `UserDefaults`.
- New local calendar days reset progress; settings and already-recorded volume survive settings edits.
- Português (BR), English, and Español, with localized number formatting.
- System, light, and dark themes.
- Native settings sheet with temporary edits, save, and cancellation.
- A pouring popup on each bottle, with fades and reduced-motion support.
- Water reminders every 15, 30, 60, or 120 minutes. Saving enabled reminders requests iOS notification permission. Notifications can arrive when the app is closed; foreground delivery shows an in-app reminder. Adding water or dismissing that reminder restarts the schedule. Background notifications repeat until disabled, including overnight; delivery and sound follow iOS notification, Focus, and mute settings.
- **Test reminder** previews the notification and real liquid-pouring sound without changing water progress or requesting notification permission.

## Validation status

This project was generated in Linux, where Xcode and the iOS simulator are unavailable. Source/resource references, translation coverage, the shared scheme, and archive contents were checked. Native compilation, sound conversion, VoiceOver, and notification delivery must still be verified on macOS/iOS.

On a Mac, run:

```sh
xcodebuild -project AguaDoDia.xcodeproj -scheme AguaDoDia -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Check saving and cancelling settings, adding bottles with changed sizes, persistence after relaunch, reset confirmation, decimal entry in each language, reduced motion, sound preview, notification permissions (allowed/denied), foreground/background notification delivery, and a new local day. Provide app icons and your signing configuration before App Store distribution.
