"use client";
import { useEffect, useRef, useState } from "react";

export default function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let px = W / 2, py = H - 40, pw = 100;
    let bx = W / 2, by = H - 60, vbx = 4, vby = -5;
    let started = false, score = 0, lives = 3, gameOver = false;

    const ROWS = 5, COLS = 10;
    const BROW = 20, BCOL = 60, PAD = 2;
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
    const bricks: { x: number; y: number; alive: boolean; color: string }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({ x: c * (BCOL + PAD) + 5, y: r * (BROW + PAD) + 50, alive: true, color: colors[r] });
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      px = (e.clientX - rect.left) * scaleX - pw / 2;
      px = Math.max(0, Math.min(W - pw, px));
    };
    const handleClick = () => { started = true; };
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    let frame: number;
    const tick = () => {
      if (started && !gameOver) {
        bx += vbx; by += vby;

        if (bx < 8 || bx > W - 8) vbx *= -1;
        if (by < 8) vby *= -1;
        if (by > H) { lives--; if (lives <= 0) gameOver = true; bx = W / 2; by = H - 60; vby = -5; started = false; }

        // Paddle
        if (by > py - 8 && by < py + 15 && bx > px && bx < px + pw) vby = -Math.abs(vby);

        // Bricks
        for (const b of bricks) {
          if (!b.alive) continue;
          if (bx > b.x && bx < b.x + BCOL && by > b.y && by < b.y + BROW) {
            b.alive = false;
            vby *= -1;
            score += 10;
          }
        }
      }

      ctx.fillStyle = "#0f0f1a";
      ctx.fillRect(0, 0, W, H);

      // Bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, BCOL, BROW, 3);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(b.x + 2, b.y + 2, BCOL - 4, 4);
      }

      // Paddle
      const pg = ctx.createLinearGradient(px, py, px, py + 12);
      pg.addColorStop(0, "#818cf8");
      pg.addColorStop(1, "#4f46e5");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, 12, 6);
      ctx.fill();

      // Ball
      ctx.fillStyle = "white";
      ctx.shadowColor = "white";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}   Lives: ${"♥".repeat(lives)}`, 10, 30);

      if (!started && !gameOver) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "20px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Click to Launch", W / 2, H / 2 + 30);
      }

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white";
        ctx.font = "bold 40px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2);
        ctx.font = "22px monospace";
        ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 50);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => { canvas.removeEventListener("mousemove", handleMouseMove); canvas.removeEventListener("click", handleClick); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f1a]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-indigo-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-none" />
      <p className="mt-4 text-indigo-400 text-sm font-mono uppercase tracking-widest">Move mouse to control paddle</p>
    </div>
  );
}
