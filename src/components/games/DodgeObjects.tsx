"use client";
import { useEffect, useRef } from "react";

export default function DodgeObjects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let px = W / 2, py = H - 60;
    let score = 0;
    let lives = 3;
    let gameOver = false;
    const objects: { x: number; y: number; w: number; h: number; speed: number; color: string }[] = [];
    const keys: Record<string, boolean> = {};

    const spawn = () => {
      objects.push({
        x: 30 + Math.random() * (W - 60),
        y: -30,
        w: 20 + Math.random() * 40,
        h: 20 + Math.random() * 40,
        speed: 2 + Math.random() * 4 + score / 500,
        color: `hsl(${Math.random() * 360},80%,60%)`,
      });
    };

    window.addEventListener("keydown", e => { keys[e.code] = true; });
    window.addEventListener("keyup", e => { keys[e.code] = false; });

    let spawnTimer = 0;
    let frame: number;
    const tick = () => {
      if (!gameOver) {
        if (keys["ArrowLeft"] || keys["KeyA"]) px -= 5;
        if (keys["ArrowRight"] || keys["KeyD"]) px += 5;
        px = Math.max(20, Math.min(W - 20, px));

        score++;
        spawnTimer++;
        if (spawnTimer > 60) { spawn(); spawnTimer = 0; }

        for (let i = objects.length - 1; i >= 0; i--) {
          objects[i].y += objects[i].speed;
          const o = objects[i];
          // Collision
          if (px + 15 > o.x - o.w/2 && px - 15 < o.x + o.w/2 && py + 15 > o.y - o.h/2 && py - 15 < o.y + o.h/2) {
            objects.splice(i, 1);
            lives--;
            if (lives <= 0) gameOver = true;
          } else if (o.y > H + 50) {
            objects.splice(i, 1);
          }
        }
      }

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Lane guides
      ctx.strokeStyle = "#1a1a2a";
      for (let x = 0; x < W; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Objects
      for (const o of objects) {
        ctx.fillStyle = o.color;
        ctx.shadowColor = o.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(o.x - o.w/2, o.y - o.h/2, o.w, o.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Player
      ctx.fillStyle = "#818cf8";
      ctx.shadowColor = "#818cf8";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(px, py - 20);
      ctx.lineTo(px - 15, py + 15);
      ctx.lineTo(px + 15, py + 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}   Lives: ${"♥".repeat(lives)}`, 10, 25);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white";
        ctx.font = "bold 42px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W/2, H/2);
        ctx.font = "24px monospace";
        ctx.fillText(`Score: ${score}`, W/2, H/2 + 50);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <canvas ref={canvasRef} width={640} height={480} className="border border-white/10 rounded-xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-zinc-400 text-sm font-mono uppercase tracking-widest">Arrow Keys to dodge!</p>
    </div>
  );
}
