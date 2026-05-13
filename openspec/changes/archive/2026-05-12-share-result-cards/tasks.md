## 1. Result page

- [x] 1.1 Create `src/app/result/page.tsx` that reads `score`, `total`, `streak` from search params and renders a result display with "Play Now" CTA
- [x] 1.2 Handle missing/invalid params gracefully (fallback state, no crash)

## 2. Dynamic OG image

- [x] 2.1 Create `src/app/result/opengraph-image.tsx` that generates a 1200×630 branded card showing score, accuracy %, and streak using `@vercel/og`

## 3. Update share flow

- [x] 3.1 Update "Copy Results" in `src/components/Game.tsx` to copy the `/result?...` URL instead of share text
- [x] 3.2 Update "Share on X" and "Share on FB" buttons to link to `/result?...` with encoded stats
