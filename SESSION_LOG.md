## Session: 2026-05-12

### Completed
- Powerups: Made by @nweiler badge, Share on X, Suggest a repo link, streak confetti (`canvas-confetti`) — `src/app/page.tsx`
- Build-time round generation: `scripts/generate-rounds.mjs` fetches snippets from GitHub API, outputs `src/data/rounds.json` (489 entries)
- Pre-generated round cache: `actions.ts` serves from static JSON, zero runtime API calls. Lazy fallback to live API if cache missing
- Repo pool expanded: 30 → 56 repos with category + description fields (`repositories.json`)
- OG image: `src/app/opengraph-image.tsx` via `next/og` for rich social cards
- Daily challenge mode: static `daily.json` with 365 pre-computed entries (date-seeded), never regenerated
- Category filter pills: 8 categories (Frontend, Backend, AI/ML, Languages, Databases, Dev Tools, Mobile, Data)
- Wrong-guess hints: shows repo description + category tag
- Keyboard shortcuts: 1-4 for options, Enter for next, H for history
- Shimmer skeleton: replaced spinner with animated code-line placeholders
- Wordle-style share text → restored to "I just aced a round on CodeGuesser!" CTA
- Copy Results button alongside Share on X
- Static OG image: replaced dynamic route with `public/og-image.png` for Facebook compatibility
- Tightened landing copy: "Name that repo. We show code, you guess the project."

### Decisions
- `rounds.json` and `daily.json` are committed as static assets, regenerated via `npm run generate-rounds` (not on every build). Build is `next build` only.
- `daily.json` is generated once and never overwritten — script checks `fs.existsSync` first.
- GitHub token scope: classic token with `repo` scope, passed via `GITHUB_TOKEN` env var.

### Next
- Monitor Facebook Sharing Debugger at https://developers.facebook.com/tools/debug/ — static OG image may resolve the 403 once FB cache refreshes.
- Refresh `rounds.json` periodically by running `npm run generate-rounds` with a valid `GITHUB_TOKEN`.

### Notes
- GitHub secondary rate limiting hit during initial generate script run. Fixed with 400ms-2s delays between requests.
- `opengraph-image.tsx` (next/og) generated beautiful images but Facebook's crawler returned 403. Replaced with static `public/og-image.png` — likely a Vercel edge/Facebook crawler interaction issue.
