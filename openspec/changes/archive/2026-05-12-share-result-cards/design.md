## Context

Currently all share links point to the homepage. A `?score=15&total=20&streak=5` URL scheme lets us encode the entire share state in query params — no backend needed, the data travels with the link.

Next.js supports `opengraph-image.tsx` routes that use `@vercel/og` (Satori) to render JSX to PNG at the edge. The homepage previously tried this pattern but hit a Facebook crawler 403 — we'll treat that as a known issue and proceed.

## Goals / Non-Goals

**Goals:**
- `/result` page renders a shareable result display with the user's score
- Dynamic OG image at `/result/opengraph-image.tsx` generates a branded card from URL params
- Share buttons in Game.tsx link to `/result?...` instead of homepage

**Non-Goals:**
- Fixing the Facebook crawler 403 (known issue, tracked separately)
- Server-side storage of results (all state lives in URL params)
- Leaderboard or global score aggregation

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| URL encoding | Search params: `?score=15&total=20&streak=5` | Standard pattern, clean URLs, easy to read in OG route |
| Result page behavior | Static display with "Play Now" CTA | Lets users land, see the score, and click through. No auto-redirect |
| OG image generator | `opengraph-image.tsx` via `@vercel/og` | Same approach as before, still the best option. Facebook issue is isolated to that crawler |
| OG card content | Score (X/Y), accuracy %, streak with emoji | Standard share card conventions — headline stats |
| OG card dimensions | 1200×630px | Standard OG image size, works across all platforms |
| Share flow | "Copy Results" copies the `/result?...` URL | One share mechanism. Social buttons (X, FB) also use the result URL |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Facebook crawler 403 on OG image (recurring) | Accept as known issue. Card works on X/Twitter, Slack, Discord, iMessage. FB preview degraded but link still works |
| URL params are editable (anyone can forge a perfect score) | It's a share card, not a leaderboard. No authority needed for self-reported scores |
| Long URLs could be unwieldy | Params are short (`s`, `t`, `st`). Total URL well under 100 chars |
| `@vercel/og` has a 1MB response limit | Our card is simple text + gradients, well under the limit |
