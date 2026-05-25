"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Anchor } from "lucide-react";

export function FishingGame({ onExit }: { onExit: () => void }) {
  const [status, setStatus] = useState('Wait...');
  const [score, setScore] = useState(0);

  const cast = () => {
    setStatus('Waiting for bite...');
    setTimeout(() => {
      setStatus('BITE! CLICK NOW!');
    }, Math.random() * 3000 + 1000);
  };

  const catchFish = () => {
    if (status === 'BITE! CLICK NOW!') {
      setScore(s => s + 500);
      setStatus('CAUGHT! Nice Shard.');
      setTimeout(cast, 2000);
    }
  };

  useEffect(() => { cast(); }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-blue-500/30 bg-background/90 max-w-md w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Shard_Catch</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="text-center space-y-6">
        <Anchor className="w-20 h-20 text-blue-500 mx-auto animate-bounce" />
        <h3 className="text-2xl font-black text-white">{status}</h3>
        <Button onClick={catchFish} className="w-48 h-48 rounded-full bg-blue-600 font-black text-2xl">REEL IN</Button>
      </div>
      <div className="font-black text-2xl">XP: {score}</div>
    </div>
  );
}
