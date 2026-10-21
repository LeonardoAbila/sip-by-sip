# Design

## Context

See proposal.md for motivation. Node's test runner currently discovers rules/storage suites and one 200-plus-line jsdom/Vite React integration test. That test mixes backup failure/retry, navigation, localized cards, and settings; it installs dialog shims, overrides all anchor clicks, seeds a signed-in profile, and uses short polling sleeps. It does not exercise initial registration/onboarding or actual browser startup in main.jsx. GitHub Actions currently runs npm ci, lint, and npm test. Vite serves under /sip-by-sip/; startup loads sql.js Wasm and IndexedDB before rendering StrictMode. No main OpenSpec capabilities currently exist.

## Goals / Non-Goals

**Goals:** Assert observable interactions with isolated state; assign each behavior to the lowest useful test level; prove a few complete journeys in a real browser in CI. Keep the JavaScript learning project's tooling approachable.

**Non-Goals:** No new application behavior, runtime dependencies, production test backdoors, exhaustive browser/device matrix, screenshot baselines, full screen-reader certification, or native iOS automation. A discovered behavior defect requires a scope decision rather than silently changing the product contract.

## Decisions

### Coverage ownership

| Area | Focused DOM coverage | Real-browser coverage |
| --- | --- | --- |
| Profile forms | Registration mismatch/short password/duplicate name; wrong login; password visibility; onboarding invalid inputs, estimate/review/finish | Register and onboard through forms; logout, wrong-password rejection, successful login, reload persistence |
| Water entry | Bottle and glass add/undo, disabled undo, edit-size validation/save/cancel/Escape, recorded volume unchanged after size edits | Add both containers, close pour dialog, undo and reload; visible totals/history reflect saved entries |
| Settings | Invalid goal/volume prevents save; save applies values; cancel/Escape discards drafts; language/theme/accent changes | Native modal open, initial focus, Tab/Shift+Tab containment, Escape cancellation and focus return; a saved preference survives reload |
| Reset | Cancel/Escape preserves totals; confirmation clears today through App | Exercise real confirmation in the hydration journey and verify reload |
| Reminders | Enable/disable, valid custom/preset interval, invalid interval blocks save, cancel discards, preview dismissal records no water; existing hook/card behavior retained | Open and dismiss native reminder dialog; no long wall-clock alarm waits |
| Navigation | Retain focused aria-current/localized card checks separately from transfer | Click actual home/benefits links and verify active state and home focus |
| Backup | Preserve invalid-file, cancel/Escape, failure/retry, busy, latest-entry, remount, credential retention, and localized checks in independently named cases | Real download event and JSON file; upload into a separately registered destination context; cancel preview, confirm replacement, reload, retained destination login and unrelated profile |

Keep arithmetic, date/time-zone combinations, schema rejection permutations, and storage fault injection in existing Node suites. Avoid duplicating their matrices through browser clicks. Test PT-BR journeys in the browser and retain PT-BR/EN/ES DOM coverage for localized dashboard controls. Chromium desktop is the initial required browser; add one narrow-viewport check for key controls being reachable without building a device matrix. Visual palettes, audible playback quality, screen-reader announcements, and other engines remain explicitly manual.

### Reuse the DOM stack, isolate cases

Create tests/helpers/ UI harness modules that Node does not discover as test cases. Reuse node:test, jsdom, Vite SSR loading, React act, sql.js, and fake-indexeddb. Each case owns a fresh DOM, database factory, storage, root, and module environment; cleanup always unmounts, closes Vite/DOM, restores globals and patched prototypes, and releases timers. Cases that share globals must run serially within their process. No shared saved profile or suite-order assumptions.

Split profileTransferUi.test.mjs into cohesive named tests/files, moving navigation/card checks out of backup scenarios without dropping assertions. Limit the download shim to download anchors and restore it afterward. Use explicit DOM input/change/cancel simulation only where jsdom requires it, documenting that it does not prove native validation or focus trapping. Bounded predicate waits may remain for async persistence/Fade; avoid arbitrary sleeps as success criteria. Use labels, roles, names, and scoped dialogs for assertions; stable IDs are acceptable for inputs without testing private component state. Add no additional DOM testing dependency initially: the existing stack is sufficient for this bounded scope. A new abstraction or dependency would need a demonstrated need.

### Playwright against the production build

Add @playwright/test as a locked development dependency and playwright.config.js. Put browser specs in e2e/*.spec.js, outside tests/. Set npm test to explicitly discover tests/*.test.mjs so Node never imports Playwright specs; expose npm run test:e2e separately. Keep both commands documented and required in CI.

Use Playwright webServer to run npm run build followed by npm run preview on a fixed loopback port with --strictPort. Set baseURL to that server's /sip-by-sip/ URL and navigate relative to it, preserving the deployment base path. Avoid a live GitHub Pages dependency, external services, or direct application-module imports in journeys. Exercise real main.jsx, Wasm, IndexedDB, StrictMode, and form submissions.

Each test gets a fresh browser context, fixed locale/timezone and reduced-motion preference. Create profiles through UI helpers with test credentials. Backup transfer uses two isolated contexts and an actual downloaded file in the test's temporary output directory, then setInputFiles in the destination; it simulates separate browsers without claiming cross-engine coverage. Assert UI state and successful destination login after reload instead of inspecting SQLite internals. Use auto-waiting locators and retrying assertions; no unconditional timeout waits. Keep tests independent of real midnight and lengthy reminder deadlines.

Use desktop Chromium as one project, one worker in CI initially, fail on focused tests, bounded timeouts, and zero retries initially so failures remain visible. Keep traces and screenshots on failure and an HTML report. Ignore reports/results in Git and lint; include Node globals for e2e configuration/helpers where needed. Do not mock native dialogs or download APIs in browser tests.

### CI and contributor documentation

Add a browser job to .github/workflows/test.yml on its existing push/pull_request triggers. Preserve the existing lint/Node job; the browser job checks out, sets up the supported Node version, runs npm ci, installs Chromium plus OS dependencies, and runs npm run test:e2e. Upload failure reports/traces with a pinned artifact action consistent with repository conventions and bounded retention. Browser job failures must fail the workflow rather than become continue-on-error or silent skips.

Document install/run/debug steps, the coverage matrix, test-data isolation, and remaining manual work in README. Update only stale testing/command statements in AGENTS.md; its current claims of no lint script and no rendered UI tests conflict with package.json and tests. Do not rewrite unrelated instructions.

Implementation references: https://playwright.dev/docs/ci and https://playwright.dev/docs/browsers describe browser installation for CI, including npx playwright install --with-deps chromium. Use the installed version's supported APIs and lockfile at implementation time.

## Risks / Trade-offs

- Global DOM mocks leak between cases -> per-case cleanup and fresh storage/module environments; rerun isolated cases and full suites.
- Browser dependencies increase CI time -> one engine, a few journeys, one initial CI worker; no redundant arithmetic matrices.
- Native behavior differs from shims -> browser assertions own clicks, constraint validation, keyboard dialogs, Wasm startup, and file transport.
- Flaky animations/timers hide regressions -> reduced motion, state-based waits, controlled clocks only for focused tests, and bounded timeouts with failure artifacts.
- New tests reveal an existing behavioral defect -> report the mismatch and resolve scope before changing application behavior or weakening expected outcomes.
- Local runner lacks browser dependencies/network -> report blocked browser execution; installing/running the browser suite is required acceptance, not an optional manual-check substitute.

## Migration Plan

Land the isolated DOM harness/cases first, then browser infrastructure and journeys, then CI. Preserve existing regression assertions throughout. Acceptance requires lint, the complete Node/DOM suite, production build, strict OpenSpec validation, and successful real Chromium execution. Verify the Actions browser job on a pushed branch when authorized; otherwise distinguish local validation from unobserved hosted execution. Rollback removes development tooling/tests/CI additions without changing stored data or app behavior.
