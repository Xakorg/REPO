"use client";

import React, { useEffect, useRef, useState } from "react";

interface Sphere {
  id: number;
  angle: number;
  dist: number;
  colorIndex: number;
  speed: number;
}

const COLORS = ["#a855f7", "#06b6d4", "#ec4899", "#eab308"];
const COLOR_NAMES = ["Purple", "Cyan", "Pink", "Yellow"];

export default function VoidSpin2() {
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
    let lives = 3;
    let ringAngle = 0; // angle offset in radians

    let spheres: Sphere[] = [];
    let sphereIdCount = 0;
    let spawnTimer = 0;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      // Rotation control
      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        ringAngle -= 0.06;
      }
      if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        ringAngle += 0.06;
      }

      // Spawn spheres
      spawnTimer++;
      if (spawnTimer % Math.max(30, 90 - Math.floor(currentScore / 20)) === 0) {
        const spawnAngle = Math.random() * Math.PI * 2;
        const colorIndex = Math.floor(Math.random() * 4);
        spheres.push({
          id: sphereIdCount++,
          angle: spawnAngle,
          dist: 340,
          colorIndex,
          speed: 2 + Math.min(3, currentScore / 50),
        });
      }

      const ringRadius = 100;

      // Update spheres
      for (let i = spheres.length - 1; i >= 0; i--) {
        const s = spheres[i];
        s.dist -= s.speed;

        // Hit ring radius
        if (s.dist <= ringRadius) {
          // Determine which quadrant of the ring s.angle hits
          // Normalize angle relative to ring rotation
          let relativeAngle = (s.angle - ringAngle) % (Math.PI * 2);
          if (relativeAngle < 0) relativeAngle += Math.PI * 2;

          const quadrant = Math.floor(relativeAngle / (Math.PI / 2)) % 4;

          if (quadrant === s.colorIndex) {
            currentScore += 10;
            setScore(currentScore);
          } else {
            lives--;
          }
          spheres.splice(i, 1);
        }
      }

      if (lives <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Draw
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Void core glowing effect
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 250);
      grad.addColorStop(0, "rgba(168, 85, 247, 0.15)");
      grad.addColorStop(1, "rgba(9, 9, 11, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Rotating Void Ring (4 quadrants)
      for (let q = 0; q < 4; q++) {
        const startA = ringAngle + q * (Math.PI / 2);
        const endA = startA + Math.PI / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, startA, endA);
        ctx.strokeStyle = COLORS[q];
        ctx.lineWidth = 14;
        ctx.stroke();
      }

      // Center Core
      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius - 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spheres
      spheres.forEach((s) => {
        const sx = cx + Math.cos(s.angle) * s.dist;
        const sy = cy + Math.sin(s.angle) * s.dist;
        ctx.fillStyle = COLORS[s.colorIndex];
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = COLORS[s.colorIndex];
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 25, 35);

      ctx.fillText(`Lives: ${"❤️".repeat(lives)}`, 25, 65);

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
          <h1 className="text-4xl font-bold text-purple-400 mb-4 tracking-wider">VOID SPIN 2</h1>
          <p className="text-zinc-400 mb-2">Rotate the central Void Ring to match incoming colored energy spheres!</p>
          <p className="text-sm text-zinc-500 mb-6">Use Left / Right Arrow Keys or A / D to spin</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START GAME
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">VOID OVERLOAD</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-purple-500/30 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
