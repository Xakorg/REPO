"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonitorSmartphone, Github, GitBranch, Link, Globe2, Trash2, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function PreviewEnvBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [isDeploying, setIsDeploying] = useState(false);

  // Load existing preview environments
  const previewsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/previews`);
  }, [user, firestore]);
  const { data: previews } = useCollection(previewsRef);

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  const { data: devAccount } = useDoc(devAccountRef);

  const handleDeploy = async () => {
    if (!user || !firestore || !repoUrl.trim() || !branch.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Repository URL and Branch are required." });
      return;
    }
    
    // Limits
    if (devAccount?.tier === "Standard Developer" && (previews?.length || 0) >= 3) {
      toast({ variant: "destructive", title: "Quota Exceeded", description: "Upgrade to Xakteir Dev Pro to run more than 3 active preview environments." });
      return;
    }
    
    setIsDeploying(true);
    
    try {
      // Basic repo parsing
      const repoNameMatch = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/i);
      const repoName = repoNameMatch ? repoNameMatch[1].replace('.git', '') : "custom-repo";
      
      const previewId = `${repoName.split('/').pop()}-${branch}`.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/previews`, previewId);

      await setDoc(docRef, {
        id: previewId,
        repo: repoName,
        branch: branch,
        status: "Building",
        url: `https://${previewId}.preview.xakteir.cloud`,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Build Started", description: `Provisioning preview environment for ${branch}.` });
      
      // Simulate build process finishing
      setTimeout(async () => {
        await setDoc(docRef, { status: "Ready" }, { merge: true });
        toast({ title: "Preview Ready", description: `Your branch preview is live!` });
      }, 4000);

      setRepoUrl("");
      setBranch("main");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deployment Failed", description: e.message });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDelete = async (previewId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/previews`, previewId));
      toast({ title: "Preview Destroyed", description: "The preview environment has been torn down." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <MonitorSmartphone className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Preview Env</h1>
          <p className="text-xs text-zinc-400">Ephemeral branch deployments for testing and PR reviews.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Create Preview Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Link Repository</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Git Repository URL</label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo" 
                  className="bg-black/50 border-white/10 h-12 rounded-xl pl-10 text-white font-bold"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Branch</label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  placeholder="e.g., feature/auth" 
                  className="bg-black/50 border-white/10 h-12 rounded-xl pl-10 text-white font-bold"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleDeploy} 
              disabled={isDeploying || (devAccount?.tier === "Standard Developer" && (previews?.length || 0) >= 3)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2 group"
            >
              <Rocket className="w-4 h-4 mr-2" />
              {isDeploying ? "Provisioning..." : "Generate Preview URL"}
            </Button>
          </div>
        </Card>

        {/* Previews List */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Active Previews</h3>
            
            <div className="space-y-4">
              {previews?.map((preview: any) => (
                <div key={preview.id} className="p-5 bg-black/40 border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors group flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <GitBranch className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{preview.repo}</h4>
                        <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-1">
                          Branch: <span className="text-purple-400">{preview.branch}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={preview.status === "Ready" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}>
                        {preview.status}
                      </Badge>
                      <Button 
                        onClick={() => handleDelete(preview.id)}
                        size="icon" 
                        variant="ghost" 
                        className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="flex-1 flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-lg border border-white/5">
                      <Globe2 className="w-3 h-3 text-purple-400 shrink-0" />
                      {preview.status === "Ready" ? (
                        <a href={`https://${preview.url}`} target="_blank" className="text-[10px] font-mono text-zinc-400 select-all hover:text-purple-400 transition-colors">{preview.url}</a>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-600">Pending allocation...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!previews || previews.length === 0) && (
                <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                  <MonitorSmartphone className="w-12 h-12" />
                  <p className="text-xs font-bold">No active preview environments.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
