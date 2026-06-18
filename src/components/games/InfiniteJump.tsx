"use client";
import { useEffect, useRef } from "react";

export default function InfiniteJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let px = W / 2, py = H - 100;
    let vx = 0, vy = -10;
    let score = 0, gameOver = false;
    const keys: Record<string, boolean> = {};

    type Platform = { x: number; y: number; w: number; bouncy?: boolean };
    let platforms: Platform[] = [{ x: W / 2 - 50, y: H - 60, w: 100 }];

    // Generate initial platforms
    for (let i = 0; i < 15; i++) {
      platforms.push({ x: Math.random() * (W - 80), y: H - 100 - i * 60, w: 60 + Math.random() * 40, bouncy: Math.random() < 0.2 });
    }

    let cameraY = 0;
    window.addEventListener("keydown", e => { keys[e.code] = true; });
    window.addEventListener("keyup", e => { keys[e.code] = false; });

    let frame: number;
    const tick = () => {
      if (!gameOver) {
        if (keys["ArrowLeft"] || keys["KeyA"]) vx -= 0.5;
        if (keys["ArrowRight"] || keys["KeyD"]) vx += 0.5;
        vx *= 0.9;
        vy += 0.5;
        px += vx;
        py += vy;

        // Wrap horizontally
        if (px < 0) px = W;
        if (px > W) px = 0;

        // Platform collision (only when falling)
        if (vy > 0) {
          for (const p of platforms) {
            const worldY = p.y + cameraY;
            if (px + 15 > p.x && px - 15 < p.x + p.w && py + 20 > worldY && py + 20 < worldY + 20) {
              vy = p.bouncy ? -18 : -12;
            }
          }
        }

        // Camera
        if (py + cameraY < H / 2) {
          const diff = H / 2 - (py + cameraY);
          cameraY += diff;
          score += Math.floor(diff / 5);
        }

        // Spawn new platforms
        const topMost = Math.min(...platforms.map(p => p.y + cameraY));
        if (topMost > 0) {
          platforms.push({ x: Math.random() * (W - 80), y: topMost / 1 - cameraY - 60, w: 60 + Math.random() * 40, bouncy: Math.random() < 0.2 });
        }

        // Remove off-screen platforms
        platforms = platforms.filter(p => p.y + cameraY < H + 50);

        if (py + cameraY > H + 50) gameOver = true;
      }

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0c0a1e"); bg.addColorStop(1, "#1a103c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = "white";
      for (let i = 0; i < 40; i++) {
        ctx.fillRect((i * 79 + cameraY * 0.1) % W, (i * 53 + cameraY * 0.1) % H, 1, 1);
      }

      // Platforms
      for (const p of platforms) {
        const worldY = p.y + cameraY;
        if (worldY < -30 || worldY > H + 30) continue;
        ctx.fillStyle = p.bouncy ? "#f59e0b" : "#6366f1";
        ctx.shadowColor = p.bouncy ? "#f59e0b" : "#6366f1";
        ctx.shadowBlur = p.bouncy ? 15 : 5;
        ctx.beginPath();
        ctx.roundRect(p.x, worldY, p.w, 14, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Player
      ctx.fillStyle = "#a5f3fc";
      ctx.shadowColor = "#a5f3fc"; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(px, py + cameraY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0e7490";
      ctx.beginPath();
      ctx.arc(px - 5, py + cameraY - 5, 4, 0, Math.PI * 2);
      ctx.arc(px + 5, py + cameraY - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Height: ${score}m`, 10, 30);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white";
        ctx.font = "bold 38px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Fell!", W / 2, H / 2);
        ctx.font = "22px monospace";
        ctx.fillText(`Height: ${score}m`, W / 2, H / 2 + 50);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0a1e]">
      <canvas ref={canvasRef} width={640} height={480} className="border border-indigo-500/30 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-cyan-400 text-sm font-mono uppercase tracking-widest">← → to move, auto-jump on platforms!</p>
    </div>
  );
}
