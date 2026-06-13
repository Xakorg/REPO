"use client";

import { Radio, Users, Heart, Share2, Play, Circle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function XakStreamPage() {
  return (
    <div className="max-w-6xl mx-auto py-20 space-y-12 animate-fade-in text-center px-6">
      <div className="w-32 h-32 rounded-[2.5rem] bg-orange-500/10 flex items-center justify-center border-2 border-orange-500/20 mx-auto shadow-2xl mb-10">
        <Radio className="w-16 h-16 text-orange-500" />
      </div>
      <div className="space-y-4">
        <h1 className="text-7xl font-black italic uppercase tracking-tighter">XakStream</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-xs">Live Community Transmission // Syncing Broadcasters</p>
      </div>
      
      <div className="relative aspect-video max-w-5xl mx-auto rounded-[4rem] overflow-hidden border-8 border-white/5 shadow-2xl group">
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
          <Play className="w-20 h-20 text-white fill-white opacity-40 group-hover:opacity-100 transition-opacity cursor-pointer" />
          <p className="mt-6 text-[10px] font-black text-white uppercase tracking-[0.5em]">No Live Transmissions Found</p>
        </div>
        <img src="https://picsum.photos/seed/stream/1280/720" className="w-full h-full object-cover opacity-40" alt="Streaming" />
        
        <div className="absolute top-10 left-10 flex gap-4 z-20">
          <div className="bg-red-600 px-6 py-2 rounded-full flex items-center gap-3 shadow-xl">
            <Circle className="w-2 h-2 fill-white animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase">Offline</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <Button className="bg-orange-600 hover:bg-orange-500 h-16 px-12 rounded-[1.8rem] font-black uppercase tracking-widest text-xs text-white">Start Broadcasting</Button>
        <Button variant="outline" className="border-white/10 h-16 px-12 rounded-[1.8rem] font-black uppercase tracking-widest text-xs text-white">Browse Studios</Button>
      </div>
    </div>
  );
}
