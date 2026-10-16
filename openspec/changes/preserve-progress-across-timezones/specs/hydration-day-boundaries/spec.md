# Spec Delta

## Purpose

Preserve each profile's recorded hydration progress when the device's local calendar date changes during travel, ordinary midnight rollover, or reopening.

## ADDED Requirements

### Requirement: Local calendar date selects active progress
The application SHALL use the device's current local calendar date for the active hydration day. A date change SHALL save the departing date's progress and restore the destination date's recorded progress, or initialize zero when none exists. A time-zone change within the same date SHALL preserve active progress.

#### Scenario: Eastbound travel advances date
- **WHEN** a profile with 750 ml on October 14 in São Paulo changes to London at 2026-10-15T01:30:00Z
- **THEN** October 14 retains 750 ml and October 15 becomes active with its saved volume or zero

#### Scenario: Westbound travel reverses date
- **WHEN** a profile with 750 ml on October 15 in London changes to São Paulo at that same instant
- **THEN** October 15 retains 750 ml and October 14 becomes active with its saved volume or zero

#### Scenario: Return to a previously visited date
- **WHEN** a profile records 500 ml on October 14, visits October 15 and records 750 ml, then returns to October 14
- **THEN** the active volume is 500 ml, October 15 retains 750 ml, and revisiting October 15 restores 750 ml without duplication

#### Scenario: Offset changes without a date change
- **WHEN** a time-zone or daylight-saving offset changes while the local calendar date remains the same
- **THEN** the active volume and entries remain unchanged

#### Scenario: Ordinary midnight and skipped days
- **WHEN** the local date advances normally or the application reopens after multiple days
- **THEN** the departing date is preserved, the destination date is restored or starts at zero, and intervening unknown dates receive no invented volumes

### Requirement: Travel records survive reload and remain isolated
The application SHALL retain valid saved progress and earned completion dates even when temporarily later than the current local date after travel. Reloading and switching profiles SHALL preserve each profile's date-specific data. Invalid dates and invalid volumes SHALL remain rejected, and future calendar cells SHALL remain neutral without displaying volumes.

#### Scenario: Reload while west of a recorded date
- **WHEN** October 15 has saved 750 ml and an earned completion, but the device's local date is October 14 when reopening
- **THEN** October 15's volume and completion remain stored, its calendar cell remains neutral, and both become visible when that date is reached

#### Scenario: Profile isolation
- **WHEN** two profiles have different totals for the same dates and switch profiles after travel
- **THEN** each restores only its own date-specific progress and settings

#### Scenario: Legacy and partially invalid data
- **WHEN** a saved profile contains a valid active date and total, valid daily totals, and some impossible dates or invalid numeric values
- **THEN** valid data survives migration and repeated loading, invalid items are ignored, and unknown volumes remain unknown

### Requirement: Restored days preserve counter operations and rewards
The application SHALL apply additions, undo, and confirmed reset only to the active date. Restored recorded entries SHALL remain undoable; aggregate-only legacy history SHALL restore its volume without inventing entries. Settings SHALL persist across date transitions, and a date SHALL earn its completion reward at most once.

#### Scenario: Undo after returning to a date
- **WHEN** October 14 contains entries of 500 ml and 250 ml and the user revisits it and undoes the last entry
- **THEN** October 14 becomes 500 ml while other dates remain unchanged

#### Scenario: Reset survives another visit
- **WHEN** the user confirms reset on a restored date and later leaves and returns to it
- **THEN** that date restores zero, other dates retain their progress, and previously earned completions are preserved

#### Scenario: Aggregate-only legacy day
- **WHEN** the user revisits a legacy date with a known 1250 ml total but no recorded entries
- **THEN** the active total is 1250 ml and undo cannot remove invented historical entries

#### Scenario: Revisited goal and settings
- **WHEN** a completed date is revisited and reaches its goal again
- **THEN** no duplicate reward is granted and the profile's current container sizes and goal remain unchanged
