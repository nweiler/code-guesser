## Why

CodeGuesser has no persistent identity or shared competition — each player's stats live only in their browser's localStorage. A verified leaderboard turns a solo trivia game into a social challenge, driving retention, sharing, and daily engagement. GitHub OAuth keeps the trust bar high with zero credential management.

## What Changes

- Add GitHub OAuth login via Auth.js v5, creating persistent user identity
- Record every round server-side (not just localStorage) so scores are cryptographically trustworthy
- Add a `/leaderboard` page showing top players ranked by accuracy (min rounds filter)
- Show personal rank and verified stats on a profile section
- Migrate game state to be server-backed when signed in; localStorage continues as guest fallback

## Capabilities

### New Capabilities
- `user-auth`: GitHub OAuth, session management, profile display
- `round-tracking`: Server-side recording and verification of each guess
- `leaderboard`: Ranked display of top players with filters (all-time, daily, category)

### Modified Capabilities

None.

## Impact

- **New dependencies**: Auth.js v5 (`next-auth`), database (Vercel Postgres recommended), Drizzle ORM
- **New routes**: `/api/auth/*` (Auth.js handlers), `/leaderboard` (page)
- **New server actions**: `recordRound()`, `getLeaderboard()`, `getUserProfile()`
- **Modified client**: Game.tsx needs to track auth state and call `recordRound` after each guess
- **Storage**: New database tables for users, rounds; localStorage history remains for unauthenticated play
- **Data migration**: No migration needed — existing localStorage stats are independent
