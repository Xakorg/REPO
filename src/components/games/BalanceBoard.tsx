"use client";
import { useEffect, useRef, useState } from "react";

export default function BalanceBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let angle = 0;
    let angularVel = 0;
    let ballX = canvas.width / 2;
    const BOARD_LEN = 200;
    let score = 0;
    let lives = 3;
    let gameOver = false;
    const keys: Record<string, boolean> = {};

    window.addEventListener("keydown", e => { keys[e.code] = true; });
    window.addEventListener("keyup", e => { keys[e.code] = false; });

    let frame: number;
    const tick = () => {
      if (!gameOver) {
        if (keys["ArrowLeft"]) angularVel -= 0.002;
        if (keys["ArrowRight"]) angularVel += 0.002;
        angularVel *= 0.98;
        angle += angularVel;
        angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, angle));

        ballX += Math.sin(angle) * 3;

        const boardCenterX = canvas.width / 2;
        const ballOnBoard = Math.abs(ballX - boardCenterX) < BOARD_LEN / 2;

        if (!ballOnBoard) {
          lives--;
          ballX = canvas.width / 2;
          angle = 0;
          angularVel = 0;
          if (lives <= 0) gameOver = true;
        } else {
          score += 0.05;
        }
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Board
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 50;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.roundRect(-BOARD_LEN / 2, -8, BOARD_LEN, 16, 8);
      ctx.fill();
      ctx.restore();

      // Ball
      const boardY = cy + Math.sin(angle) * (ballX - cx);
      ctx.fillStyle = "#f472b6";
      ctx.shadowColor = "#f472b6";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ballX, boardY - 22, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pivot
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 8);
      ctx.lineTo(cx + 10, cy + 8);
      ctx.lineTo(cx, cy + 40);
      ctx.fill();

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${Math.floor(score)}   Lives: ${"♥".repeat(lives)}`, 20, 30);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 48px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "24px monospace";
        ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 30);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f172a]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-indigo-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-indigo-400 text-sm font-mono uppercase tracking-widest">Arrow Keys to tilt the board</p>
    </div>
  );
}
