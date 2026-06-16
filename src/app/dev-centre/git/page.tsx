"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Plus, Trash2, GitPullRequest, Code, FolderGit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GitBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load existing repos from Firestore
  const reposRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/repositories`);
  }, [user, firestore]);
  const { data: repos } = useCollection(reposRef);

  const handleCreateRepo = async () => {
    if (!user || !firestore || !repoName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Repository name is required." });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const repoId = repoName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/repositories`, repoId);
      
      await setDoc(docRef, {
        id: repoId,
        name: repoName,
        description: description || "No description provided.",
        defaultBranch: "main",
        visibility: "Private",
        cloneUrl: `https://git.xakteir.cloud/${user.uid}/${repoId}.git`,
        createdAt: new Date().toISOString(),
        commits: 1,
        sizeKb: 14
      });

      toast({ title: "Repository Created", description: `Your private Git repository ${repoName} is ready.` });
      setRepoName("");
      setDescription("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: e.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (repoId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/repositories`, repoId));
      toast({ title: "Repository Deleted", description: "The source code and repository history has been erased." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Git</h1>
          <p className="text-xs text-zinc-400">Private source control natively integrated with Xakteir Auto-Deploy.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Create Repo Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">New Repository</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Repository Name</label>
              <Input 
                value={repoName}
                onChange={e => setRepoName(e.target.value)}
                placeholder="e.g., core-api-service" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description (Optional)</label>
              <Input 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Source code for the core backend..." 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white"
              />
            </div>
            
            <Button 
              onClick={handleCreateRepo} 
              disabled={isCreating}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "Initializing..." : "Create Repository"}
            </Button>
          </div>
        </Card>

        {/* Repositories List */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Source Repositories</h3>
          
          <div className="space-y-4">
            {repos?.map((repo: any) => (
              <div key={repo.id} className="p-5 bg-black/40 border border-white/5 rounded-xl hover:border-orange-500/30 transition-colors group flex flex-col gap-4">
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 mt-1">
                      <FolderGit2 className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-white text-base">{repo.name}</h4>
                        <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                          {repo.visibility}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{repo.description}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <GitBranch className="w-3 h-3 text-zinc-400" />
                          <span>{repo.defaultBranch}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <GitPullRequest className="w-3 h-3 text-zinc-400" />
                          <span>0 PRs</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <Code className="w-3 h-3 text-zinc-400" />
                          <span>{repo.commits} Commits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => handleDelete(repo.id)}
                      size="icon" 
                      variant="ghost" 
                      className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-white/5 pt-4 mt-1">
                  <div className="flex-1 flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-lg border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 shrink-0">git clone</span>
                    <span className="text-[10px] font-mono text-zinc-300 truncate select-all">{repo.cloneUrl}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {(!repos || repos.length === 0) && (
              <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                <FolderGit2 className="w-12 h-12" />
                <p className="text-xs font-bold">No repositories created.</p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
