"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, Trash2, Activity, ShieldAlert, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function CrashlyticsBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Load existing crash reports from Firestore
  const crashesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/crashes`);
  }, [user, firestore]);
  const { data: crashes } = useCollection(crashesRef);

  const handleDelete = async (crashId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/crashes`, crashId));
      toast({ title: "Issue Resolved", description: "The crash report has been archived." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Bug className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Crashlytics</h1>
          <p className="text-xs text-zinc-400">Real-time error tracking and crash reporting for your production apps.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Crashes</p>
            <p className="text-3xl font-black text-rose-400">{crashes?.length || 0}</p>
          </div>
        </Card>
        
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Crash-Free Users</p>
            <p className="text-3xl font-black text-emerald-400">100%</p>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Active Listeners</p>
            <p className="text-3xl font-black text-sky-400">Online</p>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Recent Exceptions</h3>
          <Button variant="outline" className="h-8 border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-lg">
            Export Logs
          </Button>
        </div>
        
        <div className="space-y-4">
          {crashes?.map((crash: any) => (
            <div key={crash.id} className="p-5 bg-black/40 border border-rose-500/20 rounded-xl hover:border-rose-500/50 transition-colors group flex flex-col gap-4">
              
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 mt-1">
                    <Bug className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base font-mono">{crash.errorClass || "UnhandledException"}</h4>
                    <p className="text-xs text-rose-400 font-mono mt-1">{crash.message}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                        <span>App: {crash.appId}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                        <span>{new Date(crash.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-400 text-[9px] uppercase font-black tracking-widest">
                    Open
                  </Badge>
                  <Button 
                    onClick={() => handleDelete(crash.id)}
                    size="icon" 
                    variant="ghost" 
                    className="w-8 h-8 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {crash.stackTrace && (
                <div className="flex items-center gap-4 border-t border-white/5 pt-4 mt-1">
                  <div className="flex-1 bg-[#1e1e1e] p-3 rounded-lg border border-white/5 overflow-x-auto">
                    <pre className="text-[10px] font-mono text-zinc-400">{crash.stackTrace}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {(!crashes || crashes.length === 0) && (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 text-emerald-500/80 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <ShieldAlert className="w-12 h-12" />
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-400 mb-1">System Stable</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500/60">No unhandled exceptions reported</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
