"use client";

import React, { useEffect, useRef, useState } from "react";

interface Ring {
  x: number;
  y: number;
  radius: number;
}

interface Hazard {
  x: number;
  y: number;
  radius: number;
}

export default function AeroDrift2() {
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
    let fuel = 100;
    let playerX = canvas.width / 2;
    let playerSpeedX = 0;
    let scrollSpeed = 5;

    const keys: Record<string, boolean> = {};

    let rings: Ring[] = [];
    let hazards: Hazard[] = [];
    let spawnTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      // Steering & Boost
      let accel = 0.8;
      if (keys[" "] || keys["space"]) {
        scrollSpeed = 8;
        fuel -= 0.15;
      } else {
        scrollSpeed = 5;
      }

      if (keys["a"] || keys["arrowleft"]) playerSpeedX -= accel;
      if (keys["d"] || keys["arrowright"]) playerSpeedX += accel;

      playerSpeedX *= 0.88; // friction
      playerX += playerSpeedX;

      // Keep within track borders
      const trackLeft = 150;
      const trackRight = canvas.width - 150;
      if (playerX < trackLeft + 20) {
        playerX = trackLeft + 20;
        playerSpeedX = 0;
        fuel -= 0.3;
      }
      if (playerX > trackRight - 20) {
        playerX = trackRight - 20;
        playerSpeedX = 0;
        fuel -= 0.3;
      }

      fuel -= 0.05;

      // Spawning
      spawnTimer++;
      if (spawnTimer % 45 === 0) {
        const ringX = trackLeft + 40 + Math.random() * (trackRight - trackLeft - 80);
        rings.push({ x: ringX, y: -30, radius: 24 });
      }

      if (spawnTimer % 65 === 0) {
        const hazardX = trackLeft + 40 + Math.random() * (trackRight - trackLeft - 80);
        hazards.push({ x: hazardX, y: -30, radius: 22 });
      }

      // Update Rings & Hazards
      rings.forEach((r) => { r.y += scrollSpeed; });
      hazards.forEach((h) => { h.y += scrollSpeed; });

      const playerY = canvas.height - 100;

      // Ring collection
      rings.forEach((r, idx) => {
        if (Math.hypot(playerX - r.x, playerY - r.y) < r.radius + 18) {
          currentScore += 50;
          fuel = Math.min(100, fuel + 15);
          setScore(currentScore);
          rings.splice(idx, 1);
        }
      });

      // Hazard hit
      hazards.forEach((h, idx) => {
        if (Math.hypot(playerX - h.x, playerY - h.y) < h.radius + 18) {
          fuel -= 20;
          hazards.splice(idx, 1);
        }
      });

      // Cleanup offscreen
      rings = rings.filter((r) => r.y < canvas.height + 50);
      hazards = hazards.filter((h) => h.y < canvas.height + 50);

      // Score over time
      currentScore += 1;
      setScore(currentScore);

      if (fuel <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track boundaries
      ctx.fillStyle = "#18181b";
      ctx.fillRect(trackLeft, 0, trackRight - trackLeft, canvas.height);

      // Side borders glow
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(trackLeft - 6, 0, 6, canvas.height);
      ctx.fillRect(trackRight, 0, 6, canvas.height);

      // Moving track lines
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -spawnTimer * scrollSpeed;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rings (Glowing Aero Rings)
      rings.forEach((r) => {
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
      });

      // Hazards (Turbulent Vortexes)
      hazards.forEach((h) => {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      });

      // Hovercraft
      ctx.save();
      ctx.translate(playerX, playerY);
      ctx.rotate(playerSpeedX * 0.05);

      // Boost thruster
      if (keys[" "] || keys["space"]) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-8, 20, 16, 20);
      }

      ctx.fillStyle = "#c084fc";
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(18, 20);
      ctx.lineTo(-18, 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      // Fuel Bar
      ctx.fillText(`Aero Fuel`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 160, 12);
      ctx.fillStyle = fuel > 30 ? "#c084fc" : "#ef4444";
      ctx.fillRect(20, 75, (fuel / 100) * 160, 12);

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
          <h1 className="text-4xl font-bold text-fuchsia-400 mb-4 tracking-wider">AERO DRIFT 2</h1>
          <p className="text-zinc-400 mb-2">Guide the hovercraft through Aero Rings and avoid vortex hazards!</p>
          <p className="text-sm text-zinc-500 mb-6">A/D or Left/Right Arrow to steer, Spacebar to Nitro Boost</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START DRIFT
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">FUEL DEPLETED</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-fuchsia-500/30 rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
