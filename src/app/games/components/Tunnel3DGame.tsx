"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Rocket, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Tunnel3DGame({ onExit }: { onExit: () => void }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 10) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-black animate-in zoom-in-95 duration-500 max-w-4xl w-full overflow-hidden">
      <div className="flex justify-between w-full items-center z-10 text-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/40"><Rocket className="w-6 h-6 text-white" /></div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Cyber_Tunnel</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12 text-white/40 hover:text-white"><XCircle className="w-8 h-8" /></Button>
      </div>

      <div className="relative w-full aspect-video bg-zinc-950 rounded-[3rem] border-4 border-white/10 overflow-hidden" style={{ perspective: '800px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="absolute border-4 border-rose-600/20 rounded-full"
              style={{
                width: '120%',
                height: '120%',
                transform: `translateZ(${(i * 150 - offset * 1.5) * -1}px)`,
                opacity: Math.max(0, 1 - (i / 15)),
                transition: 'none'
              }}
            />
          ))}
          <div className="w-24 h-24 rounded-full bg-rose-600 animate-pulse shadow-[0_0_100px_rgba(225,29,72,0.8)] flex items-center justify-center z-20 border-4 border-white/20">
            <Rocket className="text-white w-12 h-12 italic" />
          </div>
        </div>
        <div className="absolute inset-0 arcade-grid opacity-10" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-30">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.6em] animate-pulse">WARP SPEED ACTIVE</p>
        </div>
      </div>

      <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">3D Accelerated Instance // V-Sync Mode</p>
    </div>
  );
}