"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sword } from "lucide-react";

export function KnifeGame({ onExit }: { onExit: () => void }) {
  const [rotation, setRotation] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setRotation(r => (r + 5) % 360), 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-slate-500/30 bg-background/90 max-w-md w-full relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Blade_Throw</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div 
        className="w-48 h-48 rounded-full border-8 border-amber-900 bg-amber-800 flex items-center justify-center relative shadow-2xl"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="w-4 h-24 bg-slate-300 absolute -top-12 rounded-full" />
      </div>
      <Button onClick={() => setScore(s => s + 10)} className="w-full h-20 bg-primary font-black text-xl">THROW BLADE</Button>
      <div className="font-black text-2xl">Blades Hit: {score/10}</div>
    </div>
  );
}
