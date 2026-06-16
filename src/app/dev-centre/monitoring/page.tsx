"use client";

import { useUser } from "@/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ArrowUpRight, BarChart3, Clock, Globe2, ServerCrash, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MonitoringBlade() {
  const { user } = useUser();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Cloud Monitoring</h1>
            <p className="text-xs text-zinc-400">Global telemetry, request analytics, and edge performance metrics.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <Button variant="outline" className="border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-zinc-500">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Requests</span>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white tracking-tight">1.2M</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center mb-1"><ArrowUpRight className="w-3 h-3" /> 12%</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Avg Latency</span>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white tracking-tight">42<span className="text-xl">ms</span></span>
              <span className="text-xs font-bold text-emerald-400 flex items-center mb-1"><ArrowUpRight className="w-3 h-3" /> 5%</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-zinc-500">
            <ServerCrash className="w-4 h-4 text-rose-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Error Rate (5xx)</span>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white tracking-tight">0.02%</span>
              <span className="text-xs font-bold text-zinc-500 mb-1">-</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-zinc-500">
            <Globe2 className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Bandwidth</span>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white tracking-tight">14.8<span className="text-xl">GB</span></span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Placeholder for Main Chart */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl lg:col-span-2 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Request Traffic</h3>
            <Badge className="bg-blue-500/10 border-blue-500/20 text-blue-400 text-[9px] uppercase font-black tracking-widest">Live</Badge>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-4">
            <BarChart3 className="w-16 h-16 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Telemetry Stream Connecting...</p>
          </div>
        </Card>

        {/* Breakdown Panel */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Top Endpoints</h3>
          
          <div className="space-y-4">
            {[
              { path: "/api/auth/verify", count: "482k", latency: "38ms" },
              { path: "/ws/matchmaking", count: "310k", latency: "12ms" },
              { path: "/storage/fetch", count: "250k", latency: "85ms" },
              { path: "/api/users/profile", count: "158k", latency: "45ms" },
            ].map((route, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="truncate pr-4">
                  <p className="text-xs font-mono font-bold text-white truncate">{route.path}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black uppercase text-zinc-400">{route.count} req</p>
                  <p className="text-[10px] text-emerald-500 font-bold">{route.latency}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5">
            <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
              View Full Logs
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
