# Proposal

## Why

Issue #8 asks contributors to find dashboard features without reading one enormous file. The earlier extraction moved most cards and dialogs, but navigation, streak, and reminder-card markup remain inside App, several extracted components have inconsistent indentation, and the README guide omits profile transfer.

## What Changes

- Extract DashboardNav, StreakCard, and ReminderCard into named files in src/dashboard/.
- Keep App responsible for state, navigation effects, persistence, and composing feature components.
- Normalize JSX indentation in App and dashboard components without changing rendered markup or behavior.
- Complete the README feature-to-file guide, including ProfileTransfer and the new components.
- Preserve all existing hydration, reminder, import, localization, accessibility, and responsive behavior.

## Capabilities

### New Capabilities

None. This is a behavior-preserving refactor; skip_specs is explicitly enabled.

### Modified Capabilities

None.

## Impact

Affects src/App.jsx, src/dashboard/, and the dashboard file guide in README.md. No new dependencies, storage migrations, CSS redesign, native iOS changes, or new product behavior. Existing tests, lint, build, and focused interaction checks validate preservation.
