"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Hand } from "lucide-react";

export function RPSGame({ onExit }: { onExit: () => void }) {
  const [res, setRes] = useState("");
  const choices = ["Rock", "Paper", "Scissors"];

  const play = (p: string) => {
    const ai = choices[Math.floor(Math.random() * 3)];
    if (p === ai) setRes(`DRAW! Both picked ${p}`);
    else if ((p === "Rock" && ai === "Scissors") || (p === "Paper" && ai === "Rock") || (p === "Scissors" && ai === "Paper")) setRes(`WIN! ${p} beats ${ai}`);
    else setRes(`LOSE! ${ai} beats ${p}`);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-rose-400/30 bg-background/90 max-w-md w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">RPS_Battle</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="grid grid-cols-3 gap-4 w-full">
        {choices.map(c => (
          <Button key={c} onClick={() => play(c)} className="h-16 font-black">{c}</Button>
        ))}
      </div>
      <h3 className="text-2xl font-black text-primary text-center italic">{res}</h3>
    </div>
  );
}
