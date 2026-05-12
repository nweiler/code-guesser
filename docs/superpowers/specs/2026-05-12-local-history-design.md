# Local History & Stats — Design Spec

**Date:** 2026-05-12  
**Status:** Approved

## Overview

Add a slide-in history drawer to CodeGuesser that tracks per-round results in `localStorage` and surfaces gameplay stats: overall accuracy, streaks, and per-repo accuracy breakdowns. No backend required.

## Data Model

Stored in `localStorage` under the key `codeguesser_history`.

```typescript
interface RoundResult {
  timestamp: number;    // Unix ms
  correctRepo: string;  // e.g. "torvalds/linux"
  guessedRepo: string;  // what the user actually selected
  correct: boolean;
}

interface GameHistory {
  rounds: RoundResult[];  // capped at 200; oldest entries dropped when limit is hit
  bestStreak: number;     // tracked explicitly on write to avoid full recompute
}
```

**Computed on read** (no derived state stored):
- `accuracy` — `correct / total` across all rounds
- `currentStreak` — count from the tail of `rounds` while `correct === true`
- `repoStats` — group rounds by `correctRepo`, compute per-repo hit rate and appearance count

## New Files

### `src/lib/history.ts`
All localStorage interaction and stat computation lives here. Exports:

- `loadHistory(): GameHistory` — reads and parses from localStorage; returns empty default on failure
- `saveRound(result: RoundResult): void` — appends round, enforces 200-entry cap, updates `bestStreak`
- `computeStats(history: GameHistory): GameStats` — returns derived stats (accuracy, currentStreak, repoStats sorted hardest-first)
- `clearHistory(): void` — resets to empty state (for future use / testing)

### `src/components/HistoryDrawer.tsx`
Stateless UI component. Receives computed stats as props, emits `onClose`.

Props:
```typescript
{
  open: boolean;
  stats: GameStats | null;
  onClose: () => void;
}
```

Renders nothing when `open === false` (no DOM overhead when closed).

## UI — Drawer

**Trigger:** "History" button added to the header, left of the score badge.

**Behavior:**
- Slides in from the right, overlays the game (does not push/reflow content)
- Width: 320px on desktop, 100vw on mobile (breakpoint: 600px)
- Backdrop: semi-transparent overlay behind the drawer
- Closes on: ✕ button click, `Escape` keypress, backdrop click

**Content — Stats grid (2×2):**
| | |
|---|---|
| Overall accuracy | Current streak |
| Best streak | Rounds played |

Current streak displays 🔥 emoji prefix when ≥ 2.

**Content — Repo accuracy section:**
- Header: "Repo accuracy"
- Lists every repo the user has encountered (≥ 1 round), sorted by accuracy ascending (hardest first)
- Each row: repo name · accuracy bar · percentage
- Bar color: red below 50%, green at 50% and above
- Shown only when `rounds.length > 0`; otherwise shows an empty state: "Play some rounds to see your stats."

## Changes to Existing Files

### `src/app/page.tsx`
- Import `saveRound`, `loadHistory`, `computeStats` from `lib/history`
- Import `HistoryDrawer` from `components/HistoryDrawer`
- Add `historyOpen: boolean` state
- Remove the existing `score`/`roundsPlayed` localStorage logic (key: `codeguesser_score`) — superseded by `codeguesser_history`; score and roundsPlayed are now computed from `rounds`
- In `handleGuess`: call `saveRound(...)` after determining correctness
- Pass `computeStats(loadHistory())` to `HistoryDrawer` when `historyOpen === true`
- Add "History" button to header

### `src/lib/types.ts`
Add `GameStats` interface:

```typescript
interface RepoStat {
  repo: string;
  correct: number;
  total: number;
  accuracy: number;  // 0–1
}

interface GameStats {
  accuracy: number;        // 0–1, 0 if no rounds
  currentStreak: number;
  bestStreak: number;
  roundsPlayed: number;
  repoStats: RepoStat[];  // sorted ascending by accuracy (hardest first)
}
```

## CSS

New styles scoped to `.history-drawer` and `.history-backdrop` added to `globals.css`:
- Drawer: fixed position, right edge, full height, slide transition (`transform: translateX`)
- Backdrop: fixed full-screen overlay, `z-index` below drawer
- Mobile: drawer width becomes 100vw

## Out of Scope

- Global leaderboard (separate feature)
- Per-round detail view (file name / language shown for the current round only, as today)
- History export
- Undo / replay
