"use client";
import { useEffect, useRef } from "react";

export default function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let px = W / 2, score = 0, lives = 3, gameOver = false;
    const keys: Record<string, boolean> = {};
    let bullets: { x: number; y: number }[] = [];
    let ebullets: { x: number; y: number }[] = [];
    let lastShot = 0;

    type Invader = { x: number; y: number; alive: boolean; type: number };
    let invaders: Invader[] = [];
    let dir = 1, invSpeed = 0.5;

    const spawn = () => {
      invaders = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 10; c++) {
          invaders.push({ x: c * 55 + 30, y: r * 45 + 40, alive: true, type: r });
        }
      }
    };
    spawn();

    window.addEventListener("keydown", e => { keys[e.code] = true; });
    window.addEventListener("keyup", e => { keys[e.code] = false; });

    let frame: number;
    const tick = (time: number) => {
      if (!gameOver) {
        if (keys["ArrowLeft"]) px -= 5;
        if (keys["ArrowRight"]) px += 5;
        px = Math.max(20, Math.min(W - 20, px));

        if ((keys["Space"] || keys["ArrowUp"]) && time - lastShot > 300) {
          bullets.push({ x: px, y: H - 55 });
          lastShot = time;
        }

        // Move invaders
        let hitEdge = false;
        for (const inv of invaders) {
          if (!inv.alive) continue;
          inv.x += dir * invSpeed;
          if (inv.x > W - 30 || inv.x < 10) hitEdge = true;
        }
        if (hitEdge) {
          dir *= -1;
          for (const inv of invaders) inv.y += 20;
          invSpeed *= 1.05;
        }

        // Enemy shoots
        if (Math.random() < 0.01) {
          const alive = invaders.filter(i => i.alive);
          if (alive.length > 0) {
            const shooter = alive[Math.floor(Math.random() * alive.length)];
            ebullets.push({ x: shooter.x, y: shooter.y });
          }
        }

        // Move bullets
        bullets = bullets.filter(b => { b.y -= 8; return b.y > 0; });
        ebullets = ebullets.filter(b => { b.y += 5; return b.y < H; });

        // Collisions
        for (const b of bullets) {
          for (const inv of invaders) {
            if (!inv.alive) continue;
            if (Math.abs(b.x - inv.x) < 22 && Math.abs(b.y - inv.y) < 15) {
              inv.alive = false;
              score += (4 - inv.type) * 10;
              b.y = -100;
            }
          }
        }

        for (const b of ebullets) {
          if (Math.abs(b.x - px) < 20 && Math.abs(b.y - (H - 55)) < 20) {
            lives--;
            b.y = H + 100;
            if (lives <= 0) gameOver = true;
          }
        }

        for (const inv of invaders) {
          if (inv.alive && inv.y > H - 60) gameOver = true;
        }

        if (invaders.every(i => !i.alive)) { spawn(); invSpeed = 0.5; }
      }

      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 60; i++) { ctx.fillRect((i * 79) % W, (i * 53) % H, 1, 1); }

      const INV_CHARS = ["👾", "👽", "🤖", "💀"];
      for (const inv of invaders) {
        if (!inv.alive) continue;
        ctx.font = "26px serif";
        ctx.textAlign = "center";
        ctx.fillText(INV_CHARS[inv.type], inv.x, inv.y + 10);
      }

      // Player ship
      ctx.fillStyle = "#818cf8";
      ctx.shadowColor = "#818cf8"; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(px, H - 70);
      ctx.lineTo(px - 22, H - 45);
      ctx.lineTo(px + 22, H - 45);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bullets
      ctx.fillStyle = "#22d3ee";
      ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 10;
      for (const b of bullets) { ctx.fillRect(b.x - 2, b.y, 4, 14); }
      ctx.fillStyle = "#ef4444";
      for (const b of ebullets) { ctx.fillRect(b.x - 2, b.y, 4, 14); }
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}  Lives: ${"♥".repeat(lives)}`, 8, 25);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 40px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2);
        ctx.fillStyle = "white";
        ctx.font = "22px monospace";
        ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 50);
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050510]">
      <canvas ref={canvasRef} width={640} height={480} className="border border-indigo-500/30 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-indigo-400 text-sm font-mono uppercase tracking-widest">← → to move, Space to shoot</p>
    </div>
  );
}
