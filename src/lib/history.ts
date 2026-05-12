import { GameHistory, GameStats, RoundResult } from "./types";
import repositories from "@/data/repositories.json";

const HISTORY_KEY = "codeguesser_history";
const MAX_ROUNDS = 200;

export function loadHistory(): GameHistory {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return { rounds: [], bestStreak: 0 };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rounds)) return { rounds: [], bestStreak: 0 };
    return parsed as GameHistory;
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

const repoToCategory = new Map<string, string>(
  repositories.map((r) => [`${r.owner}/${r.name}`, r.category])
);

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
  const catMap = new Map<string, { correct: number; total: number }>();
  for (const round of rounds) {
    const repoEntry = repoMap.get(round.correctRepo) ?? { correct: 0, total: 0 };
    repoMap.set(round.correctRepo, {
      correct: repoEntry.correct + (round.correct ? 1 : 0),
      total: repoEntry.total + 1,
    });

    const category = repoToCategory.get(round.correctRepo) ?? "unknown";
    const catEntry = catMap.get(category) ?? { correct: 0, total: 0 };
    catMap.set(category, {
      correct: catEntry.correct + (round.correct ? 1 : 0),
      total: catEntry.total + 1,
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

  const categoryStats = Array.from(catMap.entries())
    .map(([category, { correct, total }]) => ({
      category,
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
    categoryStats,
  };
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
