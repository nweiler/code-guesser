## Context

CodeGuesser currently stores all game history in browser localStorage with no server-side identity or persistence. Adding a verified leaderboard requires: (1) user authentication, (2) server-side round recording, (3) aggregate leaderboard queries. The app is deployed on Vercel; the server action pattern is already established via `fetchNewRound`.

## Goals / Non-Goals

**Goals:**
- Players can sign in with GitHub and see authenticated state in the UI
- Each round is recorded server-side after a guess, linked to the authenticated user
- A `/leaderboard` page shows top players ranked by accuracy (minimum 10 rounds)
- Results are queryable by time window (all-time, today) and category

**Non-Goals:**
- Email/password auth or multi-provider auth (GitHub only for v1)
- Head-to-head challenges or competitive matchmaking
- Gamification beyond the leaderboard (badges, tiers, leagues)
- Realtime updates (polling or page refresh is fine for v1)

## Decisions

**Decision: Auth.js v5 with GitHub OAuth**
- Natural fit for Next.js App Router, handles route handlers + session management
- GitHub OAuth only — players are already developers, no credential management overhead
- JWT sessions (no database adapter) — fewer queries, lower cold-start latency on Edge

**Decision: Vercel Postgres + Drizzle ORM**
- Tightest integration with existing Vercel deployment — one dashboard, no new infra
- Drizzle over Prisma: lighter bundle, edge-compatible, better type inference with Postgres
- Two tables: `users` (id, github_id, name, avatar, created_at) and `rounds` (id, user_id, correct_repo, guessed_repo, correct, category, created_at)

**Decision: Server actions for round recording**
- Consistent with existing `fetchNewRound` pattern
- Record after each guess, validate auth server-side, no client trust model
- Round data includes the correct answer and the user's guess — accuracy is computed, never submitted

**Decision: Leaderboard queries use a minimum-rounds filter**
- Default minimum of 10 rounds, configurable. Prevents 1/1 from appearing at 100%

**Decision: localStorage guest fallback remains**
- Unauthenticated players continue with localStorage-only history
- Signing in does not migrate localStorage stats (clean slate for verified scores)

## Risks / Trade-offs

- [Cold start latency] Vercel Postgres on free plan may add 200-500ms on initial connection — leaderboard page should handle loading state gracefully
- [Cheating via direct API calls] Server actions aren't secret — a motivated player could call `recordRound` with arbitrary data. Mitigation: server validates only one record per round-id (TBD if we add round IDs), rate-limit submissions per user
- [Game feel change] The round transition will be slightly slower since we POST before showing the next round. Mitigation: POST in background, prefetch next round in parallel
- [GitHub OAuth rate limits] GitHub has OAuth rate limits. Mitigation: use default Auth.js retry/backoff, not expected to be a bottleneck for this scale
