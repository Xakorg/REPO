"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Plus, Trash2, HardDrive, Globe2, ShieldCheck, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useDevCentreStore } from "@/lib/dev-centre-store";

export default function StorageBlade() {
  const { toast } = useToast();
  const { activeProjectId, buckets, addBucket, deleteBucket } = useDevCentreStore();

  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("us-east (Virginia)");
  const [isCreating, setIsCreating] = useState(false);

  const projectBuckets = buckets.filter(b => b.projectId === activeProjectId);

  const handleCreateBucket = () => {
    if (!activeProjectId || !bucketName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Bucket name is required." });
      return;
    }
    
    setIsCreating(true);
    
    setTimeout(() => {
      try {
        addBucket(activeProjectId, bucketName, region);
        toast({ title: "Bucket Created", description: `Your global storage bucket ${bucketName} is ready.` });
        setBucketName("");
      } catch (e: any) {
        toast({ variant: "destructive", title: "Creation Failed", description: e.message });
      } finally {
        setIsCreating(false);
      }
    }, 1000);
  };

  const handleDelete = (bucketId: string) => {
    deleteBucket(bucketId);
    toast({ title: "Bucket Deleted", description: "Storage bucket has been destroyed." });
  };

  if (!activeProjectId) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="w-24 h-24 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center border border-white/5">
          <LayoutGrid className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-400">No Project Selected</h3>
        <p className="text-zinc-500 max-w-sm mx-auto">Select or create a project from the top left dropdown to provision Storage Buckets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <Database className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Storage</h1>
          <p className="text-xs text-zinc-400">Global object storage for media, assets, and user uploads.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Create Bucket Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Provision Bucket</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bucket Name</label>
              <Input 
                value={bucketName}
                onChange={e => setBucketName(e.target.value)}
                placeholder="e.g., prod-images-bucket" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Data Region</label>
              <select 
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-black/50 border border-white/10 h-12 rounded-xl px-3 text-white font-bold outline-none"
              >
                <option value="us-east (Virginia)">US East (Virginia)</option>
                <option value="us-west (Oregon)">US West (Oregon)</option>
                <option value="eu-central (Frankfurt)">EU Central (Frankfurt)</option>
                <option value="ap-south (Mumbai)">AP South (Mumbai)</option>
              </select>
            </div>
            
            <Button 
              onClick={handleCreateBucket} 
              disabled={isCreating}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "Provisioning..." : "Create Bucket"}
            </Button>
          </div>
        </Card>

        {/* Bucket List */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Active Buckets</h3>
          
          <div className="space-y-4">
            {projectBuckets.map((bucket) => (
              <div key={bucket.id} className="p-5 bg-black/40 border border-white/5 rounded-xl hover:border-pink-500/30 transition-colors group flex flex-col gap-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                      <HardDrive className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{bucket.name}</h4>
                      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1">
                        <Globe2 className="w-3 h-3" /> {bucket.region}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block mr-4">
                      <p className="text-xs font-bold text-white">{bucket.objectCount} objects</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{(bucket.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button 
                      onClick={() => handleDelete(bucket.id)}
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
                    <span className="text-[10px] font-mono text-zinc-400 truncate">https://{bucket.name.replace(/[^a-z0-9]/g, '-')}.storage.xakteir.cloud</span>
                  </div>
                  <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20 text-[9px] font-black uppercase">
                    Standard
                  </Badge>
                </div>
              </div>
            ))}
            
            {projectBuckets.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                <Database className="w-12 h-12" />
                <p className="text-xs font-bold">No storage buckets provisioned yet.</p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
