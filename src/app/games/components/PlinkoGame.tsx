"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Zap } from "lucide-react";

export function PlinkoGame({ onExit }: { onExit: () => void }) {
  const [drops, setDrops] = useState<any[]>([]);

  const drop = () => {
    setDrops(d => [...d, { id: Date.now(), x: 50 }]);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-amber-500/30 bg-background/90 max-w-md w-full h-[600px]">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Plinko_Game</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="flex-1 w-full bg-black/40 rounded-3xl relative p-8">
        <div className="grid grid-cols-5 gap-10 justify-items-center opacity-20">
          {Array(25).fill(0).map((_, i) => <div key={i} className="w-2 h-2 bg-white rounded-full" />)}
        </div>
        {drops.map(d => (
          <div key={d.id} className="absolute top-0 w-6 h-6 bg-amber-500 rounded-full animate-bounce" style={{ left: '50%' }} />
        ))}
      </div>
      <Button onClick={drop} className="w-full h-16 bg-amber-600">DROP BALL</Button>
    </div>
  );
}
