"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Activity } from "lucide-react";

export function PongGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballDX = 4;
    let ballDY = 4;
    const paddleHeight = 60;
    const paddleWidth = 10;
    let playerY = (canvas.height - paddleHeight) / 2;
    let aiY = (canvas.height - paddleHeight) / 2;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerY = e.clientY - rect.top - paddleHeight / 2;
    };

    const gameLoop = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // AI Logic
      if (aiY + paddleHeight / 2 < ballY) aiY += 3;
      else aiY -= 3;

      // Ball Movement
      ballX += ballDX;
      ballY += ballDY;

      // Ball Wall Collision
      if (ballY < 0 || ballY > canvas.height) ballDY = -ballDY;

      // Paddle Collision
      if (ballX < paddleWidth && ballY > playerY && ballY < playerY + paddleHeight) ballDX = -ballDX;
      if (ballX > canvas.width - paddleWidth && ballY > aiY && ballY < aiY + paddleHeight) ballDX = -ballDX;

      // Scoring
      if (ballX < 0) { setAiScore(s => s + 1); reset(); }
      if (ballX > canvas.width) { setPlayerScore(s => s + 1); reset(); }

      function reset() {
        if (!canvas) return;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballDX = -ballDX;
      }

      // Drawing
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, playerY, paddleWidth, paddleHeight);
      ctx.fillRect(canvas.width - paddleWidth, aiY, paddleWidth, paddleHeight);
      ctx.beginPath();
      ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
      ctx.fill();
    }, 16);

    canvas.addEventListener("mousemove", handleMove);
    return () => {
      clearInterval(gameLoop);
      canvas.removeEventListener("mousemove", handleMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-blue-500/30 bg-background/90 max-w-2xl w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Cyber_Pong</h2>
        <div className="flex items-center gap-8 font-black text-2xl">
          <span className="text-primary">{playerScore}</span>
          <span>-</span>
          <span className="text-rose-500">{aiScore}</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <canvas ref={canvasRef} width={600} height={300} className="bg-black/50 rounded-2xl border-4 border-white/5" />
    </div>
  );
}
