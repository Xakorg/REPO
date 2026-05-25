"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Type } from "lucide-react";
import { Input } from "@/components/ui/input";

export function WordGame({ onExit }: { onExit: () => void }) {
  const [word, setWord] = useState("HUB");
  const [guess, setGuess] = useState("");

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-amber-500/30 bg-background/90 max-w-md w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Word_Guess</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="text-center space-y-8">
        <div className="flex gap-4 justify-center">
          {word.split('').map((_, i) => <div key={i} className="w-12 h-12 bg-white/5 border-b-4 border-primary" />)}
        </div>
        <Input value={guess} onChange={(e) => setGuess(e.target.value.toUpperCase())} className="text-center text-2xl font-black" maxLength={word.length} />
        <Button className="w-full bg-primary" onClick={() => guess === word && toast({ title: "UNLOCKED!" })}>VERIFY</Button>
      </div>
    </div>
  );
}
