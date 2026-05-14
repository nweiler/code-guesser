## ADDED Requirements

### Requirement: Leaderboard page

The system SHALL display a `/leaderboard` page showing top players ranked by accuracy.

#### Scenario: Leaderboard loads with default query
- **WHEN** a user navigates to `/leaderboard`
- **THEN** the page SHALL display players ranked by accuracy (descending), filtered to those with at least 10 recorded rounds

#### Scenario: Leaderboard shows player details
- **WHEN** the leaderboard is displayed
- **THEN** each entry SHALL show: rank number, GitHub avatar, display name, accuracy (percentage), rounds played, current streak

#### Scenario: Loading state
- **WHEN** the leaderboard data is loading
- **THEN** the page SHALL display a loading indicator

### Requirement: Leaderboard filters

The leaderboard SHALL support filtering by time window and category.

#### Scenario: Filter by time window
- **WHEN** a user selects "Today" filter
- **THEN** the leaderboard SHALL display only rounds recorded today

#### Scenario: Filter by category
- **WHEN** a user selects a category filter (e.g. "Frontend")
- **THEN** the leaderboard SHALL display only rounds from that category

#### Scenario: Combined filters
- **WHEN** a user selects both "Today" and a specific category
- **THEN** the leaderboard SHALL apply both filters simultaneously

### Requirement: Personal rank

The system SHALL show an authenticated user their own rank position.

#### Scenario: Personal rank card when signed in
- **WHEN** an authenticated user views the leaderboard
- **THEN** a personal rank card SHALL appear showing their position, accuracy, and rounds played, even if they don't meet the minimum rounds threshold
