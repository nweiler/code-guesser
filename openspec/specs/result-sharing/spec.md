## ADDED Requirements

### Requirement: Result page renders score from URL params

The system SHALL render a result page at `/result` that displays score information from URL query parameters.

#### Scenario: Page displays score with required params
- **WHEN** a user navigates to `/result?score=15&total=20&streak=5`
- **THEN** the page SHALL display "15 / 20", accuracy of "75%", and streak of "5"

#### Scenario: Page handles missing params gracefully
- **WHEN** a user navigates to `/result` with no query parameters
- **THEN** the page SHALL display a fallback state without crashing

#### Scenario: Page includes play CTA
- **WHEN** the result page loads with valid params
- **THEN** the page SHALL include a "Play Now" or equivalent call-to-action linking to the homepage

### Requirement: Dynamic OG image card

The system SHALL generate a dynamic Open Graph image for the `/result` page that reflects the user's score.

#### Scenario: OG image renders score
- **WHEN** a social media crawler requests the OG image for `/result?score=15&total=20&streak=5`
- **THEN** the image SHALL display "15 / 20" and the streak count prominently using the CodeGuesser brand colors

#### Scenario: OG image uses standard dimensions
- **WHEN** the OG image is generated
- **THEN** it SHALL be 1200×630 pixels

### Requirement: Share links encode result state

The game SHALL encode the current player's stats into the share URL.

#### Scenario: Share after a guess
- **WHEN** a player has guessed and clicks "Copy Results"
- **THEN** the copied text SHALL be the `/result` URL with `score`, `total`, and `streak` query parameters reflecting their current stats

#### Scenario: Social share buttons use result URL
- **WHEN** a player clicks "Share on X" after guessing
- **THEN** the shared URL SHALL be the `/result` URL with the player's stats as query parameters
