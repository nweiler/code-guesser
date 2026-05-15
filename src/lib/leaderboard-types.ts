export interface LeaderboardEntry {
  id: number;
  name: string;
  avatar: string;
  rounds: number;
  correct: number;
  accuracy: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  personalRank?: { rank: number | null; rounds: number; accuracy: number } | null;
}
