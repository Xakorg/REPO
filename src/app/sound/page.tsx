"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Play, SkipForward, SkipBack, ListMusic, Radio, Mic2, Disc } from "lucide-react";

export default function XakSoundPage() {
  return (
    <div className="max-w-6xl mx-auto py-20 space-y-12 animate-fade-in text-center px-6">
      <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center border-2 border-indigo-500/20 mx-auto shadow-2xl mb-10">
        <Music className="w-16 h-16 text-indigo-500" />
      </div>
      <div className="space-y-4">
        <h1 className="text-7xl font-black italic uppercase tracking-tighter">XakSound</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-xs">Neural Music Hub // Under Construction</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto pt-10">
        {[
          { label: "Neural Radio", icon: Radio },
          { label: "Community Beats", icon: Disc },
          { label: "Voice Lab", icon: Mic2 },
        ].map(item => (
          <div key={item.label} className="p-10 rounded-[3rem] glass-card border-white/5 space-y-6 group hover:border-indigo-500/30 transition-all">
            <item.icon className="w-10 h-10 text-indigo-500 mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="font-black uppercase italic text-sm">{item.label}</h3>
            <Button variant="outline" className="w-full rounded-2xl border-white/10 text-[10px] font-black uppercase">Initialize</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
