"use client";

import React, { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function LunarSurfer2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);

  const startGame = () => {
    setScore(0);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let health = 100;
    let speedX = 6;
    let airTime = 0;
    let rotation = 0; // radiants

    const surfer = {
      x: 180,
      y: 300,
      radius: 16,
      vy: 0,
      gravity: 0.35, // low gravity lunar environment
      grounded: false,
    };

    let particles: Particle[] = [];

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let frame = 0;

    // Lunar terrain height function
    const getTerrainY = (x: number) => {
      return (
        380 +
        Math.sin((x + frame * speedX) * 0.008) * 60 +
        Math.sin((x + frame * speedX) * 0.02) * 35
      );
    };

    const createLunarDust = (x: number, y: number) => {
      for (let i = 0; i < 8; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3,
          alpha: 0.8,
          color: "#cbd5e1",
        });
      }
    };

    const update = () => {
      frame++;
      currentScore += Math.floor(speedX / 2);
      setScore(currentScore);

      const currentTerrainY = getTerrainY(surfer.x);

      // Low-gravity Jump / Dive / Balance controls
      if ((keys["w"] || keys["arrowup"] || keys[" "]) && surfer.grounded) {
        surfer.vy = -13;
        surfer.grounded = false;
        createLunarDust(surfer.x, surfer.y);
      }

      if (keys["s"] || keys["arrowdown"]) {
        surfer.vy += 0.6; // dive down to land on slope
      }

      if (!surfer.grounded) {
        airTime++;
        if (keys["a"] || keys["arrowleft"]) rotation -= 0.12;
        if (keys["d"] || keys["arrowright"]) rotation += 0.12;
      } else {
        if (airTime > 30) {
          // Landed after big air trick!
          const rotationNormalized = Math.abs(rotation % (Math.PI * 2));
          if (rotationNormalized < 0.8 || rotationNormalized > Math.PI * 2 - 0.8) {
            // Perfect landing!
            currentScore += Math.floor(airTime * 5);
            speedX = Math.min(14, speedX + 1);
            createLunarDust(surfer.x, surfer.y);
          } else {
            // Bad landing crash!
            health -= 25;
            speedX = 5;
            if (health <= 0) {
              setScore(currentScore);
              window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
              setGameState("gameover");
              return;
            }
          }
        }
        airTime = 0;
        rotation *= 0.7; // re-align board when grounded
      }

      // Physics
      surfer.vy += surfer.gravity;
      surfer.y += surfer.vy;

      // Ground Collision
      if (surfer.y >= currentTerrainY - surfer.radius) {
        surfer.y = currentTerrainY - surfer.radius;
        surfer.vy = 0;
        surfer.grounded = true;
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      // RENDER
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Earth & Stars Background
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(canvas.width - 120, 100, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 191) % canvas.width;
        const sy = (i * 97) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw Undulating Lunar Terrain
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 10) {
        const ty = getTerrainY(x);
        ctx.lineTo(x, ty);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Terrain outline
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, getTerrainY(0));
      for (let x = 10; x <= canvas.width; x += 10) {
        ctx.lineTo(x, getTerrainY(x));
      }
      ctx.stroke();

      // Render Particles
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Surfer & Board
      ctx.save();
      ctx.translate(surfer.x, surfer.y);
      ctx.rotate(rotation);

      // Surfboard
      ctx.fillStyle = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#38bdf8";
      ctx.fillRect(-22, 10, 44, 6);

      // Surfer Body
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, -10, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`SCORE: ${currentScore}`, 20, 35);
      ctx.fillText(`AIRTIME: ${airTime > 0 ? airTime + "f" : "Grounded"}`, 20, 65);

      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`SUIT INTEGRITY`, 20, 95);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 105, 140, 10);
      ctx.fillStyle = health > 30 ? "#38bdf8" : "#ef4444";
      ctx.fillRect(20, 105, (health / 100) * 140, 10);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h1 className="text-4xl font-extrabold text-slate-200 mb-3 tracking-wider">LUNAR SURFER 2</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Surf undulating crater slopes in low lunar gravity & pull off air flips!
          </p>
          <p className="text-sm text-zinc-400 mb-6">Up/Space (Jump) | Left/Right (Flip in Air) | Down (Fast Dive)</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 font-bold rounded-xl shadow-lg transition"
          >
            SURF THE MOON
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">SUIT BREACHED</h2>
          <p className="text-2xl font-bold text-slate-200 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 font-bold rounded-xl shadow-lg transition"
          >
            RETRY SURF
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-slate-500/30 rounded-xl shadow-[0_0_30px_rgba(203,213,225,0.15)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
