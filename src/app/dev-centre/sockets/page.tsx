"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioReceiver, Plus, Trash2, Zap, Server, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function SocketsBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [socketName, setSocketName] = useState("");
  const [maxConnections, setMaxConnections] = useState("1000");
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Load existing sockets from Firestore
  const socketsRef = user && firestore ? collection(firestore, `dev_accounts/${user.uid}/sockets`) : null;
  const { data: sockets } = useCollection(socketsRef);

  const handleCreateSocket = async () => {
    if (!user || !firestore || !socketName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Socket name is required." });
      return;
    }
    
    setIsProvisioning(true);
    
    try {
      const socketId = socketName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/sockets`, socketId);
      
      await setDoc(docRef, {
        id: socketId,
        name: socketName,
        maxConnections: parseInt(maxConnections),
        activeConnections: 0,
        status: "Online",
        wssUrl: `wss://edge.xakteir.cloud/ws/${socketId}`,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Socket Provisioned", description: `Realtime socket ${socketName} is listening for connections.` });
      setSocketName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Provisioning Failed", description: e.message });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDelete = async (socketId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/sockets`, socketId));
      toast({ title: "Socket Terminated", description: "Realtime WebSocket endpoint destroyed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <RadioReceiver className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Socket</h1>
          <p className="text-xs text-zinc-400">High-performance WebSocket servers for real-time multiplayer applications.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Provision Socket Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Deploy Socket Server</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">App Identifier</label>
              <Input 
                value={socketName}
                onChange={e => setSocketName(e.target.value)}
                placeholder="e.g., xaksports-matchmaking" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Connection Limit</label>
              <select 
                value={maxConnections}
                onChange={e => setMaxConnections(e.target.value)}
                className="w-full bg-black/50 border border-white/10 h-12 rounded-xl px-3 text-white font-bold outline-none"
              >
                <option value="100">100 CCU (Dev Tier)</option>
                <option value="1000">1,000 CCU (Pro Tier)</option>
                <option value="10000">10,000 CCU (Enterprise)</option>
              </select>
            </div>
            
            <Button 
              onClick={handleCreateSocket} 
              disabled={isProvisioning}
              className="w-full bg-violet-500 hover:bg-violet-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isProvisioning ? "Provisioning..." : "Launch Server"}
            </Button>
          </div>
        </Card>

        {/* Sockets List */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Active WebSocket Tunnels</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Cluster Online</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {sockets?.map((socket: any) => (
              <div key={socket.id} className="p-5 bg-black/40 border border-white/5 rounded-xl hover:border-violet-500/30 transition-colors group flex flex-col gap-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Server className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{socket.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                          {socket.activeConnections} / {socket.maxConnections} CCU
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => handleDelete(socket.id)}
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
                    <Zap className="w-3 h-3 text-violet-400 shrink-0" />
                    <span className="text-[10px] font-mono text-zinc-400 truncate select-all">{socket.wssUrl}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {(!sockets || sockets.length === 0) && (
              <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                <RadioReceiver className="w-12 h-12" />
                <p className="text-xs font-bold">No WebSocket tunnels active.</p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
