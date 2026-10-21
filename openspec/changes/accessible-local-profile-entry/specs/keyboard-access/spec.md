# Spec Delta

## Purpose

Support complete web app journeys through keyboard operation and meaningful accessible names, focus transitions, validation, and status feedback without requiring a mouse.

## ADDED Requirements

### Requirement: Operate all web journeys by keyboard
The application SHALL make profile selection/entry/registration, onboarding, navigation, water entry/undo, volume editing, settings, calendar month navigation, reminders, reset, and backup selection/confirmation/cancellation reachable and operable using standard keyboard controls in a logical order, with a visible focus indicator and no unintended keyboard traps.

#### Scenario: Complete the main journey
- **WHEN** the user navigates with Tab and Shift+Tab and activates controls with their standard keys
- **THEN** the user can enter a profile, record and undo water, edit settings, navigate calendar controls, and log out without a mouse

#### Scenario: Secondary controls
- **WHEN** the user opens reminder, reset, or backup controls by keyboard
- **THEN** their fields and available actions can be reached and activated without pointer interaction

### Requirement: Maintain predictable focus across transitions
The application SHALL place focus on a meaningful heading or control after entry, registration-mode changes, onboarding transitions, navigation, logout, and completed import. Closing a dialog or inline editor SHALL return focus to its opener when it remains available, otherwise to a meaningful replacement. A render or timer tick SHALL NOT repeatedly steal focus.

#### Scenario: Finish editing a container
- **WHEN** the user saves, cancels, or presses Escape in the inline volume editor
- **THEN** focus returns to the edit-volume control after the editor closes

#### Scenario: Change pages
- **WHEN** the user navigates to Benefits and then Home
- **THEN** focus moves to the displayed page heading without exposing hidden page controls in the tab order

#### Scenario: Successful import remounts the dashboard
- **WHEN** a confirmed import replaces the dashboard and removes its dialog/opener instance
- **THEN** focus moves to a meaningful visible destination and the completion feedback remains accessible

### Requirement: Preserve native modal keyboard behavior
Modal dialogs SHALL have an accessible name, receive meaningful initial focus, keep Tab/Shift+Tab within the active modal, and support Escape cancellation before a commit. Cancel/Escape SHALL discard drafts. During an irreversible in-flight import, duplicate confirmation and cancellation SHALL remain blocked until its result is known, without losing accessible progress/error feedback.

#### Scenario: Cancel a settings draft
- **WHEN** the user edits settings, cycles focus within the dialog, and presses Escape
- **THEN** the dialog closes, drafts are discarded, and focus returns to the opener

#### Scenario: Import commit is pending
- **WHEN** a confirmed import is still committing
- **THEN** duplicate confirmation and Escape cannot start another operation or cancel the commit
- **AND** progress remains accessible until success or a recoverable error

### Requirement: Expose names states and feedback accessibly
Interactive controls SHALL expose meaningful names and selected/expanded/invalid states. Forms SHALL associate field errors and help with the relevant inputs. Success, validation errors, and storage/transfer failures SHALL be available to assistive technology without relying only on color, decorative icons, or animation; frequent countdown updates SHALL not repeatedly interrupt reading.

#### Scenario: Form validation fails
- **WHEN** a profile, onboarding, volume, settings, or reminder form rejects input
- **THEN** the user can identify the affected input and the error through accessible names, associations, and feedback

#### Scenario: Calendar and hydration status
- **WHEN** a screen-reader user inspects recorded water, rewards, or calendar dates
- **THEN** names/text convey the amount or known lack of data and relevant status without interpreting decorative graphics

### Requirement: Retain accessible localized and reduced-motion use
Keyboard access, meaningful names, focus visibility, and feedback SHALL remain usable in the supported dashboard languages, light/dark themes, accent colors, narrow viewports, and reduced-motion mode. Existing Portuguese-only entry/onboarding copy SHALL remain consistently Portuguese unless that flow is explicitly localized later.

#### Scenario: Narrow localized dashboard
- **WHEN** the user operates dashboard controls in Portuguese, English, or Spanish at a narrow viewport with reduced motion
- **THEN** required controls remain reachable and their labels, focus, and feedback remain meaningful
