"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, X, Trophy } from "lucide-react";

export function SnakeGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let snake = [{ x: 10, y: 10 }];
    let food = { x: 5, y: 5 };
    let dx = 1;
    let dy = 0;
    let gridSize = 20;
    let tileCount = 20;

    const draw = () => {
      if (gameOver) return;
      
      ctx.fillStyle = "#0a061a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#a855f7" : "#7e22ce";
        ctx.shadowBlur = index === 0 ? 15 : 0;
        ctx.shadowColor = "#a855f7";
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
      });

      ctx.fillStyle = "#22c55e";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#22c55e";
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
      ctx.shadowBlur = 0;

      const head = { x: snake[0].x + dx, y: snake[0].y + dy };
      
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snake.some(p => p.x === head.x && p.y === head.y)) {
        setGameOver(true);
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 100);
        food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
      } else {
        snake.pop();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -1; }
      if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 1; }
      if (e.key === "ArrowLeft" && dx === 0) { dx = -1; dy = 0; }
      if (e.key === "ArrowRight" && dx === 0) { dx = 1; dy = 0; }
    };

    window.addEventListener("keydown", handleKey);
    const gameLoop = setInterval(draw, 100);
    return () => {
      clearInterval(gameLoop);
      window.removeEventListener("keydown", handleKey);
    };
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl relative overflow-hidden bg-background/90 animate-in zoom-in-95 duration-500">
      <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
      <div className="flex justify-between w-full items-center z-10 text-foreground">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Gamepad2 className="w-6 h-6 text-white" /></div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Snake_Zone</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Score</span>
            <span className="text-2xl font-black text-primary">{score.toLocaleString()}</span>
          </div>
          <Button size="icon" variant="ghost" onClick={onExit} className="hover:bg-white/10 rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
        </div>
      </div>
      
      <div className="relative p-2 rounded-[2.5rem] bg-black border-4 border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={400} height={400} className="rounded-[2rem]" />
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-20 animate-in fade-in duration-500 rounded-[4rem]">
          <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mb-6 animate-bounce shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            <Trophy className="w-12 h-12 text-destructive" />
          </div>
          <h3 className="text-6xl font-black text-white mb-2 uppercase tracking-tighter italic leading-none">Crash!</h3>
          <p className="text-muted-foreground font-bold mb-10 uppercase tracking-widest">Score: {score}</p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90 font-black rounded-2xl h-16 px-12 text-lg shadow-xl text-white">Retry</Button>
            <Button variant="outline" onClick={onExit} className="border-white/10 rounded-2xl h-16 px-8 font-black uppercase text-xs text-white">Quit</Button>
          </div>
        </div>
      )}
    </div>
  );
}