"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Webhook, Trash2, Copy, CheckCircle2, Activity, ChevronRight, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WebhooksBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [selectedHook, setSelectedHook] = useState<any | null>(null);

  const hookUrl = user ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${user.uid}` : "";

  const webhooksRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `dev_accounts/${user.uid}/webhooks`), orderBy("timestamp", "desc"), limit(50));
  }, [user, firestore]);
  const { data: webhooks } = useCollection(webhooksRef);

  const handleCopy = () => {
    if (!hookUrl) return;
    navigator.clipboard.writeText(hookUrl);
    setCopied(true);
    toast({ title: "Copied!", description: "Webhook URL copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearAll = async () => {
    if (!user || !firestore || !webhooks || webhooks.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      webhooks.forEach((w: any) => {
        batch.delete(doc(firestore, `dev_accounts/${user.uid}/webhooks`, w.id));
      });
      await batch.commit();
      setSelectedHook(null);
      toast({ title: "Cleared", description: "All webhook logs have been cleared." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Webhook className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Webhooks</h1>
          <p className="text-xs text-zinc-400">Inspect real-time HTTP POST requests hitting your unique endpoint.</p>
        </div>
      </div>

      <Card className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Your Unique Webhook URL</label>
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={hookUrl} 
                className="bg-black/50 border-white/10 font-mono text-xs text-zinc-300 h-10" 
              />
              <Button onClick={handleCopy} variant="outline" className="h-10 px-4 border-white/10 bg-black/50 hover:bg-white/5 hover:text-white">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-end justify-center shrink-0 w-32 border-l border-white/5 pl-4 h-12">
            <div className="flex items-center gap-2 text-emerald-400">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">Listening</span>
            </div>
            <p className="text-[10px] text-zinc-500">Waiting for POST</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Request Feed */}
        <Card className="w-1/3 flex flex-col bg-zinc-950/40 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Request Feed</h3>
            <Button onClick={handleClearAll} variant="ghost" size="icon" className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {webhooks?.map((hook: any) => (
              <button 
                key={hook.id} 
                onClick={() => setSelectedHook(hook)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all duration-200",
                  selectedHook?.id === hook.id 
                    ? "bg-purple-500/10 border-purple-500/30" 
                    : "bg-black/40 border-white/5 hover:border-white/10 hover:bg-black/60"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] py-0">{hook.method}</Badge>
                  <span className="text-[10px] text-zinc-500">
                    {hook.timestamp ? new Date(hook.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-300 truncate">
                  {hook.ip}
                </div>
              </button>
            ))}
            
            {(!webhooks || webhooks.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50 space-y-3 pt-12">
                <Webhook className="w-8 h-8" />
                <p className="text-xs font-bold text-center">No requests received yet.<br/>Send a POST request to your URL.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Request Details */}
        <Card className="w-2/3 flex flex-col bg-zinc-950/40 border border-white/5 rounded-2xl overflow-hidden">
          {selectedHook ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/5 shrink-0 bg-black/20">
                <div className="flex items-center gap-4 mb-4">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm px-3 py-1">
                    {selectedHook.method}
                  </Badge>
                  <div className="text-sm font-mono text-zinc-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    {selectedHook.url}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><span className="text-zinc-500">Time:</span> <span className="text-zinc-300">{new Date(selectedHook.timestamp).toLocaleString()}</span></div>
                  <div><span className="text-zinc-500">IP:</span> <span className="text-zinc-300">{selectedHook.ip}</span></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <ChevronDown className="w-4 h-4" /> Headers
                  </h3>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                    {Object.entries(selectedHook.headers || {}).map(([k, v]) => (
                      <div key={k} className="flex gap-4 mb-1 border-b border-white/5 last:border-0 pb-1 last:pb-0">
                        <span className="text-purple-400 w-1/3 shrink-0">{k}:</span>
                        <span className="break-all">{v as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <ChevronDown className="w-4 h-4" /> Body
                  </h3>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                    <pre>
                      {typeof selectedHook.body === 'object' 
                        ? JSON.stringify(selectedHook.body, null, 2) 
                        : (selectedHook.body || '(empty body)')}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 opacity-50 space-y-3">
              <ChevronRight className="w-12 h-12" />
              <p className="text-xs font-bold">Select a request from the feed to view details.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
