"use client";

import React, { useEffect, useRef, useState } from "react";

interface Gem {
  x: number;
  y: number;
  radius: number;
}

interface Hazard {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CrystalRacer() {
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
    let speed = 6;
    let energy = 100;
    let playerX = canvas.width / 2;
    let playerVx = 0;

    let gems: Gem[] = [];
    let hazards: Hazard[] = [];
    let frame = 0;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      frame++;

      // Speed boost with spacebar
      let accel = 0.8;
      if (keys[" "] || keys["space"]) {
        speed = 10;
        energy -= 0.1;
      } else {
        speed = 6;
      }

      if (keys["a"] || keys["arrowleft"]) playerVx -= accel;
      if (keys["d"] || keys["arrowright"]) playerVx += accel;

      playerVx *= 0.85;
      playerX += playerVx;

      const trackLeft = 160;
      const trackRight = canvas.width - 160;

      if (playerX < trackLeft + 20) {
        playerX = trackLeft + 20;
        playerVx = 0;
        energy -= 0.3;
      }
      if (playerX > trackRight - 20) {
        playerX = trackRight - 20;
        playerVx = 0;
        energy -= 0.3;
      }

      energy -= 0.03;

      // Spawning Gems
      if (frame % 35 === 0) {
        const gx = trackLeft + 30 + Math.random() * (trackRight - trackLeft - 60);
        gems.push({ x: gx, y: -20, radius: 14 });
      }

      // Spawning Hazards
      if (frame % 55 === 0) {
        const hx = trackLeft + 30 + Math.random() * (trackRight - trackLeft - 100);
        hazards.push({ x: hx, y: -40, width: 45, height: 20 });
      }

      // Update Gems
      for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        g.y += speed;

        const dist = Math.hypot(playerX - g.x, (canvas.height - 90) - g.y);
        if (dist < g.radius + 18) {
          currentScore += 30;
          energy = Math.min(100, energy + 8);
          setScore(currentScore);
          gems.splice(i, 1);
        } else if (g.y > canvas.height + 30) {
          gems.splice(i, 1);
        }
      }

      // Update Hazards
      for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        h.y += speed;

        const py = canvas.height - 90;
        if (
          playerX - 18 < h.x + h.width &&
          playerX + 18 > h.x &&
          py - 18 < h.y + h.height &&
          py + 18 > h.y
        ) {
          energy -= 25;
          hazards.splice(i, 1);
        } else if (h.y > canvas.height + 40) {
          hazards.splice(i, 1);
        }
      }

      if (energy <= 0) {
        setScore(currentScore);
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        setGameState("gameover");
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track tunnel gradient
      ctx.fillStyle = "#18181b";
      ctx.fillRect(trackLeft, 0, trackRight - trackLeft, canvas.height);

      // Perspective crystal grid lines
      ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
      ctx.lineWidth = 2;
      const offsetY = (frame * speed) % 40;
      for (let y = offsetY; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(trackLeft, y);
        ctx.lineTo(trackRight, y);
        ctx.stroke();
      }

      // Crystal track borders
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#06b6d4";
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(trackLeft, 0);
      ctx.lineTo(trackLeft, canvas.height);
      ctx.moveTo(trackRight, 0);
      ctx.lineTo(trackRight, canvas.height);
      ctx.stroke();

      // Render Gems (Glowing Cyan Diamonds)
      gems.forEach((g) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#38bdf8";
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(g.x, g.y - g.radius);
        ctx.lineTo(g.x + g.radius, g.y);
        ctx.lineTo(g.x, g.y + g.radius);
        ctx.lineTo(g.x - g.radius, g.y);
        ctx.closePath();
        ctx.fill();
      });

      // Render Hazards (Pink Energy Barriers)
      hazards.forEach((h) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ec4899";
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(h.x, h.y, h.width, h.height);
      });

      // Render Crystal Racer Vehicle
      const py = canvas.height - 90;
      ctx.save();
      ctx.translate(playerX, py);
      ctx.rotate(playerVx * 0.05);

      ctx.shadowBlur = 20;
      ctx.shadowColor = "#06b6d4";
      ctx.fillStyle = "#22d3ee";

      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(16, 18);
      ctx.lineTo(0, 12);
      ctx.lineTo(-16, 18);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      ctx.fillText(`Crystal Energy`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 150, 12);
      ctx.fillStyle = energy > 30 ? "#06b6d4" : "#ef4444";
      ctx.fillRect(20, 75, (energy / 100) * 150, 12);

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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4 tracking-wider">CRYSTAL RACER</h1>
          <p className="text-zinc-400 mb-2">Steer down the crystal tunnel, collect diamonds, and avoid pink barriers!</p>
          <p className="text-sm text-zinc-500 mb-6">A/D or Left/Right Arrow to Steer | Spacebar for Crystal Boost</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START RACER
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">ENERGY DRAINED</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
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
