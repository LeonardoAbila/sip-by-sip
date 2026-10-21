# Design

## Context

See proposal.md for motivation. App.jsx is currently 226 lines and already composes feature cards/dialogs. It still renders the navbar, streak, and reminder summary inline. useWaterReminders owns preferences, audio, deadlines, and cleanup; App owns routing effects, hydration state, autosave, and import coordination. The README has a dashboard file guide. Existing jsdom/Vite integration tests exercise settings, backup lifecycle, and reminder restart, but do not replace native browser checks.

## Goals / Non-Goals

**Goals:** Give each remaining substantial visible section a directly named module and make the contributor guide accurate. Preserve DOM structure and state ownership across extraction.

**Non-Goals:** No global context, new routing system, generalized card framework, hook rewrite, stylesheet reorganization, or arbitrary file-length threshold. Small heading/footer markup can remain in App.

## Decisions

### Presentational components with explicit inputs

Create src/dashboard/DashboardNav.jsx with screen, translated navigation labels, showLogout, onOpenSettings, and onLogout inputs. Keep hash anchors and aria-current semantics. App retains hashchange effects and home-heading focus.

Create StreakCard.jsx with translated streak label and formatted streak text inputs. App continues calculating achievements through existing state helpers.

Create ReminderCard.jsx with t, reminders, reminderVisible, reminderSeconds, and onOpen inputs. Move countdown formatting import into this component. Preserve the existing timer role, aria-live value, labels, classes, and settings button.

Use named props and existing component conventions; avoid passing the whole App state or introducing context. Leaving the markup inline would retain the discovery gap; adding a shared presentation framework would make this small learning project harder to navigate.

### Preserve lifecycle ownership and rendered structure

Move JSX without adding wrapper elements or changing class names, element IDs, callbacks, or translated text. Keep navigation and hydration mutation handlers, persistence guards, reminder hook invocation, and import remount coordination in their current owners. Do not nest component definitions inside App, which would introduce remount behavior.

Normalize two-space JSX nesting in App and dashboard components as a reviewable formatting pass. Do not introduce formatter dependencies or change lint policy.

### Verify observable behavior and contributor navigation

Extend the existing jsdom/Vite integration approach only where coverage is missing: hash navigation and aria-current, settings opening, logout, streak display, and reminder enabled/disabled/due/countdown presentation and open action. Prefer interaction/assertions on rendered semantics over import-source tests or large snapshots. Run the existing backup lifecycle test to catch changed App integration. Review preserved classes and nesting for CSS compatibility; record unavailable real-browser visual/focus checks explicitly.

Update the README guide with the three components, ProfileTransfer, and pointers to state, storage, translations, and styles. A contributor should find each visible feature from the guide without tracing App internals.

## Risks / Trade-offs

- Wrapper or nesting changes can alter CSS and focus behavior -> preserve the current DOM hierarchy and attributes; inspect affected UI when browser tooling is available.
- Passing the wrong callback or localized label can disconnect controls -> focused rendered interaction checks plus existing integration tests.
- Excessive extraction can obscure data flow -> extract only the three identified sections and keep lifecycle logic in App/useWaterReminders.
- Formatting can obscure functional edits -> separate formatting review from component extraction and check the diff for accidental changes.

## Migration Plan

No data migration is required. Ship source and documentation together after lint, tests, build, and strict OpenSpec validation pass. Rollback restores the prior component composition without changing stored data.
