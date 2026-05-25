"use client";

import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Zap, 
  Users, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  ArrowUpRight, 
  Loader2,
  Layers,
  Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";

export default function XakAnalyticsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null; // FIX: Only query if user is authenticated to prevent permission errors
    return query(collection(firestore, "users"));
  }, [firestore, user]);

  const sitesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "indexedSites"));
  }, [firestore]);

  const { data: allUsers, isLoading: loadingUsers } = useCollection(usersQuery);
  const { data: allSites, isLoading: loadingSites } = useCollection(sitesQuery);

  const userCount = allUsers?.length || 0;
  const siteCount = allSites?.length || 0;

  return (
    <div className="max-w-[1600px] mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-xl shadow-cyan-900/20">
              <BarChart3 className="w-8 h-8 text-cyan-500" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none">Xakteir Analytics</h1>
          </div>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] ml-18 flex items-center gap-2">
            <Activity className="w-3 h-3 text-cyan-500 animate-pulse" /> Live Telemetry // System Registry Status
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-12 px-8 rounded-xl border-white/10 font-black uppercase text-[10px] tracking-widest text-white">Full Report</Button>
          <Button className="h-12 px-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Re-Sync Systems</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 glass-card rounded-[4rem] p-12 border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-transparent">
          <div className="absolute top-0 right-0 p-12 opacity-5"><TrendingUp className="w-64 h-64 -rotate-12" /></div>
          <div className="relative z-10 space-y-12">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Active Reach</p>
              {loadingUsers ? (
                <Loader2 className="animate-spin text-cyan-500 opacity-20" />
              ) : (
                <h2 className="text-8xl font-black text-white italic tracking-tighter leading-none">{userCount} <span className="text-3xl text-green-500">+100%</span></h2>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
              {[
                { label: "Active Users", val: userCount.toString(), icon: Cpu, color: "text-blue-400" },
                { label: "Cloud Data", val: siteCount.toString(), icon: Database, color: "text-purple-400" },
                { label: "Global Sync", val: "100%", icon: Globe, color: "text-cyan-400" },
              ].map(stat => (
                <div key={stat.label} className="space-y-3 group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <stat.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", stat.color)} />
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  </div>
                  <p className="text-3xl font-black text-white italic">{stat.val}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card rounded-[3.5rem] p-8 border-white/10 shadow-xl bg-card/40 backdrop-blur-3xl">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-8 italic flex items-center gap-2 text-cyan-400">
              <Layers className="w-4 h-4" /> System Traffic
            </h3>
            <div className="space-y-6">
              {[
                { label: "Registry Check", val: 85, color: "bg-blue-500" },
                { label: "Traffic", val: 62, color: "bg-purple-500" },
                { label: "AI Bridges", val: 42, color: "bg-cyan-500" },
              ].map(item => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-white">{item.val}%</span>
                  </div>
                  <Progress value={item.val} className="h-1.5 bg-white/5" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-card rounded-[3.5rem] p-8 border-green-500/20 bg-green-500/5 shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><ShieldCheck className="w-32 h-32 text-green-500 rotate-12" /></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500"><ShieldCheck className="w-4 h-4" /></div>
                <h4 className="text-xs font-black text-white uppercase italic">Integrity Verified</h4>
              </div>
              <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-widest">
                System architecture signature matches the core. No data leaks detected.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Data Load', 'Network Latency', 'User Activity', 'CPU Utilization'].map((title, i) => (
          <Card key={title} className="glass-card rounded-[2.5rem] p-8 border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
              <ArrowUpRight className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-end gap-1 h-12 mb-4">
              {[40, 70, 45, 90, 65, 80, 55, 95].map((h, j) => (
                <div key={j} className="flex-1 bg-cyan-500/20 rounded-sm group-hover:bg-cyan-500/40 transition-colors" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="text-xl font-black italic text-foreground">{70 + i * 5}%</span>
              <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase">Optimal</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}