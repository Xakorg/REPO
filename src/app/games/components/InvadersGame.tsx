"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Shield } from "lucide-react";

export function InvadersGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let playerX = canvas.width / 2;
    const aliens = Array(15).fill(null).map((_, i) => ({
      x: (i % 5) * 60 + 50,
      y: Math.floor(i / 5) * 40 + 50,
      alive: true
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(playerX - 15, canvas.height - 30, 30, 10);
      
      aliens.forEach(a => {
        if (a.alive) {
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(a.x - 10, a.y - 10, 20, 20);
          a.y += 0.2;
        }
      });
    };

    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-emerald-500/30 bg-background/90 max-w-lg w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Void_Guard</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <canvas ref={canvasRef} width={400} height={400} className="bg-black/50 rounded-2xl border-4 border-white/5" />
    </div>
  );
}
