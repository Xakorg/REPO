"use client";

import React, { useEffect, useRef, useState } from "react";

interface Gate {
  y: number;
  gapX: number;
  gapWidth: number;
  passed: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  radius: number;
}

export default function QuantumDrift() {
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
    let shield = 100;
    let speed = 7;
    let playerX = canvas.width / 2;
    let playerVx = 0;

    let gates: Gate[] = [];
    let obstacles: Obstacle[] = [];
    let frame = 0;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      frame++;

      // Drift Boost mechanic
      let accel = 0.9;
      if (keys[" "] || keys["space"]) {
        speed = 11;
        accel = 1.4;
      } else {
        speed = 7;
      }

      if (keys["a"] || keys["arrowleft"]) playerVx -= accel;
      if (keys["d"] || keys["arrowright"]) playerVx += accel;

      playerVx *= 0.86; // friction/drift damping
      playerX += playerVx;

      // Track boundaries
      const trackLeft = 140;
      const trackRight = canvas.width - 140;

      if (playerX < trackLeft + 20) {
        playerX = trackLeft + 20;
        playerVx = 0;
        shield -= 0.5;
      }
      if (playerX > trackRight - 20) {
        playerX = trackRight - 20;
        playerVx = 0;
        shield -= 0.5;
      }

      shield -= 0.02;

      // Spawn gates
      if (frame % 40 === 0) {
        const gapWidth = 120;
        const gapX = trackLeft + 30 + Math.random() * (trackRight - trackLeft - gapWidth - 60);
        gates.push({ y: -30, gapX, gapWidth, passed: false });
      }

      // Spawn obstacles
      if (frame % 55 === 0) {
        const ox = trackLeft + 30 + Math.random() * (trackRight - trackLeft - 60);
        obstacles.push({ x: ox, y: -30, radius: 18 });
      }

      // Update gates
      for (let i = gates.length - 1; i >= 0; i--) {
        const g = gates[i];
        g.y += speed;

        // Check player pass
        if (!g.passed && g.y >= canvas.height - 100) {
          g.passed = true;
          if (playerX >= g.gapX && playerX <= g.gapX + g.gapWidth) {
            currentScore += 50;
            shield = Math.min(100, shield + 10);
            setScore(currentScore);
          } else {
            shield -= 20;
          }
        }

        if (g.y > canvas.height + 40) {
          gates.splice(i, 1);
        }
      }

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.y += speed;

        const dist = Math.hypot(playerX - o.x, (canvas.height - 90) - o.y);
        if (dist < o.radius + 18) {
          shield -= 25;
          obstacles.splice(i, 1);
        } else if (o.y > canvas.height + 40) {
          obstacles.splice(i, 1);
        }
      }

      if (shield <= 0) {
        setScore(currentScore);
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        setGameState("gameover");
        return;
      }

      // Render background track
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track borders
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(trackLeft, 0, trackRight - trackLeft, canvas.height);

      // Moving track lines
      ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx.lineWidth = 4;
      const trackOffsetY = (frame * speed) % 60;
      ctx.setLineDash([20, 40]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, -60 + trackOffsetY);
      ctx.lineTo(canvas.width / 2, canvas.height + 60);
      ctx.stroke();
      ctx.setLineDash([]);

      // Boundaries glow lines
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#6366f1";
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(trackLeft, 0);
      ctx.lineTo(trackLeft, canvas.height);
      ctx.moveTo(trackRight, 0);
      ctx.lineTo(trackRight, canvas.height);
      ctx.stroke();

      // Render Gates
      gates.forEach((g) => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = g.passed ? "#10b981" : "#38bdf8";
        ctx.fillStyle = g.passed ? "#10b981" : "#38bdf8";

        // Left post to gapX
        ctx.fillRect(trackLeft, g.y - 6, g.gapX - trackLeft, 12);
        // gapX + gapWidth to trackRight
        ctx.fillRect(g.gapX + g.gapWidth, g.y - 6, trackRight - (g.gapX + g.gapWidth), 12);
      });

      // Render Obstacles
      obstacles.forEach((o) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ef4444";
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Quantum Racer Ship
      const playerY = canvas.height - 90;
      ctx.save();
      ctx.translate(playerX, playerY);
      ctx.rotate(playerVx * 0.06);

      ctx.shadowBlur = 20;
      ctx.shadowColor = "#6366f1";
      ctx.fillStyle = "#818cf8";
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(16, 20);
      ctx.lineTo(-16, 20);
      ctx.closePath();
      ctx.fill();

      // Exhaust glow
      if (keys[" "] || keys["space"]) {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(0, 24, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      ctx.fillText(`Quantum Energy`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 150, 12);
      ctx.fillStyle = shield > 30 ? "#6366f1" : "#ef4444";
      ctx.fillRect(20, 75, (shield / 100) * 150, 12);

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
          <h1 className="text-4xl font-bold text-indigo-400 mb-4 tracking-wider">QUANTUM DRIFT</h1>
          <p className="text-zinc-400 mb-2">Drift through quantum gates and avoid energy hazards!</p>
          <p className="text-sm text-zinc-500 mb-6">A/D or Arrow keys to Steer & Drift | Spacebar for Quantum Boost</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START DRIFT
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">QUANTUM OVERLOAD</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-indigo-500/30 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
