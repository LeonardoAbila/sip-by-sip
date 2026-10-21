# Proposal

## Why

Issue #11 asks for confidence that buttons, dialogs, and forms work, beyond the existing rules and storage tests. Recent work added one broad jsdom integration test, but core forms remain uncovered and mocked dialogs/downloads cannot prove native browser behavior.

## What Changes

- Define a documented coverage matrix: existing Node tests own rules/storage, focused DOM tests own component interactions, and real-browser tests own critical journeys and native behavior.
- Split the broad profile-transfer UI test into isolated cases with reusable setup/cleanup; constrain download mocks so navigation remains testable.
- Cover registration/login/onboarding validation, hydration add/undo, container-size editing, settings save/cancel/Escape, reset confirmation, and reminder controls with focused DOM checks.
- Add Playwright Chromium tests against a local production build for registration through persisted hydration/login, real navigation and modal keyboard behavior, and backup download/upload across isolated browser contexts.
- Run browser tests on pushes and pull requests in CI, with failure diagnostics and explicit test-runner separation.
- Document commands, coverage ownership, isolation, and remaining manual checks; correct stale testing guidance in AGENTS.md.

## Capabilities

### New Capabilities

None. Test infrastructure and coverage only; skip_specs is enabled.

### Modified Capabilities

None. Existing user-visible behavior remains the contract. Behavioral defects discovered during implementation must be surfaced before expanding scope.

## Impact

Affects tests/, a new e2e/ directory, Playwright configuration, package scripts/lockfile, ESLint test-file scopes/ignores, .gitignore, .github/workflows/test.yml, README.md, and stale testing descriptions in AGENTS.md. Add @playwright/test as a development dependency; retain node:test, jsdom, fake-indexeddb, and Vite. No runtime dependency, database migration, native iOS work, screenshot-baseline system, or product redesign.
