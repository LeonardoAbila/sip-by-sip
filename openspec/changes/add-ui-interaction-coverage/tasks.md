# Tasks

## 1. Isolated DOM coverage and ownership

- [x] 1.1 Extract reusable DOM/Vite/database setup and cleanup into tests/helpers, split the broad transfer test into independently named cases, and separate navigation/localized cards; verify each case runs independently and the full existing assertion set still passes with fresh state and restored globals.
- [x] 1.2 Scope the DOM download mock to download anchors and restore it after each case; verify normal anchor navigation remains functional and export initiation is still asserted without globally suppressing link clicks.
- [x] 1.3 Document the design coverage matrix and DOM test isolation rules in README and correct stale test/lint descriptions in AGENTS.md; verify paths and commands match the repository and distinguish simulated APIs from browser guarantees.

## 2. Forms and dashboard interactions

- [x] 2.1 Add isolated rendered profile-form cases for registration short/mismatched passwords, duplicate username, wrong login, password visibility, and onboarding invalid inputs/estimate/review/finish; verify visible errors, transition outcomes, and absence of unintended saves using the DOM suite.
- [x] 2.2 Add rendered hydration/container-editor cases for bottle/glass add, undo/disabled undo, valid/invalid size edits, save/cancel/Escape, and preservation of recorded volumes after size edits; verify visible totals, selected values, and saved outcomes through App integration where persistence matters.
- [x] 2.3 Add settings cases for invalid inputs and disabled save, saved values, cancel/Escape discarding goal/language/theme/accent drafts, and reset cancel/Escape/confirm; verify applied and persisted results separately from uncommitted drafts.
- [x] 2.4 Add reminder-form cases for enable/disable, custom/preset intervals, invalid interval rejection, save/cancel/Escape, and preview dismissal without adding water; verify callbacks and App integration while preserving existing timer/card assertions.
- [ ] 2.5 Extend the README coverage inventory with the actual new test files and commands; verify every matrix row has an implemented DOM owner or an explicit browser/manual owner without claiming untested behavior.

## 3. Real-browser infrastructure and journeys

- [ ] 3.1 Add locked @playwright/test, playwright.config.js, explicit Node test discovery, test:e2e script, e2e lint scope, and generated-output ignores; configure Chromium, fixed context preferences, production build/preview on loopback /sip-by-sip/, bounded timeouts, no retries, and failure diagnostics; verify npm test excludes browser specs, Playwright lists only e2e specs, lint passes, and the production server starts on the configured URL.
- [ ] 3.2 Add UI-only browser helpers and a journey for registration/onboarding, bottle/glass add/undo, reload, settings persistence, reset confirmation, logout, wrong-password rejection, and successful login; verify it passes in real Chromium with isolated context and actual Wasm/IndexedDB startup.
- [ ] 3.3 Add real-click home/benefits navigation and native-dialog keyboard checks for initial focus, Tab/Shift+Tab containment, Escape cancellation/focus return, and reminder opening/dismissal, plus one narrow-viewport reachability check; verify actual browser assertions without dialog or navigation mocks.
- [ ] 3.4 Add a real backup download/file-upload journey across independent source/destination contexts, including preview cancellation, confirmed replacement, reload, retained destination login, and an untouched second profile; verify the downloaded JSON is used for import and visible restored values survive reload with no shared-context shortcuts.
- [ ] 3.5 Document browser installation, run/debug commands, production base path, context/file isolation, failure artifacts, and remaining manual checks in README/AGENTS.md; verify the documented local steps run successfully with installed Chromium.

## 4. CI and integration acceptance

- [ ] 4.1 Add the required Chromium job on push/pull_request using npm ci, browser/OS dependency installation, test:e2e, and pinned failure-artifact upload with retention; preserve the lint/Node job, document CI behavior, and verify workflow structure matches the passing local command sequence with no continue-on-error or silent skips.
- [ ] 4.2 Run lint, the full Node/DOM suite, production build, real Chromium suite, and openspec validate add-ui-interaction-coverage --strict; verify all pass, repeat the browser suite once to check case isolation, and record actual results and any unobserved hosted CI execution without substituting a browser-unavailable disclaimer for required browser execution.
