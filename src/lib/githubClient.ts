export async function fetchRepos() {
  const r = await fetch(`/api/github/repos`);
  if (!r.ok) throw new Error("Failed getting repos");
  return r.json();
}

export async function createRepoClient(name: string, isPrivate = false, description = "") {
  const r = await fetch(`/api/github/repos/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, private: isPrivate, description }),
  });
  if (!r.ok) throw new Error("Failed creating repo");
  return r.json();
}

export async function pushFileClient(owner: string, repo: string, path: string, content: string, message?: string, branch?: string) {
  const r = await fetch(`/api/github/contents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner, repo, path, content, message, branch }),
  });
  if (!r.ok) throw new Error("Failed pushing file");
  return r.json();
}
