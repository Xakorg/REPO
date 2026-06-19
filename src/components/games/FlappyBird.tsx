"use client";
import { useEffect, useRef, useState } from "react";

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const GAP = 160, PIPE_W = 60, BIRD_R = 18;

    let by = H / 2, bvy = 0;
    let pipes: { x: number; gapY: number }[] = [{ x: W, gapY: H / 2 }];
    let score = 0, started = false, dead = false;
    const GRAVITY = 0.45, FLAP = -9;

    const jump = () => {
      if (dead) { by = H/2; bvy = 0; pipes = [{ x: W, gapY: H/2 }]; score = 0; dead = false; started = true; return; }
      if (!started) started = true;
      bvy = FLAP;
    };
    canvas.addEventListener("click", jump);
    window.addEventListener("keydown", e => { if (e.code === "Space") jump(); });

    let frame: number;
    const tick = () => {
      if (started && !dead) {
        bvy += GRAVITY;
        by += bvy;

        // Pipes
        for (const p of pipes) {
          p.x -= 3;
        }
        if (pipes[pipes.length - 1].x < W - 220) {
          pipes.push({ x: W, gapY: 80 + Math.random() * (H - GAP - 160) });
        }
        pipes = pipes.filter(p => p.x > -PIPE_W - 10);

        // Score
        for (const p of pipes) {
          if (Math.abs(p.x - (80 - 3)) < 3) score++;
        }

        // Collision
        for (const p of pipes) {
          if (80 + BIRD_R > p.x && 80 - BIRD_R < p.x + PIPE_W) {
            if (by - BIRD_R < p.gapY || by + BIRD_R > p.gapY + GAP) { dead = true; }
          }
        }
        if (by + BIRD_R > H || by - BIRD_R < 0) dead = true;
      }

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#87CEEB"); grad.addColorStop(1, "#98d4e8");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = "#8BC34A";
      ctx.fillRect(0, H - 30, W, 30);
      ctx.fillStyle = "#795548";
      ctx.fillRect(0, H - 15, W, 15);

      // Pipes
      for (const p of pipes) {
        ctx.fillStyle = "#4CAF50";
        // Top
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillStyle = "#388E3C";
        ctx.fillRect(p.x - 5, p.gapY - 30, PIPE_W + 10, 30);
        // Bottom
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
        ctx.fillStyle = "#388E3C";
        ctx.fillRect(p.x - 5, p.gapY + GAP, PIPE_W + 10, 30);
      }

      // Bird
      ctx.save();
      ctx.translate(80, by);
      ctx.rotate(Math.min(Math.max(bvy / 10, -0.5), 0.5));
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.ellipse(0, 0, BIRD_R, BIRD_R - 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FF6B00";
      ctx.beginPath();
      ctx.ellipse(BIRD_R - 4, 2, 8, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(8, -5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(10, -6, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "white";
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${score}`, W / 2, 50);

      if (!started) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("Tap or Space to Flap!", W / 2, H / 2);
      }

      if (dead) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 42px sans-serif";
        ctx.fillText("DEAD!", W / 2, H / 2 - 20);
        ctx.fillStyle = "white";
        ctx.font = "22px monospace";
        ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 30);
        ctx.font = "16px monospace";
        ctx.fillText("Click to restart", W / 2, H / 2 + 65);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#87CEEB]">
      <canvas ref={canvasRef} width={640} height={480} className="border-4 border-white/30 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-pointer" />
    </div>
  );
}
