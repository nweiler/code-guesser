const GITHUB_API_BASE = "https://api.github.com";

export async function getGitHubContent(owner: string, repo: string, path: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3.raw",
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
    headers,
    next: { revalidate: 0 }, // Don't cache for now to get fresh random files
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.text();
}

export async function getRandomFileFromRepo(owner: string, repo: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }

  // 1. Get the default branch
  const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });
  if (!repoResponse.ok) throw new Error("Failed to fetch repo info");
  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch;

  // 2. Get the recursive tree
  const treeResponse = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    { headers }
  );
  if (!treeResponse.ok) throw new Error("Failed to fetch tree");
  const treeData = await treeResponse.json();

  // 3. Filter for code files
  const codeExtensions = [".js", ".ts", ".tsx", ".py", ".go", ".rs", ".java", ".c", ".cpp", ".rb", ".dart"];
  const codeFiles = treeData.tree.filter((file: any) => {
    return (
      file.type === "blob" &&
      codeExtensions.some((ext) => file.path.endsWith(ext)) &&
      !file.path.includes("node_modules") &&
      !file.path.includes("vendor") &&
      !file.path.includes("tests/") &&
      !file.path.includes(".min.js")
    );
  });

  if (codeFiles.length === 0) throw new Error("No code files found");

  // 4. Pick a random file
  const randomFile = codeFiles[Math.floor(Math.random() * codeFiles.length)];
  return randomFile.path;
}