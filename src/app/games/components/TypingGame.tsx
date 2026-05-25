"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Code2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const WORDS = ["function", "async", "await", "import", "export", "react", "const", "return", "class", "logic", "neural", "shard"];

export function TypingGame({ onExit }: { onExit: () => void }) {
  const [target, setTarget] = useState("");
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const nextWord = () => {
    setTarget(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setInput("");
  };

  useEffect(() => {
    nextWord();
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInput = (val: string) => {
    if (val === target) {
      setScore(s => s + 100);
      nextWord();
    } else {
      setInput(val);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-sky-500/30 bg-background/90 max-w-md w-full relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Code_Type</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="text-center space-y-4">
        <p className="text-[10px] font-black uppercase opacity-60">Time: {timeLeft}s</p>
        <h3 className="text-5xl font-black text-sky-400 italic underline decoration-sky-800">{target}</h3>
        <Input 
          autoFocus 
          value={input} 
          onChange={(e) => handleInput(e.target.value)} 
          className="h-16 text-center text-2xl font-bold bg-black/40 border-4 border-white/5"
          placeholder="Type word..."
        />
      </div>
      <div className="font-black text-2xl">Words Synced: {score/100}</div>
      {timeLeft === 0 && <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[4rem] z-50">
        <h3 className="text-4xl font-black">FINISHED</h3>
        <p className="text-primary text-2xl font-black mt-4">Score: {score}</p>
        <Button onClick={() => window.location.reload()} className="mt-8 bg-primary">Try Again</Button>
      </div>}
    </div>
  );
}
