"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Circle } from "lucide-react";

export function GolfGame({ onExit }: { onExit: () => void }) {
  const [ballPos, setBallPos] = useState({ x: 50, y: 80 });
  const [strokes, setStrokes] = useState(0);

  const put = () => {
    setBallPos({ x: 50, y: Math.random() * 40 + 10 });
    setStrokes(s => s + 1);
    if (ballPos.y < 20) toast({ title: "HOLE IN ONE!" });
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-emerald-500/30 bg-background/90 max-w-lg w-full relative h-[600px]">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Neural_Put</h2>
        <div className="font-black text-xl">{strokes} Strokes</div>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="flex-1 w-full bg-emerald-800 rounded-3xl relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-12 h-12 bg-black rounded-full border-4 border-white/20" />
        <div 
          className="absolute w-8 h-8 bg-white rounded-full border-4 border-black/20 shadow-lg transition-all duration-500"
          style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <Button onClick={put} className="w-full h-16 bg-primary font-black uppercase tracking-widest">Swing!</Button>
    </div>
  );
}
