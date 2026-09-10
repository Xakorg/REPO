"use client";

import { useState } from "react";
import { useXakCode } from "../context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Lock, Globe2, Plus, RefreshCw, Loader2 } from "lucide-react";

export default function GithubWorkspacePage() {
  const { githubAccessToken, githubRepos, connectGithub, refreshGithubRepos, createGithubRepo } = useXakCode();
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleConnect = async () => {
    setIsBusy(true);
    setMessage("");
    const connected = await connectGithub();
    setMessage(connected ? "GitHub connected. Your repositories are ready." : "GitHub connection was cancelled or failed.");
    setIsBusy(false);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!repoName.trim()) return;
    setIsBusy(true);
    const created = await createGithubRepo(repoName, isPrivate);
    setMessage(created ? "Repository created on GitHub." : "Could not create that repository.");
    if (created) setRepoName("");
    setIsBusy(false);
  };

  if (!githubAccessToken) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#090910] p-8 text-white">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
          <Github className="mx-auto mb-5 h-12 w-12 text-white" />
          <h1 className="text-2xl font-black tracking-tight">Your GitHub workspace</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Browse repositories, create new ones, and open any project in the full XakCode IDE.
          </p>
          <Button onClick={handleConnect} disabled={isBusy} className="mt-6 h-11 w-full bg-white text-black hover:bg-white/90">
            {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
            Connect GitHub with OAuth
          </Button>
          {message && <p className="mt-4 text-xs text-amber-300">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#090910] p-6 text-white lg:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
              <Github className="h-4 w-4" /> GitHub workspace
            </div>
            <h1 className="text-3xl font-black tracking-tight">Repositories</h1>
            <p className="mt-2 text-sm text-white/45">Choose a repository to inspect, edit, or continue in the IDE.</p>
          </div>
          <Button onClick={() => refreshGithubRepos()} variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </header>

        <form onSubmit={handleCreate} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-xs font-black uppercase tracking-widest text-white/50">Create a GitHub repository</div>
          <div className="flex flex-wrap gap-2">
            <Input value={repoName} onChange={(event) => setRepoName(event.target.value)} placeholder="repository-name" className="h-10 min-w-[220px] flex-1 border-white/10 bg-black/40 text-white" />
            <Button type="submit" disabled={isBusy || !repoName.trim()} className="h-10 bg-sky-600 hover:bg-sky-500">
              <Plus className="mr-2 h-4 w-4" /> Create
            </Button>
            <Button type="button" onClick={() => setIsPrivate(!isPrivate)} variant="outline" className="h-10 border-white/10 bg-black/40 text-white">
              {isPrivate ? <Lock className="mr-2 h-4 w-4" /> : <Globe2 className="mr-2 h-4 w-4" />}
              {isPrivate ? "Private" : "Public"}
            </Button>
          </div>
          {message && <p className="mt-3 text-xs text-emerald-300">{message}</p>}
        </form>

        <div className="grid gap-3 md:grid-cols-2">
          {githubRepos.map((repo) => (
            <article key={repo.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-sky-500/40 hover:bg-sky-500/[0.04]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-sky-300">{repo.full_name}</h2>
                  <p className="mt-2 min-h-10 text-sm text-white/45">{repo.description || "No repository description."}</p>
                </div>
                <Badge variant="outline" className="shrink-0 border-white/10 text-[10px] text-white/50">{repo.private ? "Private" : "Public"}</Badge>
              </div>
              <div className="mt-5 flex gap-2">
                <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-500">
                  <a href={`/xakcode?github_repo=${encodeURIComponent(repo.full_name)}`}>Open in IDE</a>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/10 bg-transparent text-white">
                  <a href={repo.html_url} target="_blank" rel="noreferrer">GitHub <ExternalLink className="ml-2 h-3 w-3" /></a>
                </Button>
              </div>
            </article>
          ))}
        </div>
        {githubRepos.length === 0 && <p className="py-12 text-center text-sm text-white/35">No repositories found yet.</p>}
      </div>
    </main>
  );
}
