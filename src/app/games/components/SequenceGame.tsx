"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function SequenceGame({ onExit }: { onExit: () => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const startNextLevel = () => {
    const next = Math.floor(Math.random() * 4);
    const newSeq = [...sequence, next];
    setSequence(newSeq);
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    setIsPlaying(true);
    for (const num of seq) {
      setActiveBtn(num);
      await new Promise(r => setTimeout(r, 600));
      setActiveBtn(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setIsPlaying(false);
    setUserSequence([]);
  };

  const handleBtnClick = (i: number) => {
    if (isPlaying || gameOver) return;
    const nextUserSeq = [...userSequence, i];
    setUserSequence(nextUserSeq);
    
    if (sequence[userSequence.length] !== i) {
      setGameOver(true);
      return;
    }

    if (nextUserSeq.length === sequence.length) {
      setTimeout(startNextLevel, 1000);
    }
  };

  useEffect(() => { startNextLevel(); }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-amber-500/30 bg-background/90 max-w-md w-full relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Neural_Seq</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full aspect-square">
        {[0, 1, 2, 3].map(i => (
          <button 
            key={i}
            onClick={() => handleBtnClick(i)}
            className={cn(
              "rounded-[2rem] border-4 border-white/10 transition-all",
              i === 0 ? "bg-red-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-green-500" : "bg-amber-500",
              activeBtn === i ? "brightness-150 scale-105" : "opacity-40"
            )}
          />
        ))}
      </div>
      <div className="font-black text-2xl">Level: {sequence.length}</div>
      {gameOver && <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[4rem] z-50">
        <Trophy className="w-16 h-16 text-amber-400 mb-4" />
        <h3 className="text-4xl font-black">GAME OVER</h3>
        <Button onClick={() => window.location.reload()} className="mt-8 bg-primary">Retry</Button>
      </div>}
    </div>
  );
}
