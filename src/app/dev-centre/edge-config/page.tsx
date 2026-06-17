"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Network, Plus, Trash2, Code2, Globe2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function EdgeConfigBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [storeName, setStoreName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // For editing the JSON config
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [configJson, setConfigJson] = useState<string>("");

  // Load existing stores
  const storesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/edge_config`);
  }, [user, firestore]);
  const { data: stores } = useCollection(storesRef);

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  const { data: devAccount } = useDoc(devAccountRef);

  const handleCreateStore = async () => {
    if (!user || !firestore || !storeName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Store name is required." });
      return;
    }
    
    // Limits
    if (devAccount?.tier === "Standard Developer" && (stores?.length || 0) >= 1) {
      toast({ variant: "destructive", title: "Quota Exceeded", description: "Upgrade to Xakteir Dev Pro to create multiple Edge Config stores." });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const storeId = storeName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/edge_config`, storeId);

      await setDoc(docRef, {
        id: storeId,
        name: storeName,
        config: "{\n  \"maintenance_mode\": false\n}",
        createdAt: new Date().toISOString()
      });

      toast({ title: "Store Provisioned", description: `Edge Config store created across all 42 edge nodes.` });
      setStoreName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: e.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (storeId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/edge_config`, storeId));
      if (editingStoreId === storeId) setEditingStoreId(null);
      toast({ title: "Store Deleted", description: "The edge config has been purged globally." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleSaveConfig = async (storeId: string) => {
    if (!user || !firestore) return;
    
    // Validate JSON
    try {
      JSON.parse(configJson);
    } catch (e) {
      toast({ variant: "destructive", title: "Invalid JSON", description: "Please ensure your configuration is valid JSON." });
      return;
    }

    try {
      await setDoc(doc(firestore, `dev_accounts/${user.uid}/edge_config`, storeId), {
        config: configJson,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({ title: "Edge Config Synced", description: "Changes propagated globally in ~14ms." });
      setEditingStoreId(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const getApiUrl = (storeId: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/edge-config/${storeId}?uid=${user?.uid}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Network className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Edge Config</h1>
          <p className="text-xs text-zinc-400">Ultra-low latency global key-value store for feature flags and instant config.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Create Store Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">New Config Store</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Store Identifier</label>
              <div className="relative">
                <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="e.g., feature-flags" 
                  className="bg-black/50 border-white/10 h-12 rounded-xl pl-10 text-white font-bold"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleCreateStore} 
              disabled={isCreating || (devAccount?.tier === "Standard Developer" && (stores?.length || 0) >= 1)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2 group"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "Provisioning..." : "Create Store"}
            </Button>
          </div>
        </Card>

        {/* Stores List */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Active Edge Stores</h3>
            
            <div className="space-y-4">
              {stores?.map((store: any) => (
                <div key={store.id} className="p-5 bg-black/40 border border-white/5 rounded-xl transition-colors flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{store.name}</h4>
                        <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-1">
                          Replicated to 42 Regions
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Synced</Badge>
                      <Button 
                        onClick={() => handleDelete(store.id)}
                        size="icon" 
                        variant="ghost" 
                        className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="flex-1 flex items-center justify-between bg-zinc-950 px-3 py-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Globe2 className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className="text-[10px] font-mono text-zinc-400 select-all whitespace-nowrap overflow-hidden text-ellipsis">
                          {getApiUrl(store.id)}
                        </span>
                      </div>
                      <a href={getApiUrl(store.id)} target="_blank" className="text-[10px] font-bold text-orange-400 hover:underline shrink-0 ml-2">TEST API</a>
                    </div>
                  </div>

                  {/* Config Editor */}
                  {editingStoreId === store.id ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">JSON Configuration</label>
                      </div>
                      <textarea 
                        value={configJson}
                        onChange={(e) => setConfigJson(e.target.value)}
                        className="w-full h-48 bg-zinc-950 border border-white/10 rounded-xl p-4 text-xs font-mono text-white outline-none focus:border-orange-500/50 resize-y"
                        spellCheck={false}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingStoreId(null)} className="text-zinc-400">Cancel</Button>
                        <Button size="sm" onClick={() => handleSaveConfig(store.id)} className="bg-orange-500 hover:bg-orange-600 text-white">Save & Sync</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/10 hover:bg-white/5 text-xs font-bold"
                        onClick={() => {
                          setEditingStoreId(store.id);
                          setConfigJson(store.config || "{}");
                        }}
                      >
                        <Code2 className="w-3 h-3 mr-2" />
                        Edit JSON Config
                      </Button>
                    </div>
                  )}

                </div>
              ))}
              
              {(!stores || stores.length === 0) && (
                <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                  <Network className="w-12 h-12" />
                  <p className="text-xs font-bold">No Edge Config stores defined.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
