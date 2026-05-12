"use server";

import repositories from "@/data/repositories.json";
import { getGitHubContent, getRandomFileFromRepo } from "@/lib/github";
import { GameRound, RateLimitError } from "@/lib/types";

export async function fetchNewRound(): Promise<GameRound> {
  // 1. Pick a random repository
  const correctRepo = repositories[Math.floor(Math.random() * repositories.length)];

  // 2. Fetch a random file and its content
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

  // 3. Sanitize snippet (remove "gimmes")
  let lines = snippet.split("\n");

  if (lines[0]?.startsWith("#!")) lines.shift();

  const giveawayPatterns = [
    /^\s*import\s+/,
    /^\s*from\s+.*\s+import\s+/,
    /^\s*#include\s+/,
    /^\s*require\s*\(+/,
    /^\s*using\s+/,
    /^\s*package\s+/,
    /^\s*extern\s+crate\s+/,
    /^\s*mod\s+/,
  ];

  lines = lines.filter(line => !giveawayPatterns.some(pattern => pattern.test(line)));

  let resultLines: string[] = [];
  let inBlockComment = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("/*") || trimmed.startsWith("/**")) {
      inBlockComment = true;
      if (trimmed.endsWith("*/")) inBlockComment = false;
      continue;
    }
    if (inBlockComment) {
      if (trimmed.endsWith("*/")) inBlockComment = false;
      continue;
    }
    if (resultLines.length === 0 && (trimmed.startsWith("//") || trimmed.startsWith("#"))) {
      continue;
    }
    resultLines.push(line);
  }

  // 4. Trim empty lines at start and limit length
  while (resultLines.length > 0 && resultLines[0].trim() === "") {
    resultLines.shift();
  }

  const maxLines = 50;
  if (resultLines.length > maxLines) {
    snippet = resultLines.slice(0, maxLines).join("\n") + "\n\n// ... snippet truncated";
  } else {
    snippet = resultLines.join("\n");
  }

  // 5. Detect language from extension
  const extension = filePath.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    rb: "ruby",
    dart: "dart",
  };
  const language = langMap[extension] || "text";

  // 6. Generate distractors
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
