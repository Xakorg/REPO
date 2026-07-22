"use client";

import React, { useEffect, useRef, useState } from "react";

export default function GalaxyBlaster() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAMEOVER">("START");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const stateRef = useRef({
    playerX: 400,
    playerY: 520,
    bullets: [] as { x: number; y: number }[],
    enemies: [] as { x: number; y: number; vy: number; radius: number }[],
    score: 0,
    lives: 3,
    lastShot: 0,
    keys: { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false },
  });

  const startGame = () => {
    stateRef.current = {
      playerX: 400,
      playerY: 520,
      bullets: [],
      enemies: [],
      score: 0,
      lives: 3,
      lastShot: 0,
      keys: { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false },
    };
    setScore(0);
    setLives(3);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in stateRef.current.keys) {
        stateRef.current.keys[e.code as keyof typeof stateRef.current.keys] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in stateRef.current.keys) {
        stateRef.current.keys[e.code as keyof typeof stateRef.current.keys] = false;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      const s = stateRef.current;
      frame++;

      // Player Movement
      if (s.keys.ArrowLeft && s.playerX > 20) s.playerX -= 6;
      if (s.keys.ArrowRight && s.playerX < canvas.width - 20) s.playerX += 6;
      if (s.keys.ArrowUp && s.playerY > 100) s.playerY -= 6;
      if (s.keys.ArrowDown && s.playerY < canvas.height - 30) s.playerY += 6;

      // Auto / Space Shoot
      const now = Date.now();
      if (s.keys.Space && now - s.lastShot > 150) {
        s.bullets.push({ x: s.playerX, y: s.playerY - 20 });
        s.lastShot = now;
      }

      // Spawn Enemies
      if (frame % 30 === 0) {
        s.enemies.push({
          x: 40 + Math.random() * (canvas.width - 80),
          y: -20,
          vy: 2 + Math.random() * 3,
          radius: 15 + Math.random() * 15,
        });
      }

      // Update Bullets
      s.bullets = s.bullets.filter((b) => {
        b.y -= 10;
        return b.y > 0;
      });

      // Update Enemies & Check Collisions
      s.enemies = s.enemies.filter((e) => {
        e.y += e.vy;

        // Check bullet hit
        for (let i = 0; i < s.bullets.length; i++) {
          const b = s.bullets[i];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.radius) {
            s.bullets.splice(i, 1);
            s.score += 50;
            setScore(s.score);
            return false;
          }
        }

        // Check player collision
        const distPlayer = Math.hypot(s.playerX - e.x, s.playerY - e.y);
        if (distPlayer < e.radius + 15) {
          s.lives--;
          setLives(s.lives);
          if (s.lives <= 0) {
            setGameState("GAMEOVER");
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: s.score } }));
          }
          return false;
        }

        return e.y < canvas.height + 30;
      });

      if (s.lives <= 0) return;

      // Draw Background Starfield
      ctx.fillStyle = "#040714";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff55";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 73) % canvas.width;
        const sy = (i * 97 + frame * 3) % canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Draw Player Ship
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(s.playerX, s.playerY - 20);
      ctx.lineTo(s.playerX - 18, s.playerY + 15);
      ctx.lineTo(s.playerX + 18, s.playerY + 15);
      ctx.closePath();
      ctx.fill();

      // Draw Bullets
      ctx.fillStyle = "#facc15";
      s.bullets.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y, 4, 12);
      });

      // Draw Enemies
      ctx.fillStyle = "#f43f5e";
      s.enemies.forEach((e) => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-cyan-400 mb-2 uppercase tracking-wider">
        Galaxy Blaster
      </h1>

      <div className="flex gap-8 mb-4 font-bold text-zinc-300">
        <div>Score: <span className="text-amber-400">{score}</span></div>
        <div>Lives: <span className="text-rose-400">{"🚀".repeat(lives)}</span></div>
      </div>

      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="bg-zinc-950 block" />

        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="text-4xl font-extrabold text-cyan-400 uppercase tracking-widest">
              {gameState === "GAMEOVER" ? "Ship Destroyed" : "Galaxy Blaster"}
            </h2>
            {gameState === "GAMEOVER" && <p className="text-2xl font-bold">Final Score: {score}</p>}
            <p className="text-sm text-zinc-400">Use Arrow Keys to move, Space to shoot!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {gameState === "GAMEOVER" ? "Try Again" : "Launch Mission"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
