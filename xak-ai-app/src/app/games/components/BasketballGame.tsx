"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy } from "lucide-react";

export function BasketballGame({ onExit }: { onExit: () => void }) {
  const [power, setPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [score, setScore] = useState(0);

  const handleShoot = () => {
    if (power > 60 && power < 80) {
      setScore(s => s + 3);
    }
    setPower(0);
  };

  useEffect(() => {
    if (isCharging) {
      const interval = setInterval(() => setPower(p => (p + 2) % 100), 20);
      return () => clearInterval(interval);
    }
  }, [isCharging]);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-orange-500/30 bg-background/90 max-w-md w-full relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Xak_Dunk</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="w-full h-24 bg-zinc-950 rounded-xl relative overflow-hidden border-2 border-white/10">
        <div className="h-full bg-orange-500 transition-all" style={{ width: `${power}%` }} />
        <div className="absolute left-[60%] right-[20%] inset-y-0 border-x-4 border-white/40 bg-green-500/20" />
      </div>
      <Button 
        onMouseDown={() => setIsCharging(true)}
        onMouseUp={() => { setIsCharging(false); handleShoot(); }}
        className="w-full h-24 bg-orange-600 hover:bg-orange-500 rounded-[2rem] font-black text-2xl"
      >
        HOLD & RELEASE
      </Button>
      <div className="font-black text-4xl text-orange-500">SCORE: {score}</div>
    </div>
  );
}
