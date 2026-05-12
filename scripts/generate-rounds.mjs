#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data");
const GITHUB_API = "https://api.github.com";

const SNIPPETS_PER_REPO = 10;
const MAX_REPOS = parseInt(process.env.MAX_REPOS || "999", 10);
const MAX_FILE_SIZE = 50 * 1024;

const CODE_EXTENSIONS = [".js", ".ts", ".tsx", ".py", ".go", ".rs", ".java", ".c", ".cpp", ".rb", ".dart"];

const GIVEAWAY_PATTERNS = [
  /^\s*import\s+/,
  /^\s*from\s+.*\s+import\s+/,
  /^\s*#include\s+/,
  /^\s*require\s*\(+/,
  /^\s*using\s+/,
  /^\s*package\s+/,
  /^\s*extern\s+crate\s+/,
  /^\s*mod\s+/,
];

const LANG_MAP = {
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

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN env var required");
  process.exit(1);
}

let rateLimitRemaining = Infinity;

function checkRateLimit(res) {
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (remaining) rateLimitRemaining = Math.min(rateLimitRemaining, parseInt(remaining, 10));
}

function authHeaders(accept) {
  return { Accept: accept, Authorization: `token ${token}` };
}

function sanitizeSnippet(snippet) {
  let lines = snippet.split("\n");
  if (lines[0]?.startsWith("#!")) lines.shift();
  lines = lines.filter((line) => !GIVEAWAY_PATTERNS.some((p) => p.test(line)));
  let resultLines = [];
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
    if (resultLines.length === 0 && (trimmed.startsWith("//") || trimmed.startsWith("#"))) continue;
    resultLines.push(line);
  }
  while (resultLines.length > 0 && resultLines[0].trim() === "") resultLines.shift();
  const maxLines = 50;
  if (resultLines.length > maxLines) {
    return resultLines.slice(0, maxLines).join("\n") + "\n\n// ... snippet truncated";
  }
  return resultLines.join("\n");
}

function detectLanguage(filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return LANG_MAP[ext] || "text";
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiFetch(url, accept) {
  const headers = authHeaders(accept);
  const res = await fetch(url, { headers });
  checkRateLimit(res);

  if (res.ok) return res;

  if ([403, 429].includes(res.status)) {
    const reset = res.headers.get("x-ratelimit-reset");
    const waitSecs = reset ? Math.max(parseInt(reset) * 1000 - Date.now(), 0) / 1000 + 2 : 60;
    console.warn(`  Rate limited (${res.status}). Waiting ${Math.round(waitSecs)}s...`);
    await sleep(waitSecs * 1000);
    return null; // caller retries
  }

  if (res.status === 404) return null;
  if (res.status >= 500) return null;

  return null;
}

async function getRepoFiles(repo) {
  // Fetch repo info
  let repoRes = null;
  for (let i = 0; i < 3 && !repoRes; i++) {
    repoRes = await apiFetch(`${GITHUB_API}/repos/${repo.owner}/${repo.name}`, "application/vnd.github.v3+json");
    if (!repoRes) await sleep(2000);
  }
  if (!repoRes) throw new Error("repo info failed");
  const repoData = await repoRes.json();
  const branch = repoData.default_branch || "main";
  await sleep(200);

  // Fetch git tree
  let treeRes = null;
  for (let i = 0; i < 3 && !treeRes; i++) {
    treeRes = await apiFetch(
      `${GITHUB_API}/repos/${repo.owner}/${repo.name}/git/trees/${branch}?recursive=1`,
      "application/vnd.github.v3+json"
    );
    if (!treeRes) await sleep(2000);
  }
  if (!treeRes) throw new Error("tree fetch failed");
  const treeData = await treeRes.json();
  if (!treeData.tree || !Array.isArray(treeData.tree)) throw new Error("invalid tree");
  if (treeData.truncated) throw new Error("tree truncated");
  await sleep(200);

  // Filter code files
  const codeFiles = treeData.tree.filter(
    (f) =>
      f.type === "blob" &&
      CODE_EXTENSIONS.some((ext) => f.path.endsWith(ext)) &&
      (f.size || 0) <= MAX_FILE_SIZE &&
      !f.path.includes("node_modules") &&
      !f.path.includes("vendor") &&
      !f.path.includes("tests/") &&
      !f.path.includes(".min.js")
  );

  // Shuffle and pick files
  const shuffled = codeFiles.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, SNIPPETS_PER_REPO);

  // Fetch file content sequentially with delays to avoid secondary rate limiting
  const results = [];
  for (const file of selected) {
    let contentRes = null;
    for (let i = 0; i < 3 && !contentRes; i++) {
      const url = `${GITHUB_API}/repos/${repo.owner}/${repo.name}/contents/${file.path}`;
      contentRes = await apiFetch(url, "application/vnd.github.v3.raw");
      if (!contentRes) await sleep(2000);
    }
    if (!contentRes) {
      console.warn(`    Skipping ${file.path} (failed to fetch)`);
      await sleep(400);
      continue;
    }
    const content = await contentRes.text();
    const snippet = sanitizeSnippet(content);
    if (snippet.trim().length < 20) {
      await sleep(400);
      continue;
    }
    results.push({
      owner: repo.owner,
      name: repo.name,
      snippet,
      fileName: file.path,
      language: detectLanguage(file.path),
    });
    await sleep(400); // delay between file fetches
  }
  return results;
}

function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

async function main() {
  console.log("Generating round cache...\n");

  const repos = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "repositories.json"), "utf-8"));
  const reposToProcess = repos.slice(0, MAX_REPOS);
  console.log(`${reposToProcess.length} repos, ${SNIPPETS_PER_REPO} snippets each\n`);

  const allRounds = [];
  let ok = 0, fail = 0;

  for (const repo of reposToProcess) {
    const label = `${repo.owner}/${repo.name}`;
    process.stdout.write(`  ${label}... `);
    try {
      const results = await getRepoFiles(repo);
      allRounds.push(...results);
      process.stdout.write(`OK (${results.length} snippets)`);
      ok++;
    } catch (err) {
      process.stdout.write(`FAIL (${err.message})`);
      fail++;
    }
    console.log(`  [${rateLimitRemaining} remaining]`);
  }

  const roundsPath = path.join(DATA_DIR, "rounds.json");
  fs.writeFileSync(roundsPath, JSON.stringify(allRounds));
  console.log(`\nDone. ${allRounds.length} rounds (${ok} repos OK, ${fail} repos failed)\nSaved to ${roundsPath}`);

  // Generate static daily challenges (only if not yet created)
  const dailyPath = path.join(DATA_DIR, "daily.json");
  if (!fs.existsSync(dailyPath) && allRounds.length > 0) {
    console.log("\nGenerating daily challenges...");
    const startDate = new Date();
    const dailies = [];

    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      const idx = seededRandom(dateStr) % allRounds.length;
      const r = allRounds[idx];

      dailies.push({
        date: dateStr,
        owner: r.owner,
        name: r.name,
        snippet: r.snippet,
        fileName: r.fileName,
        language: r.language,
      });
    }

    fs.writeFileSync(dailyPath, JSON.stringify(dailies));
    console.log(`Generated ${dailies.length} daily challenges\nSaved to ${dailyPath}`);
  } else {
    console.log(`\nDaily challenges already exist (${fs.existsSync(dailyPath) ? "file present" : "no rounds available"})`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
