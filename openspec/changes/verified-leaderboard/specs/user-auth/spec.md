## ADDED Requirements

### Requirement: GitHub OAuth login

The system SHALL authenticate users via GitHub OAuth using Auth.js v5.

#### Scenario: User can sign in with GitHub
- **WHEN** a user clicks "Sign in with GitHub" button
- **THEN** the browser SHALL redirect to GitHub's OAuth authorization page, then back to the app after approval

#### Scenario: Session persists across page reloads
- **WHEN** a user signs in and reloads the page
- **THEN** the user SHALL remain authenticated

#### Scenario: Session expires gracefully
- **WHEN** a user's session expires or they sign out
- **THEN** the app SHALL return to the unauthenticated state without errors

### Requirement: Profile display

The system SHALL display the authenticated user's GitHub avatar and name in the game UI.

#### Scenario: Avatar and name shown when signed in
- **WHEN** a user is authenticated
- **THEN** the header SHALL display their GitHub avatar (24x24px) and display name

#### Scenario: No avatar shown when signed out
- **WHEN** a user is not authenticated
- **THEN** the header SHALL show a "Sign in with GitHub" button instead of an avatar

### Requirement: Sign out

The system SHALL allow authenticated users to sign out.

#### Scenario: User can sign out
- **WHEN** an authenticated user clicks "Sign Out"
- **THEN** their session SHALL be terminated and the UI SHALL return to unauthenticated state
