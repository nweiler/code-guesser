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
