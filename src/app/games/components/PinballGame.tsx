"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Circle } from "lucide-react";

export function PinballGame({ onExit }: { onExit: () => void }) {
  const [ball, setBall] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const interval = setInterval(() => {
      setBall(prev => ({
        x: prev.x + (Math.random() - 0.5) * 5,
        y: prev.y + (Math.random() - 0.5) * 5
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-rose-600/30 bg-background/90 max-w-lg w-full h-[600px] relative overflow-hidden">
      <div className="flex justify-between w-full items-center z-10">
        <h2 className="text-3xl font-black italic uppercase text-white">Xak_Ball</h2>
        <Button size="icon" variant="ghost" onClick={onExit} className="text-white"><X className="w-8 h-8" /></Button>
      </div>
      <div className="flex-1 w-full bg-zinc-950 rounded-[3rem] relative border-8 border-rose-900 shadow-inner">
        <div className="absolute inset-0 arcade-grid opacity-10" />
        <div 
          className="absolute w-8 h-8 bg-white rounded-full border-4 border-black/20 shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-75"
          style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
        />
        <div className="absolute bottom-10 left-10 w-24 h-4 bg-rose-600 rounded-full" />
        <div className="absolute bottom-10 right-10 w-24 h-4 bg-rose-600 rounded-full" />
      </div>
    </div>
  );
}
