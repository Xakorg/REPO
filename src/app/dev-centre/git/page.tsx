"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Github, Trash2, Link, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function GitIntegrationBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [repoUrl, setRepoUrl] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Load existing repos
  const reposRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/git`);
  }, [user, firestore]);
  const { data: repos } = useCollection(reposRef);

  const handleLinkRepo = async () => {
    if (!user || !firestore || !repoUrl.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Repository URL is required." });
      return;
    }
    
    setIsLinking(true);
    
    try {
      const repoNameMatch = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/i) || repoUrl.match(/gitlab\.com\/([^\/]+\/[^\/]+)/i);
      const repoName = repoNameMatch ? repoNameMatch[1].replace('.git', '') : "custom/repo";
      
      const repoId = repoName.replace(/\//g, "-").toLowerCase();
      const docRef = doc(firestore, `dev_accounts/${user.uid}/git`, repoId);

      // Simulate OAuth/Webhook handshake
      await new Promise(resolve => setTimeout(resolve, 1500));

      await setDoc(docRef, {
        id: repoId,
        name: repoName,
        url: repoUrl,
        provider: repoUrl.includes("gitlab") ? "GitLab" : "GitHub",
        status: "Linked",
        createdAt: new Date().toISOString()
      });

      toast({ title: "Repository Linked", description: `${repoName} has been securely connected.` });
      setRepoUrl("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Connection Failed", description: e.message });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (repoId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/git`, repoId));
      toast({ title: "Repository Unlinked", description: "The connection to Xakteir has been removed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Git</h1>
          <p className="text-xs text-zinc-400">Connect your source code repositories for seamless deployments.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Connect Repo Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Link Repository</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Repository URL</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..." 
                  className="bg-black/50 border-white/10 h-12 rounded-xl pl-10 text-white font-bold"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleLinkRepo} 
              disabled={isLinking}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2 group"
            >
              <Github className="w-4 h-4 mr-2" />
              {isLinking ? "Authenticating..." : "Connect"}
            </Button>
          </div>

          <div className="p-4 bg-pink-500/5 border border-pink-500/10 rounded-xl flex items-start gap-3">
            <Lock className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400">
              Xakteir requests read-only access to your source code. Webhooks will be automatically installed to listen for push events.
            </p>
          </div>
        </Card>

        {/* Repos List */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Connected Repositories</h3>
            
            <div className="space-y-4">
              {repos?.map((repo: any) => (
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
              
              {(!repos || repos.length === 0) && (
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
