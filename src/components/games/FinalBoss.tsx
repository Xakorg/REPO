"use client";

import React, { useEffect, useRef, useState } from "react";

export default function FinalBoss() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAMEOVER">("START");
  const [score, setScore] = useState(0);
  const [bossHp, setBossHp] = useState(1000);
  const [playerHp, setPlayerHp] = useState(100);

  const gameRef = useRef({
    player: { x: 400, y: 500, radius: 15, speed: 6 },
    boss: { x: 400, y: 100, radius: 45, maxHp: 1000, hp: 1000, vx: 3, phaseTimer: 0 },
    playerBullets: [] as { x: number; y: number; vy: number }[],
    bossBullets: [] as { x: number; y: number; vx: number; vy: number; color: string }[],
    keys: { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false },
    score: 0,
    playerHp: 100,
    lastShot: 0,
    bossPatternTimer: 0,
  });

  const startGame = () => {
    gameRef.current = {
      player: { x: 400, y: 500, radius: 15, speed: 6 },
      boss: { x: 400, y: 100, radius: 45, maxHp: 1000, hp: 1000, vx: 3, phaseTimer: 0 },
      playerBullets: [],
      bossBullets: [],
      keys: { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false },
      score: 0,
      playerHp: 100,
      lastShot: 0,
      bossPatternTimer: 0,
    };
    setScore(0);
    setBossHp(1000);
    setPlayerHp(100);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in gameRef.current.keys) {
        gameRef.current.keys[e.code as keyof typeof gameRef.current.keys] = true;
      }
      if (e.code === "Space") {
        gameRef.current.keys.Space = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in gameRef.current.keys) {
        gameRef.current.keys[e.code as keyof typeof gameRef.current.keys] = false;
      }
      if (e.code === "Space") {
        gameRef.current.keys.Space = false;
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

    const gameLoop = () => {
      const state = gameRef.current;
      const { player, boss, keys } = state;

      // Player Movement
      if (keys.ArrowLeft && player.x > player.radius) player.x -= player.speed;
      if (keys.ArrowRight && player.x < canvas.width - player.radius) player.x += player.speed;
      if (keys.ArrowUp && player.y > player.radius + 200) player.y -= player.speed;
      if (keys.ArrowDown && player.y < canvas.height - player.radius) player.y += player.speed;

      // Player Shoot
      const now = Date.now();
      if (keys.Space && now - state.lastShot > 150) {
        state.playerBullets.push({ x: player.x - 8, y: player.y - 15, vy: -10 });
        state.playerBullets.push({ x: player.x + 8, y: player.y - 15, vy: -10 });
        state.lastShot = now;
      }

      // Boss Movement
      boss.x += boss.vx;
      if (boss.x - boss.radius < 50 || boss.x + boss.radius > canvas.width - 50) {
        boss.vx *= -1;
      }

      // Boss Attack Patterns
      state.bossPatternTimer++;
      if (state.bossPatternTimer % 40 === 0) {
        // Ring attack
        const count = 12;
        for (let i = 0; i < count; i++) {
          const angle = (i * (Math.PI * 2)) / count + (state.bossPatternTimer * 0.05);
          state.bossBullets.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            color: "#ef4444",
          });
        }
      } else if (state.bossPatternTimer % 25 === 0) {
        // Direct targeted shot
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const dist = Math.hypot(dx, dy) || 1;
        state.bossBullets.push({
          x: boss.x,
          y: boss.y,
          vx: (dx / dist) * 6,
          vy: (dy / dist) * 6,
          color: "#f59e0b",
        });
      }

      // Update Player Bullets
      state.playerBullets = state.playerBullets.filter((b) => {
        b.y += b.vy;
        // Check collision with boss
        const dist = Math.hypot(b.x - boss.x, b.y - boss.y);
        if (dist < boss.radius) {
          boss.hp = Math.max(0, boss.hp - 10);
          state.score += 20;
          setBossHp(boss.hp);
          setScore(state.score);
          return false;
        }
        return b.y > 0;
      });

      // Update Boss Bullets
      state.bossBullets = state.bossBullets.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;

        // Check collision with player
        const dist = Math.hypot(b.x - player.x, b.y - player.y);
        if (dist < player.radius + 4) {
          state.playerHp = Math.max(0, state.playerHp - 10);
          setPlayerHp(state.playerHp);
          return false;
        }

        return b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height;
      });

      // Check Game Over or Win
      if (state.playerHp <= 0 || boss.hp <= 0) {
        const finalScore = state.score + (boss.hp <= 0 ? 5000 : 0);
        setScore(finalScore);
        setGameState("GAMEOVER");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: finalScore } }));
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield
      ctx.fillStyle = "#ffffff33";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97 + state.bossPatternTimer * 2) % canvas.width;
        const sy = (i * 131 + state.bossPatternTimer * 4) % canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Draw Boss
      ctx.save();
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#dc2626";
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();

      // Boss HP Bar
      ctx.fillStyle = "#374151";
      ctx.fillRect(100, 20, 600, 14);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(100, 20, (boss.hp / boss.maxHp) * 600, 14);

      // Draw Player
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - player.radius);
      ctx.lineTo(player.x - player.radius, player.y + player.radius);
      ctx.lineTo(player.x + player.radius, player.y + player.radius);
      ctx.closePath();
      ctx.fillStyle = "#3b82f6";
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();

      // Draw Player Bullets
      ctx.fillStyle = "#38bdf8";
      state.playerBullets.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y, 4, 10);
      });

      // Draw Boss Bullets
      state.bossBullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 font-bold text-lg">
        <div>Score: <span className="text-amber-400">{score}</span></div>
        <div>Player HP: <span className="text-emerald-400">{playerHp}%</span></div>
        <div>Boss HP: <span className="text-rose-400">{bossHp}</span></div>
      </div>

      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="bg-zinc-950 block" />

        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold text-rose-500 uppercase tracking-widest">
              {gameState === "GAMEOVER" ? "Battle Ended" : "Final Boss"}
            </h1>
            {gameState === "GAMEOVER" && (
              <p className="text-xl font-medium text-zinc-300">Final Score: {score}</p>
            )}
            <p className="text-sm text-zinc-400">Use Arrow Keys to move, Space to shoot!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {gameState === "GAMEOVER" ? "Try Again" : "Start Battle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
