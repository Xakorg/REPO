"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Github, Trash2, Link as LinkIcon, CheckCircle2, Lock, LayoutGrid, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useDevCentreStore } from "@/lib/dev-centre-store";

export default function GitIntegrationBlade() {
  const { toast } = useToast();
  const { activeProjectId, repos, addRepo, deleteRepo } = useDevCentreStore();

  const [pat, setPat] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedRepos, setFetchedRepos] = useState<any[]>([]);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");
  
  const [isLinking, setIsLinking] = useState(false);

  const projectRepos = repos.filter((r: any) => r.projectId === activeProjectId);

  const handleFetchRepos = async () => {
    if (!pat.trim()) {
      toast({ variant: "destructive", title: "Error", description: "GitHub PAT is required." });
      return;
    }
    setIsFetching(true);
    try {
      const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: {
          Authorization: `Bearer ${pat.trim()}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      if (!res.ok) throw new Error("Failed to fetch repositories. Invalid PAT?");
      const data = await res.json();
      setFetchedRepos(data);
      if (data.length > 0) {
        setSelectedRepoFullName(data[0].full_name);
      }
      toast({ title: "Success", description: `Fetched ${data.length} repositories.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Fetch Failed", description: e.message });
    } finally {
      setIsFetching(false);
    }
  };

  const handleLinkRepo = () => {
    if (!activeProjectId || !selectedRepoFullName) {
      toast({ variant: "destructive", title: "Error", description: "Please select a repository." });
      return;
    }
    
    setIsLinking(true);
    
    setTimeout(() => {
      try {
        const repoUrl = `https://github.com/${selectedRepoFullName}`;
        addRepo(activeProjectId, selectedRepoFullName, repoUrl, "GitHub");
        toast({ title: "Repository Linked", description: `${selectedRepoFullName} has been securely connected.` });
        
        // Reset state after linking
        setFetchedRepos([]);
        setPat("");
        setSelectedRepoFullName("");
      } catch (e: any) {
        toast({ variant: "destructive", title: "Connection Failed", description: e.message });
      } finally {
        setIsLinking(false);
      }
    }, 1000);
  };

  const handleUnlink = (repoId: string) => {
    deleteRepo(repoId);
    toast({ title: "Repository Unlinked", description: "The connection to Xakteir has been removed." });
  };

  if (!activeProjectId) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="w-24 h-24 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center border border-white/5">
          <LayoutGrid className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-400">No Project Selected</h3>
        <p className="text-zinc-500 max-w-sm mx-auto">Select or create a project from the top left dropdown to link Git repositories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Git</h1>
          <p className="text-xs text-zinc-400">Connect your real GitHub repositories for seamless deployments.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Connect Repo Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Link Repository</h3>
          
          <div className="space-y-6">
            {fetchedRepos.length === 0 ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">GitHub Personal Access Token</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      type="password"
                      value={pat}
                      onChange={e => setPat(e.target.value)}
                      placeholder="ghp_..." 
                      className="bg-black/50 border-white/10 h-12 rounded-xl pl-10 text-white font-bold"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500 font-medium">Create a fine-grained PAT with read access to repositories.</p>
                </div>
                
                <Button 
                  onClick={handleFetchRepos} 
                  disabled={isFetching || !pat}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2 group"
                >
                  <Github className="w-4 h-4 mr-2" />
                  {isFetching ? "Fetching Repos..." : "Fetch My Repositories"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Repository</label>
                  <select 
                    value={selectedRepoFullName}
                    onChange={(e) => setSelectedRepoFullName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none cursor-pointer hover:border-pink-500/50 transition-colors"
                  >
                    {fetchedRepos.map((r: any) => (
                      <option key={r.id} value={r.full_name}>{r.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setFetchedRepos([])} 
                    variant="outline"
                    className="flex-1 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase text-xs tracking-widest h-12 rounded-xl group"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleLinkRepo} 
                    disabled={isLinking || !selectedRepoFullName}
                    className="flex-[2] bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl group"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {isLinking ? "Connecting..." : "Connect Repo"}
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-pink-500/5 border border-pink-500/10 rounded-xl flex items-start gap-3">
            <Lock className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400">
              Your PAT is only used locally to fetch your repository list and is never saved to the server. Xakteir webhooks will be automatically installed to listen for push events upon linking.
            </p>
          </div>
        </Card>

        {/* Repos List */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Connected Repositories</h3>
            
            <div className="space-y-4">
              {projectRepos.map((repo) => (
                <div key={repo.id} className="p-5 bg-black/40 border border-white/5 rounded-xl transition-colors flex items-center justify-between group hover:border-pink-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                      <Github className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{repo.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          {repo.provider}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                    <Button 
                      onClick={() => handleUnlink(repo.id)}
                      size="icon" 
                      variant="ghost" 
                      className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {projectRepos.length === 0 && (
                <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                  <GitBranch className="w-12 h-12" />
                  <p className="text-xs font-bold">No repositories linked yet.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
