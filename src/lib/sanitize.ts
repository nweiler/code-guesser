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

export function sanitizeSnippet(snippet: string): string {
  let lines = snippet.split("\n");
  if (lines[0]?.startsWith("#!")) lines.shift();
  lines = lines.filter((line) => !giveawayPatterns.some((pattern) => pattern.test(line)));

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

  while (resultLines.length > 0 && resultLines[0].trim() === "") {
    resultLines.shift();
  }

  const maxLines = 50;
  if (resultLines.length > maxLines) {
    return resultLines.slice(0, maxLines).join("\n") + "\n\n// ... snippet truncated";
  }
  return resultLines.join("\n");
}

export function detectLanguage(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase() || "";
  return langMap[extension] || "text";
}
