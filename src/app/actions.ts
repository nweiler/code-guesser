"use server";

import fs from "fs";
import path from "path";
import repositories from "@/data/repositories.json";
import { GameMode, GameRound, RateLimitError, RepoCategory } from "@/lib/types";
import { sanitizeSnippet, detectLanguage } from "@/lib/sanitize";
import { getGitHubContent, getRandomFileFromRepo } from "@/lib/github";

interface PreGeneratedRound {
  owner: string;
  name: string;
  snippet: string;
  fileName: string;
  language: string;
}

interface DailyEntry {
  date: string;
  owner: string;
  name: string;
  snippet: string;
  fileName: string;
  language: string;
}

let _rounds: PreGeneratedRound[] | null = null;
let _dailies: DailyEntry[] | null = null;

function getRounds(): PreGeneratedRound[] {
  if (!_rounds) {
    try {
      const p = path.join(process.cwd(), "src/data/rounds.json");
      _rounds = JSON.parse(fs.readFileSync(p, "utf-8")) as PreGeneratedRound[];
    } catch {
      _rounds = [];
    }
  }
  return _rounds;
}

function getDailyEntry(date: string): DailyEntry | undefined {
  if (!_dailies) {
    try {
      const p = path.join(process.cwd(), "src/data/daily.json");
      _dailies = JSON.parse(fs.readFileSync(p, "utf-8")) as DailyEntry[];
    } catch {
      _dailies = [];
    }
  }
  return _dailies.find((d) => d.date === date);
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

interface FetchOptions {
  mode?: GameMode;
  category?: RepoCategory | null;
}

export async function fetchNewRound(fetchOpts?: FetchOptions): Promise<GameRound> {
  const rounds = getRounds();
  const mode = fetchOpts?.mode ?? "endless";
  const category = fetchOpts?.category ?? null;

  // Filter rounds by category if specified
  let pool = rounds;
  if (category) {
    const repoIds = new Set(
      repositories.filter((r) => r.category === category).map((r) => `${r.owner}/${r.name}`)
    );
    pool = rounds.filter((r) => repoIds.has(`${r.owner}/${r.name}`));
  }

  // Fallback to unfiltered if category has no rounds
  if (pool.length === 0) pool = rounds;

  // Pre-generated rounds cache
  if (pool.length > 0) {
    let round: PreGeneratedRound;

    if (mode === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      const entry = getDailyEntry(today);
      if (entry) {
        round = entry;
      } else {
        round = pool[seededRandom(today) % pool.length];
      }
    } else {
      round = pool[Math.floor(Math.random() * pool.length)];
    }

    const repo = repositories.find((r) => r.owner === round.owner && r.name === round.name);
    const correctAnswer = `${round.owner}/${round.name}`;

    const distractors = repositories
      .filter((r) => {
        if (!category) return r.owner !== round.owner || r.name !== round.name;
        return r.category === category && (r.owner !== round.owner || r.name !== round.name);
      })
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((r) => `${r.owner}/${r.name}`);

    const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());

    return {
      snippet: round.snippet,
      options,
      correctAnswer,
      fileName: round.fileName,
      language: round.language,
      description: repo?.description ?? "",
      category: repo?.category ?? "",
    };
  }

  // Fallback: live API (dev environments without rounds.json)
  const repoPool = category
    ? repositories.filter((r) => r.category === category)
    : repositories;

  const fallbackRepos = repoPool.length > 0 ? repoPool : repositories;
  const correctRepo = fallbackRepos[Math.floor(Math.random() * fallbackRepos.length)];

  let filePath: string;
  let snippet: string;
  try {
    filePath = await getRandomFileFromRepo(correctRepo.owner, correctRepo.name);
    snippet = await getGitHubContent(correctRepo.owner, correctRepo.name, filePath);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("RATE_LIMIT:")) {
      const resetAt = err.message.slice("RATE_LIMIT:".length);
      throw new RateLimitError(resetAt);
    }
    throw err;
  }

  snippet = sanitizeSnippet(snippet);
  const language = detectLanguage(filePath);

  const distractors = fallbackRepos
    .filter((r) => r.id !== correctRepo.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((r) => `${r.owner}/${r.name}`);

  const correctAnswer = `${correctRepo.owner}/${correctRepo.name}`;
  const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());

  return {
    snippet,
    options,
    correctAnswer,
    fileName: filePath,
    language,
    description: correctRepo.description ?? "",
    category: correctRepo.category ?? "",
  };
}
