## ADDED Requirements

### Requirement: Display donation badge

The system SHALL display a Buy Me a Coffee badge in the site footer.

#### Scenario: Badge is visible on page load
- **WHEN** the page loads
- **THEN** the footer SHALL contain a Buy Me a Coffee badge image or styled link

#### Scenario: Badge links to correct URL
- **WHEN** the user clicks the Buy Me a Coffee badge
- **THEN** the browser SHALL navigate to `https://buymeacoffee.com/<username>` in a new tab

#### Scenario: Badge is responsive
- **WHEN** the viewport width is less than 600px
- **THEN** the badge SHALL remain fully visible and not overflow the footer

### Requirement: Badge is non-intrusive

The donation badge SHALL NOT interfere with gameplay.

#### Scenario: Badge does not affect game state
- **WHEN** the user is playing the game
- **THEN** the badge SHALL remain a static link in the footer with no animations, popups, or state changes
