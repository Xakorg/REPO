"use client";
import { useEffect, useRef, useState } from "react";

const TILE = 40;
const COLS = 16;
const ROWS = 12;

export default function PixelKnight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    px: 100, py: 400, vx: 0, vy: 0,
    onGround: false, score: 0, lives: 3,
    platforms: [
      { x: 0, y: 440, w: 640, h: 40 },
      { x: 150, y: 340, w: 120, h: 20 },
      { x: 350, y: 280, w: 120, h: 20 },
      { x: 200, y: 200, w: 120, h: 20 },
      { x: 450, y: 160, w: 120, h: 20 },
    ],
    coins: [
      { x: 180, y: 310, collected: false },
      { x: 380, y: 250, collected: false },
      { x: 230, y: 170, collected: false },
      { x: 480, y: 130, collected: false },
    ],
  });
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      keysRef.current[e.code] = down;
    };
    window.addEventListener("keydown", onKey(true));
    window.addEventListener("keyup", onKey(false));

    let frame: number;
    const GRAVITY = 0.5;

    const tick = () => {
      const k = keysRef.current;
      s.vx = 0;
      if (k["ArrowLeft"] || k["KeyA"]) s.vx = -4;
      if (k["ArrowRight"] || k["KeyD"]) s.vx = 4;
      if ((k["ArrowUp"] || k["Space"] || k["KeyW"]) && s.onGround) {
        s.vy = -12;
        s.onGround = false;
      }
      s.vy += GRAVITY;
      s.px += s.vx;
      s.py += s.vy;

      // Platform collision
      s.onGround = false;
      for (const p of s.platforms) {
        if (s.px + 20 > p.x && s.px - 20 < p.x + p.w && s.py + 30 > p.y && s.py + 30 < p.y + p.h + 10 && s.vy > 0) {
          s.py = p.y - 30;
          s.vy = 0;
          s.onGround = true;
        }
      }

      // Boundary
      if (s.px < 20) s.px = 20;
      if (s.px > canvas.width - 20) s.px = canvas.width - 20;
      if (s.py > canvas.height) { s.lives--; s.px = 100; s.py = 400; s.vy = 0; }

      // Coins
      for (const c of s.coins) {
        if (!c.collected && Math.abs(s.px - c.x) < 25 && Math.abs(s.py - c.y) < 25) {
          c.collected = true;
          s.score += 10;
        }
      }

      // Draw
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = "white";
      for (let i = 0; i < 30; i++) {
        ctx.fillRect((i * 53 + 10) % canvas.width, (i * 79 + 20) % (canvas.height - 60), 2, 2);
      }

      // Platforms
      for (const p of s.platforms) {
        ctx.fillStyle = "#6b21a8";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(p.x, p.y, p.w, 6);
      }

      // Coins
      for (const c of s.coins) {
        if (!c.collected) {
          ctx.fillStyle = "#fbbf24";
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Knight
      ctx.fillStyle = "#c4b5fd";
      ctx.fillRect(s.px - 20, s.py - 20, 40, 50); // body
      ctx.fillStyle = "#ede9fe";
      ctx.fillRect(s.px - 15, s.py - 40, 30, 25); // head
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(s.px - 18, s.py - 25, 6, 35); // shield

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`Score: ${s.score}  Lives: ${"♥".repeat(s.lives)}`, 10, 25);

      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("keydown", onKey(true));
      window.removeEventListener("keyup", onKey(false));
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d1a]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-purple-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-purple-400 text-sm font-mono uppercase tracking-widest">Arrow Keys / WASD to move, Space to jump</p>
    </div>
  );
}
