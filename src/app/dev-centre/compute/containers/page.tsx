"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, Plus, Trash2, ShieldCheck, Container, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ContainersBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [containerName, setContainerName] = useState("");
  const [imageRef, setImageRef] = useState("docker.io/library/nginx:latest");
  const [isDeploying, setIsDeploying] = useState(false);

  // Load existing containers from Firestore
  const containersRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/containers`);
  }, [user, firestore]);
  const { data: containers } = useCollection(containersRef);

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  const { data: devAccount } = useDoc(devAccountRef);

  const handleDeploy = async () => {
    if (!user || !firestore || !containerName.trim() || !imageRef.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Container name and Image are required." });
      return;
    }
    
    // Limits
    if (devAccount?.tier === "Standard Developer" && (containers?.length || 0) >= 1) {
      toast({ variant: "destructive", title: "Quota Exceeded", description: "Upgrade to Xakteir Dev Pro to run more than 1 container." });
      return;
    }
    
    setIsDeploying(true);
    
    try {
      const containerId = containerName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/containers`, containerId);

      await setDoc(docRef, {
        id: containerId,
        name: containerName,
        image: imageRef,
        status: "Running",
        url: `https://${containerId}.run.xakteir.cloud`,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Container Deployed", description: `${containerName} is successfully running.` });
      setContainerName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deployment Failed", description: e.message });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDelete = async (containerId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/containers`, containerId));
      toast({ title: "Container Stopped", description: "Container has been destroyed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Box className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Containers</h1>
          <p className="text-xs text-zinc-400">Deploy serverless Docker containers that scale automatically.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Create Container Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Deploy Image</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Container Name</label>
              <Input 
                value={containerName}
                onChange={e => setContainerName(e.target.value)}
                placeholder="e.g., api-gateway" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Image Reference (Docker Hub / GHCR)</label>
              <Input 
                value={imageRef}
                onChange={e => setImageRef(e.target.value)}
                placeholder="e.g., redis:alpine" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            
            <Button 
              onClick={handleDeploy} 
              disabled={isDeploying || (devAccount?.tier === "Standard Developer" && (containers?.length || 0) >= 1)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2 group"
            >
              <Play className="w-4 h-4 mr-2" />
              {isDeploying ? "Deploying..." : "Deploy Container"}
            </Button>
          </div>
        </Card>

        {/* Containers List */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Running Containers</h3>
            
            <div className="space-y-4">
              {containers?.map((container: any) => (
                <div key={container.id} className="p-5 bg-black/40 border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors group flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Container className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{container.name}</h4>
                        <p className="text-[10px] font-mono tracking-widest text-zinc-500">
                          {container.image}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase hidden sm:flex">
                        {container.status}
                      </Badge>
                      <Button 
                        onClick={() => handleDelete(container.id)}
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
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <a href={container.url} target="_blank" className="text-[10px] font-mono text-zinc-400 select-all hover:text-blue-400 transition-colors">{container.url}</a>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!containers || containers.length === 0) && (
                <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                  <Box className="w-12 h-12" />
                  <p className="text-xs font-bold">No containers deployed.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
