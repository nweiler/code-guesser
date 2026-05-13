## Why

When someone shares their CodeGuesser result, the link just goes to the homepage with a generic OG image. A personalized result page with a dynamic OG card makes shares more compelling — friends see your score before they even click.

## What Changes

- New `/result` route that displays a user's score/streak from URL params
- Dynamic `opengraph-image.tsx` at `/result` that generates a branded card showing the score
- Share buttons in Game.tsx link to `/result?...` instead of just the homepage
- Static homepage OG image stays as-is

## Capabilities

### New Capabilities
- `result-sharing`: Shareable result page with dynamic OG image card showing score, accuracy, and streak

### Modified Capabilities
- `donation-support`: No change

## Impact

- `src/app/result/page.tsx` — new result display page
- `src/app/result/opengraph-image.tsx` — new dynamic OG image generator
- `src/components/Game.tsx` — update share links to encode result in URL
