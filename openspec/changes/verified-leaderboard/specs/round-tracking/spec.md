## ADDED Requirements

### Requirement: Record round server-side

The system SHALL record each completed round in the database for authenticated users.

#### Scenario: Round recorded after a guess
- **WHEN** an authenticated user makes a guess and the result is known
- **THEN** the system SHALL store the round with: user ID, correct repo, guessed repo, correct/incorrect flag, category, and timestamp

#### Scenario: Round not recorded for unauthenticated users
- **WHEN** an unauthenticated (guest) user makes a guess
- **THEN** the system SHALL NOT attempt to record the round server-side

#### Scenario: Round recorded in background
- **WHEN** a round is recorded
- **THEN** the recording SHALL NOT block the UI from showing the result or transitioning to the next round

### Requirement: Round validation

The system SHALL validate each round submission before recording.

#### Scenario: Reject duplicate submissions
- **WHEN** the same round data is submitted twice for the same user
- **THEN** the second submission SHALL be rejected

#### Scenario: Reject invalid round data
- **WHEN** round data references a non-existent repository or has malformed data
- **THEN** the submission SHALL be rejected and no record created

### Requirement: Rate limiting

The system SHALL limit how frequently a user can submit rounds.

#### Scenario: Rate limit applies to rapid submissions
- **WHEN** a user submits more than 60 rounds per minute
- **THEN** subsequent submissions SHALL be rejected with a rate-limit error
