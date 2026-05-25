"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function GravityGame({ onExit }: { onExit: () => void }) {
  const [isUp, setIsUp] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setScore(s => s + 1), 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      onClick={() => setIsUp(!isUp)}
      className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-purple-500/30 bg-background/90 max-w-lg w-full h-[500px] cursor-pointer overflow-hidden relative"
    >
      <div className="absolute top-10 right-10 z-50">
        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onExit(); }}><X className="w-8 h-8" /></Button>
      </div>
      <h2 className="text-3xl font-black italic uppercase z-50">G-Switch</h2>
      <div className="flex-1 w-full relative">
        <div className="absolute left-0 right-0 top-0 h-4 bg-white/10" />
        <div className="absolute left-0 right-0 bottom-0 h-4 bg-white/10" />
        <div 
          className={cn(
            "absolute left-20 w-10 h-10 bg-primary rounded-xl border-4 border-white/20 transition-all duration-300",
            isUp ? "top-4" : "bottom-4"
          )}
        >
          <ArrowUp className={cn("w-6 h-6 text-white m-auto transition-transform", isUp ? "" : "rotate-180")} />
        </div>
      </div>
      <div className="font-black text-2xl z-50">Distance: {score}m</div>
    </div>
  );
}
