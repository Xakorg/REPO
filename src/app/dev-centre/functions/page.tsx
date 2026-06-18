"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCode2, Play, Trash2, CheckCircle2, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FunctionsBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [funcName, setFuncName] = useState("");
  const [funcCode, setFuncCode] = useState("export default async function(req, res) {\n  res.status(200).json({ message: 'Hello from Xakteir Edge!' });\n}");
  const [isDeploying, setIsDeploying] = useState(false);

  // Load existing functions from Firestore
  const functionsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/functions`);
  }, [user, firestore]);
  const { data: deployedFunctions } = useCollection(functionsRef);

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  const { data: devAccount } = useDoc(devAccountRef);

  const handleDeploy = async () => {
    if (!user || !firestore || !funcName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Function name is required." });
      return;
    }
    if (devAccount?.tier === "Standard Developer" && (deployedFunctions?.length || 0) >= 5) {
      toast({ variant: "destructive", title: "Quota Exceeded", description: "Upgrade to Xakteir Dev Pro to deploy more than 5 functions." });
      return;
    }
    
    setIsDeploying(true);
    
    try {
      const funcId = funcName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/functions`, funcId);
      
      await setDoc(docRef, {
        id: funcId,
        name: funcName,
        code: funcCode,
        runtime: "Node.js 20.x",
        status: "Active",
        url: `/api/edge/${funcId}`,
        deployedAt: new Date().toISOString()
      });

      toast({ title: "Function Deployed", description: `Your function ${funcName} is now live.` });
      setFuncName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deployment Failed", description: e.message });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDelete = async (funcId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/functions`, funcId));
      toast({ title: "Function Deleted", description: "The function has been removed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
          <FileCode2 className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Functions</h1>
          <p className="text-xs text-zinc-400">Deploy serverless TypeScript/Node.js functions instantly to the edge.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Function Editor</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Node.js 20.x</span>
            </div>
          </div>
          
          <div className="space-y-4 flex-1 flex flex-col">
            <Input 
              value={funcName}
              onChange={e => setFuncName(e.target.value)}
              placeholder="Function Name (e.g., process-webhook)" 
              className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
            />
            
            <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
              <div className="absolute top-0 left-0 right-0 h-8 bg-[#252526] border-b border-white/5 flex items-center px-4">
                <span className="text-[10px] font-mono text-zinc-400">index.ts</span>
              </div>
              <textarea 
                value={funcCode}
                onChange={e => setFuncCode(e.target.value)}
                className="w-full h-full pt-10 p-4 bg-transparent text-zinc-300 font-mono text-sm resize-none outline-none"
                spellCheck="false"
              />
            </div>
            
            <Button 
              onClick={handleDeploy} 
              disabled={isDeploying || (devAccount?.tier === "Standard Developer" && (deployedFunctions?.length || 0) >= 5)}
              className="w-full bg-sky-500 hover:bg-sky-600 text-black font-black uppercase text-xs tracking-widest h-12 rounded-xl"
            >
              {isDeploying ? (
                <Terminal className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2 fill-current" />
              )}
              {isDeploying ? "Deploying..." : "Deploy Function"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl overflow-y-auto h-[500px]">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Active Deployments</h3>
          
          <div className="space-y-4">
            {deployedFunctions?.map((func: any) => (
              <div key={func.id} className="p-4 bg-black/40 border border-white/5 rounded-xl hover:border-sky-500/30 transition-colors group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm">{func.name}</span>
                  </div>
                  <Button 
                    onClick={() => handleDelete(func.id)}
                    size="icon" 
                    variant="ghost" 
                    className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                    <span>URL</span>
                    <a href={func.url} target="_blank" className="text-sky-400 hover:underline lowercase normal-case tracking-normal">{typeof window !== "undefined" ? window.location.origin : ""}{func.url}</a>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-600">
                    <span>Runtime: {func.runtime}</span>
                    <span>{new Date(func.deployedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {(!deployedFunctions || deployedFunctions.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50 pt-20">
                <Terminal className="w-12 h-12" />
                <p className="text-xs font-bold">No functions deployed yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
