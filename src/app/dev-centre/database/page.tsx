"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TerminalSquare, Plus, Trash2, Database, Table, FileJson } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DatabaseBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [collectionName, setCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load existing collections from Firestore
  const dbRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/database`);
  }, [user, firestore]);
  const { data: dbCollections } = useCollection(dbRef);

  const handleCreateCollection = async () => {
    if (!user || !firestore || !collectionName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Collection name is required." });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const colId = collectionName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/database`, colId);
      
      await setDoc(docRef, {
        id: colId,
        name: collectionName,
        documentCount: 0,
        indexes: 1,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Collection Created", description: `NoSQL collection ${collectionName} initialized.` });
      setCollectionName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: e.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (colId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/database`, colId));
      toast({ title: "Collection Dropped", description: "All documents in this collection have been erased." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <TerminalSquare className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Database Playground</h1>
          <p className="text-xs text-zinc-400">Visually manage your Xakteir Edge NoSQL datastore.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Create Collection Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">New Collection</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Collection ID</label>
              <Input 
                value={collectionName}
                onChange={e => setCollectionName(e.target.value)}
                placeholder="e.g., users, posts, configs" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold font-mono"
              />
            </div>
            
            <Button 
              onClick={handleCreateCollection} 
              disabled={isCreating}
              className="w-full bg-teal-500 hover:bg-teal-600 text-black font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "Initializing..." : "Create Collection"}
            </Button>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-2">
              <p className="text-xs font-bold text-teal-400">Sandbox Environment</p>
              <p className="text-[10px] text-teal-500/80 leading-relaxed">
                Changes made here immediately affect your live Edge Database. Ensure you have proper Security Rules configured before dropping collections.
              </p>
            </div>
          </div>
        </Card>

        {/* Collections List */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Root Collections</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-white/10">
              <Database className="w-3 h-3 text-zinc-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">us-central-db1</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {dbCollections?.map((col: any) => (
              <div key={col.id} className="p-5 bg-black/40 border border-white/5 rounded-xl hover:border-teal-500/30 transition-colors group flex flex-col gap-4">
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                      <Table className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base font-mono">{col.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                        <span className="flex items-center gap-1.5"><FileJson className="w-3 h-3 text-teal-500/70" /> {col.documentCount} Docs</span>
                        <span>•</span>
                        <span>{col.indexes} Indexes</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      size="sm"
                      className="h-8 bg-white/5 border border-white/10 hover:bg-teal-500/20 hover:text-teal-400 hover:border-teal-500/30 text-[10px] font-black uppercase tracking-widest"
                    >
                      Browse Data
                    </Button>
                    <Button 
                      onClick={() => handleDelete(col.id)}
                      size="icon" 
                      variant="ghost" 
                      className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {(!dbCollections || dbCollections.length === 0) && (
              <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                <Database className="w-12 h-12" />
                <p className="text-xs font-bold">No collections found in this database.</p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
