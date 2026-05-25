"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Layers } from "lucide-react";

export function StackGame({ onExit }: { onExit: () => void }) {
  const [blocks, setBlocks] = useState([200]);
  const [offset, setOffset] = useState(0);

  const place = () => {
    setBlocks(b => [200 - Math.abs(offset), ...b]);
    setOffset(0);
  };

  useEffect(() => {
    const interval = setInterval(() => setOffset(o => (o + 5) % 100), 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-purple-500/30 bg-background/90 max-w-md w-full h-[600px]">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Stack_Tower</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="flex-1 w-full bg-black/20 rounded-3xl flex flex-col-reverse p-4 overflow-hidden">
        {blocks.map((w, i) => (
          <div key={i} className="h-10 bg-primary border-2 border-white/20 mx-auto" style={{ width: `${w}px` }} />
        ))}
      </div>
      <Button onClick={place} className="w-full h-20 bg-primary font-black text-xl">PLACE BLOCK</Button>
    </div>
  );
}
