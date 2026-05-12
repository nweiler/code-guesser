# Local History & Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a slide-in history drawer that tracks per-round results in localStorage and surfaces accuracy, streaks, and per-repo breakdowns.

**Architecture:** Pure localStorage — no backend. A `history.ts` module owns all read/write/compute logic. A stateless `HistoryDrawer` component renders the drawer UI from computed stats passed as props. `page.tsx` wires them together and replaces the old `codeguesser_score` storage with the richer `codeguesser_history` key.

**Tech Stack:** Next.js 14 App Router, TypeScript, Vitest + jsdom (tests), CSS (globals.css for drawer styles)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/types.ts` | Modify | Add `RoundResult`, `GameHistory`, `RepoStat`, `GameStats` |
| `src/lib/history.ts` | Create | localStorage read/write, stat computation |
| `src/lib/history.test.ts` | Create | Unit tests for history.ts |
| `src/components/HistoryDrawer.tsx` | Create | Drawer UI component |
| `src/app/globals.css` | Modify | Drawer + backdrop styles |
| `src/app/page.tsx` | Modify | Wire up drawer, replace old score storage |
| `vitest.config.ts` | Create | Vitest config with jsdom + path alias |
| `package.json` | Modify | Add `test` script, `vitest` + `jsdom` dev deps |

---

## Task 1: Set Up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Install dependencies**

```bash
cd /Users/nweiler/github/nweiler/mvp/code-guesser
npm install -D vitest jsdom
```

Expected: clean install, `vitest` and `jsdom` appear in `devDependencies`.

- [ ] **Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Add test script to `package.json`**

In the `"scripts"` object, add:

```json
"test": "vitest run"
```

- [ ] **Verify vitest works**

```bash
npm test
```

Expected: `No test files found` (or similar — not an error crash).

- [ ] **Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest + jsdom for unit testing"
```

---

## Task 2: Extend `types.ts` with History Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Add the four new interfaces** at the bottom of `src/lib/types.ts` (do not touch existing exports):

```ts
export interface RoundResult {
  timestamp: number;    // Unix ms
  correctRepo: string;  // e.g. "torvalds/linux"
  guessedRepo: string;  // what the user selected
  correct: boolean;
}

export interface GameHistory {
  rounds: RoundResult[];
  bestStreak: number;
}

export interface RepoStat {
  repo: string;
  correct: number;
  total: number;
  accuracy: number;  // 0–1
}

export interface GameStats {
  accuracy: number;        // 0–1, 0 if no rounds
  currentStreak: number;
  bestStreak: number;
  roundsPlayed: number;
  repoStats: RepoStat[];  // sorted ascending by accuracy (hardest first)
}
```

- [ ] **Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add history types (RoundResult, GameHistory, RepoStat, GameStats)"
```

---

## Task 3: Write Failing Tests for `history.ts`

**Files:**
- Create: `src/lib/history.test.ts`

- [ ] **Create `src/lib/history.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { loadHistory, saveRound, computeStats, clearHistory } from "./history";

beforeEach(() => {
  localStorage.clear();
});

describe("loadHistory", () => {
  it("returns empty history when nothing is stored", () => {
    expect(loadHistory()).toEqual({ rounds: [], bestStreak: 0 });
  });

  it("returns stored history", () => {
    const data = {
      rounds: [{ timestamp: 1, correctRepo: "a/b", guessedRepo: "a/b", correct: true }],
      bestStreak: 1,
    };
    localStorage.setItem("codeguesser_history", JSON.stringify(data));
    expect(loadHistory()).toEqual(data);
  });

  it("returns empty history on corrupted data", () => {
    localStorage.setItem("codeguesser_history", "not-json{{{");
    expect(loadHistory()).toEqual({ rounds: [], bestStreak: 0 });
  });
});

describe("saveRound", () => {
  it("appends a round to history", () => {
    const round = { timestamp: 1, correctRepo: "a/b", guessedRepo: "a/b", correct: true };
    saveRound(round);
    expect(loadHistory().rounds).toHaveLength(1);
    expect(loadHistory().rounds[0]).toEqual(round);
  });

  it("enforces 200-round cap by dropping oldest entries", () => {
    for (let i = 0; i < 201; i++) {
      saveRound({ timestamp: i, correctRepo: "a/b", guessedRepo: "a/b", correct: true });
    }
    const { rounds } = loadHistory();
    expect(rounds).toHaveLength(200);
    expect(rounds[0].timestamp).toBe(1);  // timestamp 0 was dropped
  });

  it("updates bestStreak when current streak exceeds prior best", () => {
    saveRound({ timestamp: 1, correctRepo: "a/b", guessedRepo: "a/b", correct: true });
    saveRound({ timestamp: 2, correctRepo: "a/b", guessedRepo: "a/b", correct: true });
    saveRound({ timestamp: 3, correctRepo: "a/b", guessedRepo: "a/b", correct: true });
    expect(loadHistory().bestStreak).toBe(3);
  });

  it("does not reduce bestStreak after a wrong answer", () => {
    saveRound({ timestamp: 1, correctRepo: "a/b", guessedRepo: "a/b", correct: true });
    saveRound({ timestamp: 2, correctRepo: "a/b", guessedRepo: "a/b", correct: true });
    saveRound({ timestamp: 3, correctRepo: "a/b", guessedRepo: "x/y", correct: false });
    expect(loadHistory().bestStreak).toBe(2);
  });
});

describe("computeStats", () => {
  it("returns zeroed stats for empty history", () => {
    const stats = computeStats({ rounds: [], bestStreak: 0 });
    expect(stats.accuracy).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
    expect(stats.roundsPlayed).toBe(0);
    expect(stats.repoStats).toHaveLength(0);
  });

  it("computes accuracy as correct/total", () => {
    const rounds = [
      { timestamp: 1, correctRepo: "a/b", guessedRepo: "a/b", correct: true },
      { timestamp: 2, correctRepo: "a/b", guessedRepo: "x/y", correct: false },
    ];
    expect(computeStats({ rounds, bestStreak: 0 }).accuracy).toBe(0.5);
  });

  it("computes currentStreak from the tail only", () => {
    const rounds = [
      { timestamp: 1, correctRepo: "a/b", guessedRepo: "x/y", correct: false },
      { timestamp: 2, correctRepo: "a/b", guessedRepo: "a/b", correct: true },
      { timestamp: 3, correctRepo: "a/b", guessedRepo: "a/b", correct: true },
    ];
    expect(computeStats({ rounds, bestStreak: 0 }).currentStreak).toBe(2);
  });

  it("currentStreak is 0 when last round was wrong", () => {
    const rounds = [
      { timestamp: 1, correctRepo: "a/b", guessedRepo: "a/b", correct: true },
      { timestamp: 2, correctRepo: "a/b", guessedRepo: "x/y", correct: false },
    ];
    expect(computeStats({ rounds, bestStreak: 0 }).currentStreak).toBe(0);
  });

  it("sorts repoStats hardest first (ascending accuracy)", () => {
    const rounds = [
      { timestamp: 1, correctRepo: "easy/repo", guessedRepo: "easy/repo", correct: true },
      { timestamp: 2, correctRepo: "easy/repo", guessedRepo: "easy/repo", correct: true },
      { timestamp: 3, correctRepo: "hard/repo", guessedRepo: "x/y", correct: false },
      { timestamp: 4, correctRepo: "hard/repo", guessedRepo: "x/y", correct: false },
    ];
    const { repoStats } = computeStats({ rounds, bestStreak: 0 });
    expect(repoStats[0].repo).toBe("hard/repo");
    expect(repoStats[0].accuracy).toBe(0);
    expect(repoStats[1].repo).toBe("easy/repo");
    expect(repoStats[1].accuracy).toBe(1);
  });

  it("uses stored bestStreak when it exceeds currentStreak", () => {
    const rounds = [
      { timestamp: 1, correctRepo: "a/b", guessedRepo: "a/b", correct: true },
      { timestamp: 2, correctRepo: "a/b", guessedRepo: "x/y", correct: false },
    ];
    expect(computeStats({ rounds, bestStreak: 5 }).bestStreak).toBe(5);
  });
});

describe("clearHistory", () => {
  it("removes all history from localStorage", () => {
    saveRound({ timestamp: 1, correctRepo: "a/b", guessedRepo: "a/b", correct: true });
    clearHistory();
    expect(loadHistory()).toEqual({ rounds: [], bestStreak: 0 });
  });
});
```

- [ ] **Run tests — verify they all fail**

```bash
npm test
```

Expected: all tests fail with `Cannot find module './history'`.

---

## Task 4: Implement `history.ts`

**Files:**
- Create: `src/lib/history.ts`

- [ ] **Create `src/lib/history.ts`**

```ts
import { GameHistory, GameStats, RoundResult } from "./types";

const HISTORY_KEY = "codeguesser_history";
const MAX_ROUNDS = 200;

export function loadHistory(): GameHistory {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return { rounds: [], bestStreak: 0 };
    return JSON.parse(raw) as GameHistory;
  } catch {
    return { rounds: [], bestStreak: 0 };
  }
}

export function saveRound(result: RoundResult): void {
  const history = loadHistory();
  history.rounds.push(result);
  if (history.rounds.length > MAX_ROUNDS) {
    history.rounds = history.rounds.slice(-MAX_ROUNDS);
  }
  const stats = computeStats(history);
  history.bestStreak = Math.max(history.bestStreak, stats.currentStreak);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function computeStats(history: GameHistory): GameStats {
  const { rounds, bestStreak } = history;
  const roundsPlayed = rounds.length;
  const correctCount = rounds.filter((r) => r.correct).length;
  const accuracy = roundsPlayed === 0 ? 0 : correctCount / roundsPlayed;

  let currentStreak = 0;
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i].correct) currentStreak++;
    else break;
  }

  const repoMap = new Map<string, { correct: number; total: number }>();
  for (const round of rounds) {
    const entry = repoMap.get(round.correctRepo) ?? { correct: 0, total: 0 };
    repoMap.set(round.correctRepo, {
      correct: entry.correct + (round.correct ? 1 : 0),
      total: entry.total + 1,
    });
  }

  const repoStats = Array.from(repoMap.entries())
    .map(([repo, { correct, total }]) => ({
      repo,
      correct,
      total,
      accuracy: correct / total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  return {
    accuracy,
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    roundsPlayed,
    repoStats,
  };
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
```

- [ ] **Run tests — verify they all pass**

```bash
npm test
```

Expected: all tests pass, 0 failures.

- [ ] **Commit**

```bash
git add src/lib/history.ts src/lib/history.test.ts
git commit -m "feat: add history module with localStorage persistence and stat computation"
```

---

## Task 5: Add Drawer CSS to `globals.css`

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Append the following to the end of `src/app/globals.css`** (after the existing `@media` block):

```css
/* History drawer */
.history-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.history-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: var(--card-bg);
  border-left: 1px solid var(--border);
  z-index: 11;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.history-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.history-drawer-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--accent);
}

.history-close-btn {
  background: transparent;
  border: none;
  color: var(--foreground);
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.7;
}

.history-close-btn:hover {
  opacity: 1;
  background: transparent;
  border-color: transparent;
}

.history-empty {
  opacity: 0.5;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 2rem;
}

.history-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.history-stat {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.history-stat-val {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--foreground);
}

.history-stat-label {
  font-size: 0.75rem;
  color: var(--foreground);
  opacity: 0.5;
}

.history-divider {
  border-top: 1px solid var(--border);
  margin-bottom: 1rem;
}

.history-section-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.5;
  margin-bottom: 0.75rem;
}

.history-repo-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.history-repo-name {
  width: 120px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--foreground);
}

.history-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.history-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.history-bar--good {
  background: var(--success);
}

.history-bar--bad {
  background: var(--error);
}

.history-repo-pct {
  width: 32px;
  text-align: right;
  font-size: 0.75rem;
  opacity: 0.7;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .history-drawer {
    width: 100vw;
  }
}
```

- [ ] **Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add history drawer CSS"
```

---

## Task 6: Create `HistoryDrawer.tsx`

**Files:**
- Create: `src/components/HistoryDrawer.tsx`

- [ ] **Create `src/components/` directory if it doesn't exist**

```bash
mkdir -p /Users/nweiler/github/nweiler/mvp/code-guesser/src/components
```

- [ ] **Create `src/components/HistoryDrawer.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { GameStats } from "@/lib/types";

interface Props {
  open: boolean;
  stats: GameStats | null;
  onClose: () => void;
}

export default function HistoryDrawer({ open, stats, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const hasRounds = stats && stats.roundsPlayed > 0;

  return (
    <>
      <div className="history-backdrop" onClick={onClose} />
      <div className="history-drawer">
        <div className="history-drawer-header">
          <span className="history-drawer-title">History</span>
          <button className="history-close-btn" onClick={onClose}>✕</button>
        </div>

        {!hasRounds ? (
          <p className="history-empty">Play some rounds to see your stats.</p>
        ) : (
          <>
            <div className="history-stats-grid">
              <div className="history-stat">
                <span className="history-stat-val">{Math.round(stats.accuracy * 100)}%</span>
                <span className="history-stat-label">Accuracy</span>
              </div>
              <div className="history-stat">
                <span className="history-stat-val">
                  {stats.currentStreak >= 2 ? "🔥 " : ""}{stats.currentStreak}
                </span>
                <span className="history-stat-label">Current streak</span>
              </div>
              <div className="history-stat">
                <span className="history-stat-val">{stats.bestStreak}</span>
                <span className="history-stat-label">Best streak</span>
              </div>
              <div className="history-stat">
                <span className="history-stat-val">{stats.roundsPlayed}</span>
                <span className="history-stat-label">Rounds played</span>
              </div>
            </div>

            <div className="history-divider" />

            <div className="history-section-label">Repo accuracy</div>
            {stats.repoStats.map(({ repo, accuracy, total }) => (
              <div key={repo} className="history-repo-row">
                <span
                  className="history-repo-name"
                  title={`${total} round${total !== 1 ? "s" : ""}`}
                >
                  {repo}
                </span>
                <div className="history-bar-wrap">
                  <div
                    className={`history-bar ${accuracy >= 0.5 ? "history-bar--good" : "history-bar--bad"}`}
                    style={{ width: `${Math.round(accuracy * 100)}%` }}
                  />
                </div>
                <span className="history-repo-pct">{Math.round(accuracy * 100)}%</span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/components/HistoryDrawer.tsx
git commit -m "feat: add HistoryDrawer component"
```

---

## Task 7: Wire Up `page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

Replace the entire contents of `src/app/page.tsx` with the following. Key changes from the current file:
- `STORAGE_KEY` / `loadPersistedScore` / score localStorage `useEffect` are removed
- `score` and `roundsPlayed` are initialized from `computeStats(loadHistory())` on mount
- `historyOpen` state added
- `handleGuess` calls `saveRound(...)`
- "History" button added to header
- `HistoryDrawer` rendered at the bottom

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { fetchNewRound } from "./actions";
import { GameRound } from "@/lib/types";
import { computeStats, loadHistory, saveRound } from "@/lib/history";
import HistoryDrawer from "@/components/HistoryDrawer";

export default function Home() {
  const [round, setRound] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  const prefetchRef = useRef<Promise<GameRound> | null>(null);

  useEffect(() => {
    const stats = computeStats(loadHistory());
    setScore(Math.round(stats.accuracy * stats.roundsPlayed));
    setRoundsPlayed(stats.roundsPlayed);
    loadNextRound();
  }, []);

  const stats = useMemo(() => computeStats(loadHistory()), [historyVersion]);

  const loadNextRound = async (prefetched?: Promise<GameRound>) => {
    setLoading(true);
    setSelectedOption(null);
    setError(null);
    try {
      const newRound = await (prefetched ?? fetchNewRound());
      prefetchRef.current = null;
      setRound(newRound);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't load a snippet. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = (option: string) => {
    if (selectedOption || !round) return;

    const correct = option === round.correctAnswer;
    setSelectedOption(option);
    if (correct) setScore((s) => s + 1);
    setRoundsPlayed((p) => p + 1);

    saveRound({
      timestamp: Date.now(),
      correctRepo: round.correctAnswer,
      guessedRepo: option,
      correct,
    });
    setHistoryVersion((v) => v + 1);

    prefetchRef.current = fetchNewRound();
  };

  const handleNext = () => {
    const prefetched = prefetchRef.current ?? undefined;
    prefetchRef.current = null;
    loadNextRound(prefetched);
  };

  const guessed = !!selectedOption;
  const isRateLimit = error?.startsWith("Rate limited");

  return (
    <main>
      <header style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>CodeGuesser</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={() => setHistoryOpen(true)}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            History
          </button>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", background: "var(--card-bg)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            Score: {score} / {roundsPlayed}
          </div>
        </div>
      </header>

      <div className="code-container" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "200px", flexDirection: "column", gap: "1rem" }}>
            <div className="spinner"></div>
            <p>Scanning GitHub for secrets...</p>
          </div>
        ) : error ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "200px", flexDirection: "column", gap: "1rem", padding: "1.5rem", textAlign: "center" }}>
            {isRateLimit ? (
              <>
                <p style={{ fontSize: "2rem" }}>⏳</p>
                <p style={{ color: "var(--foreground)", fontWeight: "bold" }}>{error}</p>
                <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>
                  GitHub limits unauthenticated requests. Set a{" "}
                  <code>GITHUB_TOKEN</code> env var to get 5,000 requests/hour.
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "var(--error)" }}>{error}</p>
                <button onClick={() => loadNextRound()} style={{ color: "var(--foreground)" }}>Try Again</button>
              </>
            )}
          </div>
        ) : (
          <SyntaxHighlighter
            language={round?.language || "javascript"}
            style={vscDarkPlus}
            customStyle={{ margin: 0, padding: "1.5rem", fontSize: "0.9rem", background: "transparent" }}
            codeTagProps={{ style: { fontFamily: "var(--font-fira-code), monospace" } }}
          >
            {round?.snippet || ""}
          </SyntaxHighlighter>
        )}
      </div>

      <div style={{ height: "1.5rem", marginBottom: "1rem", width: "100%", display: "flex", justifyContent: "space-between", color: "var(--foreground)", opacity: 0.7, fontSize: "0.9rem" }}>
        {guessed && round && !loading && (
          <>
            <span>File: {round.fileName}</span>
            <span>Language: {round.language}</span>
          </>
        )}
      </div>

      <div className="options-grid">
        {round?.options.map((option) => {
          let className = "";
          if (selectedOption) {
            if (option === round.correctAnswer) className = "correct";
            else if (option === selectedOption) className = "incorrect";
          }
          return (
            <button
              key={option}
              className={className}
              onClick={() => handleGuess(option)}
              disabled={guessed || loading}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div style={{ height: "3.5rem", display: "flex", alignItems: "center", marginTop: "1rem" }}>
        <button
          onClick={handleNext}
          style={{
            background: "var(--accent)",
            color: "white",
            padding: "0.8rem 2.5rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            boxShadow: "0 4px 14px 0 rgba(88, 166, 255, 0.39)",
            opacity: guessed ? 1 : 0,
            pointerEvents: guessed ? "auto" : "none",
            transition: "opacity 0.2s",
          }}
        >
          Next Challenge →
        </button>
      </div>

      <footer style={{ marginTop: "auto", padding: "2rem", opacity: 0.5, fontSize: "0.8rem", textAlign: "center" }}>
        <p>Built with Next.js & GitHub API</p>
      </footer>

      <HistoryDrawer
        open={historyOpen}
        stats={stats}
        onClose={() => setHistoryOpen(false)}
      />
    </main>
  );
}
```

- [ ] **Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Run the dev server and manually verify**

```bash
npm run dev
```

Open http://localhost:3000 and confirm:
1. "History" button appears in the header
2. Clicking it opens the drawer with "Play some rounds to see your stats."
3. Play 3+ rounds — reopen History and verify accuracy, streak, and repo bars appear correctly
4. Correct guess shows green bar; wrong guess shows red
5. Streak increments on consecutive correct guesses
6. Escape key and backdrop click both close the drawer
7. Refresh the page — stats persist

- [ ] **Run tests one final time**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire up history drawer and replace old score storage"
```

- [ ] **Push**

```bash
git push
```
