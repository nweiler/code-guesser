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
