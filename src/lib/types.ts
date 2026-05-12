export interface GameRound {
  snippet: string;
  options: string[];
  correctAnswer: string;
  fileName: string;
  language: string;
  description: string;
  category: string;
}

export type GameMode = "endless" | "daily";

export type RepoCategory = "frontend" | "backend" | "ai-ml" | "languages" | "databases" | "devtools" | "mobile" | "data";

export class RateLimitError extends Error {
  resetAt: string;
  constructor(resetAt: string) {
    super(`Rate limited. Resets at ${resetAt}.`);
    this.resetAt = resetAt;
  }
}

export interface RoundResult {
  timestamp: number;
  correctRepo: string;
  guessedRepo: string;
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
  accuracy: number;
}

export interface GameStats {
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  roundsPlayed: number;
  repoStats: RepoStat[];
}
