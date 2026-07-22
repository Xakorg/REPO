"use client";

import React, { useEffect, useRef, useState } from "react";

interface ManaStar {
  x: number;
  y: number;
  radius: number;
}

interface Whirlpool {
  x: number;
  y: number;
  radius: number;
}

export default function MysticSurfer2() {
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
    let balance = 100;

    let surferY = canvas.height / 2;
    let surferVy = 0;
    let flipAngle = 0;
    let isFlipping = false;

    let waveOffset = 0;

    let stars: ManaStar[] = [];
    let whirlpools: Whirlpool[] = [];
    let spawnTimer = 0;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys[key] = true;

      if ((key === " " || key === "space") && !isFlipping) {
        isFlipping = true;
        flipAngle = 0;
        surferVy = -8;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      waveOffset += 0.05;

      // Surfer movement
      if (keys["w"] || keys["arrowup"]) surferVy -= 0.6;
      if (keys["s"] || keys["arrowdown"]) surferVy += 0.6;

      surferVy *= 0.92;
      surferY += surferVy;

      // Keep within bounds
      if (surferY < 60) { surferY = 60; surferVy = 0; }
      if (surferY > canvas.height - 60) { surferY = canvas.height - 60; surferVy = 0; }

      // Air Flip animation
      if (isFlipping) {
        flipAngle += 0.25;
        if (flipAngle >= Math.PI * 2) {
          flipAngle = 0;
          isFlipping = false;
          currentScore += 100;
          setScore(currentScore);
        }
      }

      // Calculate Wave height at surfer position (X = 150)
      const targetWaveY = canvas.height / 2 + Math.sin(waveOffset + 150 * 0.01) * 80;

      // Balance friction based on distance to wave curve
      const distToWave = Math.abs(surferY - targetWaveY);
      if (distToWave > 120) {
        balance -= 0.4;
      } else {
        balance = Math.min(100, balance + 0.1);
      }

      // Spawning objects
      spawnTimer++;
      if (spawnTimer % 40 === 0) {
        const sx = canvas.width + 30;
        const sy = canvas.height / 2 + Math.sin(waveOffset + sx * 0.01) * 80 + (Math.random() - 0.5) * 60;
        stars.push({ x: sx, y: sy, radius: 14 });
      }

      if (spawnTimer % 70 === 0) {
        const wx = canvas.width + 30;
        const wy = canvas.height / 2 + Math.sin(waveOffset + wx * 0.01) * 80 + (Math.random() - 0.5) * 80;
        whirlpools.push({ x: wx, y: wy, radius: 22 });
      }

      // Move items
      stars.forEach((st) => { st.x -= 6; });
      whirlpools.forEach((wp) => { wp.x -= 6; });

      const surferX = 150;

      // Star collection
      stars.forEach((st, idx) => {
        if (Math.hypot(surferX - st.x, surferY - st.y) < st.radius + 20) {
          currentScore += 40;
          balance = Math.min(100, balance + 10);
          setScore(currentScore);
          stars.splice(idx, 1);
        }
      });

      // Whirlpool hit
      whirlpools.forEach((wp, idx) => {
        if (Math.hypot(surferX - wp.x, surferY - wp.y) < wp.radius + 20) {
          balance -= 25;
          whirlpools.splice(idx, 1);
        }
      });

      // Cleanup
      stars = stars.filter((st) => st.x > -40);
      whirlpools = whirlpools.filter((wp) => wp.x > -40);

      currentScore += 1;
      setScore(currentScore);

      if (balance <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Mystic Mana Wave (Sine Curve)
      ctx.fillStyle = "rgba(168, 85, 247, 0.25)";
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 10) {
        const y = canvas.height / 2 + Math.sin(waveOffset + x * 0.01) * 80;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Wave Outline Glow
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 10) {
        const y = canvas.height / 2 + Math.sin(waveOffset + x * 0.01) * 80;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mana Stars
      stars.forEach((st) => {
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "#facc15"; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      });

      // Whirlpools
      whirlpools.forEach((wp) => {
        ctx.fillStyle = "#3b0764";
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, wp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Surfer
      ctx.save();
      ctx.translate(surferX, surferY);
      ctx.rotate(flipAngle !== 0 ? flipAngle : surferVy * 0.05);

      // Surfboard
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.ellipse(0, 12, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mystic Surfer Body
      ctx.fillStyle = "#f472b6";
      ctx.beginPath();
      ctx.arc(0, -6, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      // Balance Bar
      ctx.fillText(`Wave Balance`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 150, 12);
      ctx.fillStyle = balance > 30 ? "#c084fc" : "#ef4444";
      ctx.fillRect(20, 75, (balance / 100) * 150, 12);

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
          <h1 className="text-4xl font-bold text-fuchsia-400 mb-4 tracking-wider">MYSTIC SURFER 2</h1>
          <p className="text-zinc-400 mb-2">Surf cosmic mana waves, collect stars & pull off aerial flips!</p>
          <p className="text-sm text-zinc-500 mb-6">W / S or Up / Down Arrow to position | Spacebar for Aerial Air Flip</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            RIDE THE WAVE
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">WAVE CRASH</h2>
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
