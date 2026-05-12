"use server";

import fs from "fs";
import path from "path";
import repositories from "@/data/repositories.json";
import { GameRound, RateLimitError } from "@/lib/types";
import { sanitizeSnippet, detectLanguage } from "@/lib/sanitize";
import { getGitHubContent, getRandomFileFromRepo } from "@/lib/github";

interface PreGeneratedRound {
  owner: string;
  name: string;
  snippet: string;
  fileName: string;
  language: string;
}

let _rounds: PreGeneratedRound[] | null = null;

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

export async function fetchNewRound(): Promise<GameRound> {
  const rounds = getRounds();

  // Pre-generated rounds: pick randomly from cache (zero API calls)
  if (rounds.length > 0) {
    const round = rounds[Math.floor(Math.random() * rounds.length)];

    const repo = repositories.find((r) => r.owner === round.owner && r.name === round.name);
    const correctAnswer = `${round.owner}/${round.name}`;

    const distractors = repositories
      .filter((r) => r.owner !== round.owner || r.name !== round.name)
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
    };
  }

  // Fallback: live API (for dev environments where rounds.json hasn't been generated)
  const correctRepo = repositories[Math.floor(Math.random() * repositories.length)];

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

  const distractors = repositories
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
  };
}
