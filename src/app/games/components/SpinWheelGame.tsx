"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCcw, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpinWheelGame({ onExit }: { onExit: () => void }) {
  const [rot, setRot] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = () => {
    setIsSpinning(true);
    const newRot = rot + 1440 + Math.random() * 360;
    setRot(newRot);
    setTimeout(() => {
      setIsSpinning(false);
      toast({ title: "LUCKY!", description: "You won 50 Hub Credits!" });
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 bg-background/90 max-w-md w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Luck_Node</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="relative">
        <div 
          className="w-64 h-64 rounded-full border-8 border-white/20 bg-gradient-to-br from-primary to-accent transition-transform duration-[3s] ease-out flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.4)]"
          style={{ transform: `rotate(${rot}deg)` }}
        >
          <div className="absolute inset-0 grid grid-cols-2 divide-x-4 divide-white/10">
             <div className="h-full" /><div className="h-full" />
          </div>
          <Star className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rotate-45 border-4 border-primary z-10" />
      </div>
      <Button disabled={isSpinning} onClick={spin} className="w-full h-16 bg-primary font-black text-xl flex items-center gap-4">
        <RefreshCcw className={cn(isSpinning && "animate-spin")} /> SPIN WHEEL
      </Button>
    </div>
  );
}
