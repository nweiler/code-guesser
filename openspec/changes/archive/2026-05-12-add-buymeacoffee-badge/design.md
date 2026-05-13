## Context

The site footer currently shows "Built with Next.js & GitHub API", "View on GitHub", and "Suggest a repo" links. Adding a Buy Me a Coffee badge requires minimal change — a single link with a branded image or styled element.

This is entirely a frontend change. No backend, no API, no data model changes.

## Goals / Non-Goals

**Goals:**
- Display a recognizable Buy Me a Coffee badge in the site footer
- Link to the user's Buy Me a Coffee page
- Match the existing footer visual style

**Non-Goals:**
- JavaScript widget or floating button (too intrusive)
- Tracking click-through rate
- Server-side rendering of the badge image

## Configuration

Buy Me a Coffee username: `nweiler`
Badge target URL: `https://buymeacoffee.com/nweiler`

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Badge format | BMC hosted button image | Instantly recognizable, no extra CSS to maintain, their CDN handles it |
| Placement | Footer, inline with existing links | Consistent with convention, not distracting during gameplay |
| Configuration | Hardcoded username in `Game.tsx` or a constant | Single value, no env var overhead needed for a static site |
| Image variant | `default-yellow.png` | Most recognizable BMC button style |

Alternatives considered:
- **Plain text link**: Less visible, not recognizable as BMC
- **CSS-styled button**: More work to replicate their brand, no benefit
- **BMC widget script**: Adds JavaScript dependency and load time for a simple link

## Risks / Trade-offs

- **Image load failure** → Badge won't display, but link text can serve as fallback
- **Brand inconsistency** → If BMC changes their badge URL pattern, the image breaks — low risk, their CDN URLs are stable
- **Unknown username** → Need the user's Buy Me a Coffee handle to complete the link
