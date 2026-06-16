"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Plus, Trash2, Webhook, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WebhooksBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [endpointUrl, setEndpointUrl] = useState("");
  const [eventTopic, setEventTopic] = useState("user.signup");
  const [isRegistering, setIsRegistering] = useState(false);

  // Load existing webhooks from Firestore
  const webhooksRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/webhooks`);
  }, [user, firestore]);
  const { data: webhooks } = useCollection(webhooksRef);

  const handleCreateWebhook = async () => {
    if (!user || !firestore || !endpointUrl.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Endpoint URL is required." });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      const webhookId = "wh_" + Math.random().toString(36).substring(2, 10);
      const docRef = doc(firestore, `dev_accounts/${user.uid}/webhooks`, webhookId);
      
      await setDoc(docRef, {
        id: webhookId,
        url: endpointUrl,
        topic: eventTopic,
        status: "Active",
        createdAt: new Date().toISOString(),
        deliveries: 0,
        lastFired: null
      });

      toast({ title: "Webhook Registered", description: `We will POST to ${endpointUrl} on ${eventTopic}.` });
      setEndpointUrl("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: e.message });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/webhooks`, webhookId));
      toast({ title: "Webhook Deleted", description: "Event subscription cancelled." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Event Webhooks</h1>
          <p className="text-xs text-zinc-400">Subscribe to real-time events across the Xakteir ecosystem via HTTP POST.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Register Webhook Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Add Endpoint</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payload URL</label>
              <Input 
                value={endpointUrl}
                onChange={e => setEndpointUrl(e.target.value)}
                placeholder="https://your-api.com/webhooks" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Trigger Event Topic</label>
              <select 
                value={eventTopic}
                onChange={e => setEventTopic(e.target.value)}
                className="w-full bg-black/50 border border-white/10 h-12 rounded-xl px-3 text-white font-bold outline-none"
              >
                <option value="user.signup">user.signup (OAuth Login)</option>
                <option value="captcha.solved">captcha.solved</option>
                <option value="captcha.failed">captcha.failed</option>
                <option value="payment.success">payment.success</option>
                <option value="app.deployed">app.deployed</option>
              </select>
            </div>
            
            <Button 
              onClick={handleCreateWebhook} 
              disabled={isRegistering}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isRegistering ? "Registering..." : "Add Webhook"}
            </Button>
          </div>
        </Card>

        {/* Webhooks List */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Active Subscriptions</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <Activity className="w-3 h-3 text-yellow-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">Dispatcher Online</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {webhooks?.map((wh: any) => (
              <div key={wh.id} className="p-5 bg-black/40 border border-white/5 rounded-xl hover:border-yellow-500/30 transition-colors group flex flex-col gap-4">
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0 mt-1">
                      <Webhook className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-black tracking-widest text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                          {wh.topic}
                        </span>
                        <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500">
                          ID: {wh.id}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <span>{wh.deliveries} Deliveries</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <span>Last Fired: {wh.lastFired ? new Date(wh.lastFired).toLocaleTimeString() : "Never"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => handleDelete(wh.id)}
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 shrink-0">POST</span>
                    <span className="text-[10px] font-mono text-zinc-300 truncate select-all">{wh.url}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {(!webhooks || webhooks.length === 0) && (
              <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                <Zap className="w-12 h-12" />
                <p className="text-xs font-bold">No webhooks registered.</p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
