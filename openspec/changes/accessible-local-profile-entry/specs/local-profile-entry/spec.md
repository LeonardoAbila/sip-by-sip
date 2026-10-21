# Spec Delta

## Purpose

Let users choose and enter existing local profiles with their passwords while clearly understanding that this browser-only flow does not provide encrypted or server-authenticated accounts.

## ADDED Requirements

### Requirement: Select a saved local profile
The application SHALL offer a labeled keyboard-accessible selection of valid profiles saved in this browser/origin, alongside typed-username entry and new-profile registration. Selection SHALL display only the profile name and SHALL NOT establish a session or expose profile setup, history, or credentials.

#### Scenario: Choose between existing profiles
- **WHEN** the user selects one of two saved profiles
- **THEN** the entry form identifies that profile and asks for its password
- **AND** the application does not open the dashboard or change either profile's progress

#### Scenario: Empty browser
- **WHEN** no valid local profiles exist
- **THEN** the application offers registration and typed entry without an unusable profile chooser

### Requirement: Password-gated local entry
The application SHALL require a nonempty matching password before opening the selected or typed profile through the normal signed-out UI. Selecting another profile or switching entry/registration modes SHALL clear password, confirmation, and stale error drafts. Failed entry SHALL leave the session and all saved data unchanged.

#### Scenario: Incorrect password
- **WHEN** the user submits an incorrect password for a selected profile
- **THEN** an accessible error is shown and no session is created
- **AND** no profile data is modified

#### Scenario: Change selected profile
- **WHEN** the user switches profiles after typing a password or receiving an error
- **THEN** secret fields and the stale error are cleared before another entry attempt

### Requirement: Preserve existing local profiles and routing
The application SHALL retain existing IDs, usernames, password credentials, setup, history, rewards, and backup compatibility. Correct local entry SHALL resume incomplete onboarding or open the completed profile's dashboard. Valid existing sessions SHALL keep working, and logout SHALL return to signed-out entry.

#### Scenario: Existing profile after upgrade
- **WHEN** a preexisting completed profile is selected and its current password is submitted
- **THEN** its existing progress opens without resetting or rehashing credentials

#### Scenario: Pending setup and logout
- **WHEN** a profile with incomplete onboarding enters successfully
- **THEN** onboarding resumes
- **AND** logging out clears the active session without deleting that profile

### Requirement: Explain the purpose and limits of local entry
The application SHALL visibly explain at login and registration that profiles/data belong to this browser/origin, the password organizes local entry without encrypting data or preventing browser-level access, no cloud account/sync/recovery is provided, and a test password should be used. Help SHALL remain accessible without opening a separate document.

#### Scenario: Read before entering credentials
- **WHEN** the user reaches login or registration
- **THEN** the local-entry limitation is readable and associated with the form before submission
- **AND** the interface makes no claim that the password protects the stored database

### Requirement: Refresh selectable profiles safely
The application SHALL refresh the saved-profile list when returning to signed-out entry or regaining focus there, and recheck the selected profile against current storage before entry. A missing selection or storage error SHALL not create a session, overwrite saved data, or leave entry permanently disabled.

#### Scenario: Profile added in another tab
- **WHEN** another tab creates a profile and the signed-out entry page regains focus
- **THEN** that valid profile becomes selectable after a successful refresh

#### Scenario: Stale selection
- **WHEN** the selected profile no longer exists when entry is submitted
- **THEN** the application reports the problem accessibly and permits another selection or typed entry
