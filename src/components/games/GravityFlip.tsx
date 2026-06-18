"use client";
import { useEffect, useRef } from "react";

export default function GravityFlip() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let py = H / 2, vy = 0, gravDir = 1;
    let score = 0, gameOver = false, started = false;
    const PX = 80, PR = 15;
    const obstacles: { x: number; y: number; h: number; color: string }[] = [];

    const flip = () => {
      if (gameOver) { py = H / 2; vy = 0; gravDir = 1; obstacles.length = 0; score = 0; gameOver = false; started = true; return; }
      if (!started) started = true;
      gravDir *= -1;
      vy = gravDir * -3;
    };
    canvas.addEventListener("click", flip);
    window.addEventListener("keydown", e => { if (e.code === "Space") flip(); });

    let spawnTimer = 0;
    let frame: number;
    const tick = () => {
      if (started && !gameOver) {
        vy += gravDir * 0.4;
        py += vy;
        if (py < PR || py > H - PR) gameOver = true;

        // Obstacles
        spawnTimer++;
        if (spawnTimer > 80) {
          const h = 80 + Math.random() * 160;
          obstacles.push({ x: W, y: Math.random() < 0.5 ? 0 : H - h, h, color: `hsl(${score * 5}, 80%, 55%)` });
          spawnTimer = 0;
        }
        for (const o of obstacles) {
          o.x -= 4 + score / 500;
          if (PX + PR > o.x && PX - PR < o.x + 40 && py + PR > o.y && py - PR < o.y + o.h) gameOver = true;
        }
        obstacles.splice(0, obstacles.findIndex(o => o.x > -60));
        score++;
      }

      // Background gradient with pulsing based on gravity
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      if (gravDir > 0) { bg.addColorStop(0, "#1e1b4b"); bg.addColorStop(1, "#312e81"); }
      else { bg.addColorStop(0, "#4c1d95"); bg.addColorStop(1, "#1e1b4b"); }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }

      // Obstacles
      for (const o of obstacles) {
        ctx.fillStyle = o.color;
        ctx.shadowColor = o.color; ctx.shadowBlur = 15;
        ctx.fillRect(o.x, o.y, 40, o.h);
        ctx.shadowBlur = 0;
      }

      // Player
      const playerColor = gravDir > 0 ? "#818cf8" : "#f472b6";
      ctx.fillStyle = playerColor;
      ctx.shadowColor = playerColor; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(PX, py, PR, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Arrow showing gravity dir
      ctx.fillStyle = "white";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(gravDir > 0 ? "▼" : "▲", PX, py + 5);

      ctx.fillStyle = "white";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 10, 28);

      if (!started) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Click or Space to flip gravity!", W / 2, H / 2);
      }

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white";
        ctx.font = "bold 40px monospace";
        ctx.textAlign = "center";
        ctx.fillText("BOOM!", W / 2, H / 2);
        ctx.font = "22px monospace";
        ctx.fillText(`Score: ${score}  |  Click to retry`, W / 2, H / 2 + 50);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1b4b]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-indigo-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-pointer" />
      <p className="mt-4 text-indigo-400 text-sm font-mono uppercase tracking-widest">Click or Space to flip gravity</p>
    </div>
  );
}
