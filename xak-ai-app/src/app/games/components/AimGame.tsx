"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Target } from "lucide-react";

export function AimGame({ onExit }: { onExit: () => void }) {
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);

  const moveTarget = () => {
    setTarget({ x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 });
    setScore(s => s + 100);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-rose-500/30 bg-background/90 max-w-lg w-full relative h-[500px]">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Aim_Master</h2>
        <div className="font-black text-xl text-rose-500">{score}</div>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="flex-1 w-full bg-black/40 rounded-3xl relative overflow-hidden cursor-crosshair">
        <button 
          onClick={moveTarget}
          className="absolute w-12 h-12 bg-rose-500 rounded-full border-4 border-white/40 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse"
          style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <Target className="w-6 h-6 text-white m-auto" />
        </button>
      </div>
    </div>
  );
}
