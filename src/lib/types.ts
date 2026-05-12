export interface GameRound {
  snippet: string;
  options: string[];
  correctAnswer: string;
  fileName: string;
  language: string;
}

export class RateLimitError extends Error {
  resetAt: string;
  constructor(resetAt: string) {
    super(`Rate limited. Resets at ${resetAt}.`);
    this.resetAt = resetAt;
  }
}
