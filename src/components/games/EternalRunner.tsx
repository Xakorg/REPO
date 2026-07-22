"use client";

import React, { useEffect, useRef, useState } from "react";

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

export default function EternalRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAMEOVER">("START");
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    runnerY: 420,
    vy: 0,
    isJumping: false,
    isDucking: false,
    speed: 6,
    obstacles: [] as Obstacle[],
    coins: [] as Coin[],
    score: 0,
    distanceTimer: 0,
    keys: { ArrowUp: false, ArrowDown: false, Space: false },
  });

  const startGame = () => {
    stateRef.current = {
      runnerY: 420,
      vy: 0,
      isJumping: false,
      isDucking: false,
      speed: 6,
      obstacles: [],
      coins: [],
      score: 0,
      distanceTimer: 0,
      keys: { ArrowUp: false, ArrowDown: false, Space: false },
    };
    setScore(0);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "Space") {
        if (!stateRef.current.isJumping) {
          stateRef.current.vy = -14;
          stateRef.current.isJumping = true;
        }
      }
      if (e.code === "ArrowDown") {
        stateRef.current.isDucking = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") {
        stateRef.current.isDucking = false;
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

    const render = () => {
      const s = stateRef.current;
      s.distanceTimer++;

      // Speed up over time
      s.speed = 6 + Math.floor(s.distanceTimer / 300) * 0.5;

      // Gravity & Jump Physics
      s.runnerY += s.vy;
      if (s.runnerY < 420) {
        s.vy += 0.7; // Gravity
      } else {
        s.runnerY = 420;
        s.vy = 0;
        s.isJumping = false;
      }

      // Distance score
      if (s.distanceTimer % 5 === 0) {
        s.score += 1;
        setScore(s.score);
      }

      // Spawn Obstacles
      if (s.distanceTimer % Math.max(50, 100 - Math.floor(s.distanceTimer / 200) * 5) === 0) {
        const type = Math.random() > 0.5 ? "GROUND" : "AIR";
        if (type === "GROUND") {
          s.obstacles.push({ x: 800, y: 430, w: 30, h: 40, color: "#ef4444" });
        } else {
          s.obstacles.push({ x: 800, y: 350, w: 40, h: 30, color: "#f59e0b" });
        }
      }

      // Spawn Coins
      if (s.distanceTimer % 70 === 0) {
        s.coins.push({ x: 800, y: 360 + Math.random() * 60, collected: false });
      }

      // Update Obstacles
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const obs = s.obstacles[i];
        obs.x -= s.speed;

        // Player Hitbox
        const runnerH = s.isDucking ? 25 : 50;
        const runnerTop = s.isDucking ? s.runnerY + 25 : s.runnerY;

        if (
          100 + 30 > obs.x &&
          100 < obs.x + obs.w &&
          runnerTop + runnerH > obs.y &&
          runnerTop < obs.y + obs.h
        ) {
          setGameState("GAMEOVER");
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: s.score } }));
          return;
        }

        if (obs.x < -50) s.obstacles.splice(i, 1);
      }

      // Update Coins
      for (let i = s.coins.length - 1; i >= 0; i--) {
        const c = s.coins[i];
        c.x -= s.speed;

        const dist = Math.hypot(115 - c.x, s.runnerY + 25 - c.y);
        if (!c.collected && dist < 30) {
          c.collected = true;
          s.score += 200;
          setScore(s.score);
        }

        if (c.x < -20) s.coins.splice(i, 1);
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.fillStyle = "#27272a";
      ctx.fillRect(0, 470, canvas.width, 130);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(0, 470, canvas.width, 6);

      // Runner
      ctx.fillStyle = "#06b6d4";
      const runnerH = s.isDucking ? 25 : 50;
      const runnerTop = s.isDucking ? s.runnerY + 25 : s.runnerY;
      ctx.fillRect(100, runnerTop, 30, runnerH);

      // Obstacles
      s.obstacles.forEach((obs) => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      });

      // Coins
      s.coins.forEach((c) => {
        if (!c.collected) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = "#eab308";
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-emerald-400 mb-2 uppercase tracking-wider">
        Eternal Runner
      </h1>

      <div className="flex gap-8 mb-4 font-bold text-zinc-300">
        <div>Score / Distance: <span className="text-amber-400">{score}</span></div>
      </div>

      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="bg-zinc-950 block" />

        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="text-4xl font-extrabold text-emerald-400 uppercase tracking-widest">
              {gameState === "GAMEOVER" ? "Runner Crashed" : "Eternal Runner"}
            </h2>
            {gameState === "GAMEOVER" && <p className="text-2xl font-bold">Distance Score: {score}</p>}
            <p className="text-sm text-zinc-400">Use Up/Space to Jump, Down Arrow to Duck!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {gameState === "GAMEOVER" ? "Try Again" : "Start Running"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
