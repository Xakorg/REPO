"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReactionGame({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState<'idle' | 'waiting' | 'ready' | 'result'>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);

  const start = () => {
    setState('waiting');
    const delay = Math.random() * 3000 + 1500;
    setTimeout(() => {
      setState('ready');
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (state === 'waiting') {
      setState('idle');
      alert("Too early! Protocol aborted.");
    } else if (state === 'ready') {
      setReactionTime(Date.now() - startTime);
      setState('result');
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-10 p-12 glass-card rounded-[4rem] border-4 transition-all duration-300 max-w-2xl w-full h-[500px] cursor-pointer relative overflow-hidden",
        state === 'waiting' ? "bg-zinc-900 border-zinc-700" : 
        state === 'ready' ? "bg-emerald-500 border-emerald-400" : 
        "bg-background/90 border-primary/30"
      )}
      onClick={state === 'idle' ? start : handleClick}
    >
      <div className="absolute top-10 right-10 z-50">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onExit(); }} className="rounded-full bg-white/5 hover:bg-white/10"><X className="w-8 h-8" /></Button>
      </div>

      {state === 'idle' && (
        <div className="text-center space-y-8 animate-in fade-in duration-500">
           <Zap className="w-24 h-24 text-primary mx-auto animate-float" />
           <h2 className="text-5xl font-black uppercase italic tracking-tighter">Reaction Test</h2>
           <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Click anywhere to start. Wait for GREEN.</p>
        </div>
      )}

      {state === 'waiting' && (
        <div className="text-center space-y-4">
           <Loader2 className="w-20 h-20 text-zinc-500 animate-spin mx-auto opacity-20" />
           <h2 className="text-6xl font-black uppercase italic tracking-tighter text-zinc-700">WAIT...</h2>
        </div>
      )}

      {state === 'ready' && (
        <h2 className="text-9xl font-black uppercase italic text-white animate-bounce drop-shadow-[0_0_80px_rgba(255,255,255,0.5)]">GO!</h2>
      )}

      {state === 'result' && (
        <div className="text-center space-y-8 animate-in zoom-in-95">
           <h2 className="text-9xl font-black italic text-primary drop-shadow-[0_0_60px_rgba(var(--primary),0.6)]">{reactionTime}ms</h2>
           <div>
              <p className="text-xl font-black uppercase italic tracking-widest text-white">Reaction Speed</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Rank: Professional Player</p>
           </div>
           <Button onClick={(e) => { e.stopPropagation(); start(); }} className="h-20 px-16 bg-white text-black font-black uppercase text-xl rounded-[2rem] shadow-2xl border-b-8 border-zinc-200 active:border-b-0 active:translate-y-1 transition-all">TRY AGAIN</Button>
        </div>
      )}
    </div>
  );
}
