## 1. Setup

- [x] 1.1 Install dependencies: `next-auth@beta`, `@auth/core`, `drizzle-orm`, `drizzle-kit`, `@vercel/postgres`
- [x] 1.2 Configure environment variables: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `POSTGRES_URL`
- [x] 1.3 Define Drizzle schema — `users` table (id, github_id, name, avatar, created_at) and `rounds` table (id, user_id, correct_repo, guessed_repo, correct, category, created_at)
- [x] 1.4 Generate and run initial migration

## 2. Auth (GitHub OAuth)

- [x] 2.1 Create Auth.js config (`src/auth.ts`) with GitHub provider and JWT session strategy
- [x] 2.2 Create auth API route handlers at `src/app/api/auth/[...nextauth]/route.ts`
- [x] 2.3 Add session type augmentation for user id, name, avatar fields
- [x] 2.4 Add "Sign in with GitHub" button to the Game.tsx header when unauthenticated
- [x] 2.5 Show GitHub avatar and display name in the header when authenticated
- [x] 2.6 Add sign-out button when authenticated

## 3. Round Tracking

- [x] 3.1 Create `recordRound` server action that stores a round in the DB for the authenticated user
- [x] 3.2 Add round validation — reject duplicate submissions and invalid data
- [x] 3.3 Add rate limiting — max 60 submissions per minute per user
- [x] 3.4 Wire `recordRound` into `Game.tsx` — call it after `handleGuess` for authenticated users, fire-and-forget (don't block UI)

## 4. Leaderboard Page

- [x] 4.1 Create `/leaderboard` page with a table showing ranked players (rank, avatar, name, accuracy, rounds, streak)
- [x] 4.2 Implement leaderboard query with minimum 10 rounds filter, ordered by accuracy descending
- [x] 4.3 Add time-window filter tab (All Time / Today)
- [x] 4.4 Add category filter dropdown that restricts the leaderboard to a specific repo category
- [x] 4.5 Add personal rank card at the top for authenticated users (their position even if below minimum rounds)
- [x] 4.6 Add navigation link to leaderboard from the home page header

## 5. Polish

- [x] 5.1 Handle all states on leaderboard page — loading skeleton, empty (no players yet), error
- [ ] 5.2 End-to-end test: sign in → play rounds → appear on leaderboard
- [ ] 5.3 Deploy to Vercel and verify auth + leaderboard work in production
