const GITHUB_API_BASE = process.env.GITHUB_API_BASE || "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  throw new Error("Missing GITHUB_TOKEN environment variable (server-only)");
}

async function ghFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers || {}),
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = text;
  }

  if (!res.ok) {
    const message = json?.message || text || res.statusText;
    const err: any = new Error(message);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

export async function listUserRepos() {
  return ghFetch(`/user/repos?per_page=100`);
}

export async function createRepo(details: { name: string; private?: boolean; description?: string }) {
  return ghFetch(`/user/repos`, { method: "POST", body: JSON.stringify(details) });
}

export async function getRepo(owner: string, repo: string) {
  return ghFetch(`/repos/${owner}/${repo}`);
}

export async function getRepoFile(owner: string, repo: string, path: string, ref?: string) {
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  return ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${q}`);
}

export async function createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string, branch?: string, sha?: string) {
  const body: any = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
  };
  if (branch) body.branch = branch;
  if (sha) body.sha = sha;
  return ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
