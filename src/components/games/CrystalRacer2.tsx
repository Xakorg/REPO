"use client";

import React, { useEffect, useRef, useState } from "react";

interface Shard {
  x: number;
  y: number;
  size: number;
  type: "shard" | "spike" | "ring";
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function CrystalRacer2() {
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
    let nitro = 0; // 0 to 100
    let isNitroActive = false;
    let speed = 10;

    const player = {
      x: canvas.width / 2,
      y: canvas.height - 80,
      width: 24,
      height: 44,
      vx: 0,
    };

    let items: Shard[] = [];
    let particles: Particle[] = [];

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let frame = 0;

    const createCrystalBurst = (x: number, y: number, color: string) => {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          alpha: 1,
          color,
        });
      }
    };

    const update = () => {
      frame++;

      // Nitro handling
      if ((keys[" "] || keys["w"] || keys["arrowup"]) && nitro > 0) {
        isNitroActive = true;
        speed = 22;
        nitro = Math.max(0, nitro - 0.8);
      } else {
        isNitroActive = false;
        speed = 11;
      }

      currentScore += isNitroActive ? 3 : 1;
      setScore(currentScore);

      // Steering
      if ((keys["a"] || keys["arrowleft"]) && player.x > 150) {
        player.vx = -7;
      } else if ((keys["d"] || keys["arrowright"]) && player.x < canvas.width - 150) {
        player.vx = 7;
      } else {
        player.vx *= 0.6;
      }

      player.x += player.vx;

      // Spawn Shards / Spikes / Rings
      if (frame % 15 === 0) {
        const x = 160 + Math.random() * (canvas.width - 320);
        const rand = Math.random();
        const type = rand < 0.55 ? "shard" : rand < 0.8 ? "spike" : "ring";
        items.push({
          x,
          y: -40,
          size: type === "ring" ? 22 : 16,
          type,
          collected: false,
        });
      }

      // Update Items
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += speed;

        // Player Collision
        if (!item.collected && Math.hypot(player.x - item.x, player.y - item.y) < player.width + item.size) {
          item.collected = true;
          if (item.type === "shard") {
            currentScore += 50;
            nitro = Math.min(100, nitro + 15);
            createCrystalBurst(item.x, item.y, "#06b6d4");
          } else if (item.type === "ring") {
            currentScore += 150;
            nitro = Math.min(100, nitro + 35);
            createCrystalBurst(item.x, item.y, "#eab308");
          } else if (item.type === "spike") {
            health -= 25;
            createCrystalBurst(item.x, item.y, "#ef4444");

            if (health <= 0) {
              setScore(currentScore);
              window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
              setGameState("gameover");
              return;
            }
          }
          items.splice(i, 1);
        } else if (item.y > canvas.height + 40) {
          items.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.04;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      // RENDER
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track borders (Crystal tunnel walls)
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, 0, 140, canvas.height);
      ctx.fillRect(canvas.width - 140, 0, 140, canvas.height);

      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(140, 0);
      ctx.lineTo(140, canvas.height);
      ctx.moveTo(canvas.width - 140, 0);
      ctx.lineTo(canvas.width - 140, canvas.height);
      ctx.stroke();

      // Moving speed lines
      ctx.strokeStyle = isNitroActive ? "rgba(234, 179, 8, 0.4)" : "rgba(6, 182, 212, 0.2)";
      ctx.lineWidth = 1.5;
      const lineShift = (frame * speed) % 40;
      for (let y = lineShift; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(140, y);
        ctx.lineTo(canvas.width - 140, y);
        ctx.stroke();
      }

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

      // Render Items
      items.forEach((item) => {
        ctx.save();
        if (item.type === "shard") {
          ctx.fillStyle = "#06b6d4";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#06b6d4";
          ctx.beginPath();
          ctx.moveTo(item.x, item.y - item.size);
          ctx.lineTo(item.x + item.size / 2, item.y);
          ctx.lineTo(item.x, item.y + item.size);
          ctx.lineTo(item.x - item.size / 2, item.y);
          ctx.closePath();
          ctx.fill();
        } else if (item.type === "ring") {
          ctx.strokeStyle = "#eab308";
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#eab308";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
          ctx.stroke();
        } else if (item.type === "spike") {
          ctx.fillStyle = "#ef4444";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ef4444";
          ctx.beginPath();
          ctx.moveTo(item.x, item.y - item.size * 1.2);
          ctx.lineTo(item.x + item.size, item.y + item.size);
          ctx.lineTo(item.x - item.size, item.y + item.size);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // Render Hoverbike Player
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.shadowBlur = isNitroActive ? 25 : 15;
      ctx.shadowColor = isNitroActive ? "#eab308" : "#06b6d4";
      ctx.fillStyle = isNitroActive ? "#eab308" : "#06b6d4";

      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(12, 18);
      ctx.lineTo(-12, 18);
      ctx.closePath();
      ctx.fill();

      if (isNitroActive) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-4, 18, 8, 14);
      }

      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`SCORE: ${currentScore}`, 20, 35);

      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`HOVER HULL`, 20, 70);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 80, 130, 10);
      ctx.fillStyle = health > 30 ? "#06b6d4" : "#ef4444";
      ctx.fillRect(20, 80, (health / 100) * 130, 10);

      ctx.fillText(`CRYSTAL NITRO`, 20, 110);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 120, 130, 10);
      ctx.fillStyle = "#eab308";
      ctx.fillRect(20, 120, (nitro / 100) * 130, 10);

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
          <h1 className="text-4xl font-extrabold text-cyan-400 mb-3 tracking-wider">CRYSTAL RACER 2</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Race down the crystal tunnel, collect energy shards & ignite Nitro Boost!
          </p>
          <p className="text-sm text-zinc-400 mb-6">A / D or Left / Right Arrows to Steer | Spacebar for Nitro Boost</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl shadow-lg transition"
          >
            START RACE
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">HULL DESTROYED</h2>
          <p className="text-2xl font-bold text-cyan-400 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl shadow-lg transition"
          >
            RETRY RACE
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
