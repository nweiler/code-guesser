const GITHUB_API_BASE = "https://api.github.com";

function authHeaders(accept: string): HeadersInit {
  const headers: HeadersInit = { Accept: accept };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function parseRateLimitReset(response: Response): string {
  const reset = response.headers.get("x-ratelimit-reset");
  if (reset) {
    const date = new Date(parseInt(reset, 10) * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return "soon";
}

export async function getGitHubContent(owner: string, repo: string, path: string) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: authHeaders("application/vnd.github.v3.raw"),
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      const resetAt = parseRateLimitReset(response);
      throw new Error(`RATE_LIMIT:${resetAt}`);
    }
    throw new Error(`GitHub Content API error: ${response.status}`);
  }

  return response.text();
}

export async function getRandomFileFromRepo(owner: string, repo: string) {
  // Repo info is stable — cache for 1 hour
  const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers: authHeaders("application/vnd.github.v3+json"),
    next: { revalidate: 3600 },
  });

  if (!repoResponse.ok) {
    if (repoResponse.status === 403 || repoResponse.status === 429) {
      const resetAt = parseRateLimitReset(repoResponse);
      throw new Error(`RATE_LIMIT:${resetAt}`);
    }
    throw new Error(`Failed to fetch repo info: ${repoResponse.status}`);
  }

  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch;

  // File tree can be HUGE (e.g. Flutter, VS Code).
  // Next.js data cache has a 2MB limit per item. We disable caching here to avoid errors.
  const treeResponse = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    {
      headers: authHeaders("application/vnd.github.v3+json"),
      cache: "no-store",
    }
  );

  if (!treeResponse.ok) {
    if (treeResponse.status === 403 || treeResponse.status === 429) {
      const resetAt = parseRateLimitReset(treeResponse);
      throw new Error(`RATE_LIMIT:${resetAt}`);
    }
    throw new Error(`Failed to fetch tree: ${treeResponse.status}`);
  }

  const treeData = await treeResponse.json();

  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    throw new Error("Invalid tree data from GitHub");
  }

  const codeExtensions = [".js", ".ts", ".tsx", ".py", ".go", ".rs", ".java", ".c", ".cpp", ".rb", ".dart"];
  const codeFiles = treeData.tree.filter((file: { type: string; path: string }) =>
    file.type === "blob" &&
    codeExtensions.some((ext) => file.path.endsWith(ext)) &&
    !file.path.includes("node_modules") &&
    !file.path.includes("vendor") &&
    !file.path.includes("tests/") &&
    !file.path.includes(".min.js")
  );

  if (codeFiles.length === 0) {
    throw new Error("No code files found in repository");
  }

  const randomFile = codeFiles[Math.floor(Math.random() * codeFiles.length)] as { path: string };
  return randomFile.path;
}
