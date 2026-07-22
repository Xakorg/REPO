"use client";

import React, { useEffect, useRef, useState } from "react";

interface Obstacle {
  x: number; // -1 (left), 0 (center), 1 (right)
  z: number; // distance
  type: "pylon" | "orb" | "boost";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function QuantumDrift2() {
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
    let speed = 12;

    let playerX = 0; // -1 to 1 range
    let targetX = 0;
    let driftAngle = 0;

    let obstacles: Obstacle[] = [];
    let particles: Particle[] = [];

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let frame = 0;

    const createSparkles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
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
      currentScore += Math.floor(speed / 4);
      setScore(currentScore);

      // Steering
      if (keys["a"] || keys["arrowleft"]) {
        targetX = Math.max(-1.2, targetX - 0.08);
        driftAngle = -0.3;
      } else if (keys["d"] || keys["arrowright"]) {
        targetX = Math.min(1.2, targetX + 0.08);
        driftAngle = 0.3;
      } else {
        driftAngle *= 0.8;
      }

      playerX += (targetX - playerX) * 0.2;

      // Spawn Obstacles / Powerups
      if (frame % 20 === 0) {
        const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const rand = Math.random();
        const type = rand < 0.6 ? "pylon" : rand < 0.85 ? "orb" : "boost";
        obstacles.push({ x: lane, z: 800, type });
      }

      // Update Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.z -= speed;

        // Collision Check near player (z close to 0)
        if (obs.z < 50 && obs.z > -20) {
          const laneWidth = 0.8;
          if (Math.abs(playerX - obs.x) < laneWidth / 2) {
            if (obs.type === "pylon") {
              health -= 25;
              speed = Math.max(8, speed - 4);
              createSparkles(canvas.width / 2 + playerX * 180, canvas.height - 80, "#ef4444");
              obstacles.splice(i, 1);

              if (health <= 0) {
                setScore(currentScore);
                window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
                setGameState("gameover");
                return;
              }
            } else if (obs.type === "orb") {
              currentScore += 150;
              speed = Math.min(24, speed + 1);
              createSparkles(canvas.width / 2 + playerX * 180, canvas.height - 80, "#38bdf8");
              obstacles.splice(i, 1);
            } else if (obs.type === "boost") {
              currentScore += 300;
              speed = Math.min(28, speed + 3);
              createSparkles(canvas.width / 2 + playerX * 180, canvas.height - 80, "#eab308");
              obstacles.splice(i, 1);
            }
          }
        }

        if (obs.z < -100) {
          obstacles.splice(i, 1);
        }
      }

      // Particles update
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

      const horizonY = canvas.height * 0.4;
      const centerX = canvas.width / 2;

      // Draw Pseudo 3D Track Grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
      ctx.lineWidth = 2;

      // Perspective Track Lanes (-1.5 to 1.5)
      [-1.5, -0.5, 0.5, 1.5].forEach((laneX) => {
        ctx.beginPath();
        ctx.moveTo(centerX + laneX * 20, horizonY);
        ctx.lineTo(centerX + laneX * 220, canvas.height);
        ctx.stroke();
      });

      // Moving Horizontal Speed Lines
      const lineOffset = (frame * speed) % 50;
      for (let z = 10; z < 800; z += 50) {
        const adjustedZ = z - lineOffset;
        if (adjustedZ <= 0) continue;
        const scale = 1 - adjustedZ / 800;
        const y = horizonY + scale * (canvas.height - horizonY);
        const width = scale * 440;

        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * scale})`;
        ctx.beginPath();
        ctx.moveTo(centerX - width / 2, y);
        ctx.lineTo(centerX + width / 2, y);
        ctx.stroke();
      }

      // Draw Obstacles in 3D
      // Sort obstacles by Z (furthest first)
      const sortedObstacles = [...obstacles].sort((a, b) => b.z - a.z);

      sortedObstacles.forEach((obs) => {
        const scale = Math.max(0.05, 1 - obs.z / 800);
        const y = horizonY + scale * (canvas.height - horizonY);
        const x = centerX + obs.x * (scale * 200);
        const size = scale * 50;

        ctx.save();
        ctx.translate(x, y);

        if (obs.type === "pylon") {
          ctx.fillStyle = "#ef4444";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#ef4444";
          ctx.fillRect(-size / 2, -size * 1.5, size, size * 1.5);
        } else if (obs.type === "orb") {
          ctx.fillStyle = "#38bdf8";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#38bdf8";
          ctx.beginPath();
          ctx.arc(0, -size / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === "boost") {
          ctx.fillStyle = "#eab308";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#eab308";
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size / 2, 0);
          ctx.lineTo(-size / 2, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

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

      // Draw Player Car
      const carScreenX = centerX + playerX * 180;
      const carScreenY = canvas.height - 70;

      ctx.save();
      ctx.translate(carScreenX, carScreenY);
      ctx.rotate(driftAngle);

      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00f0ff";
      ctx.fillStyle = "#00f0ff";

      // Futurisic Speedster Body
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(24, 20);
      ctx.lineTo(16, 30);
      ctx.lineTo(-16, 30);
      ctx.lineTo(-24, 20);
      ctx.closePath();
      ctx.fill();

      // Thruster trail glow
      ctx.fillStyle = "#eab308";
      ctx.fillRect(-8, 30, 16, 12);

      ctx.restore();

      // HUD Overlay
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`SCORE: ${currentScore}`, 20, 35);
      ctx.fillText(`SPEED: ${Math.floor(speed * 10)} KM/H`, 20, 65);

      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`QUANTUM SHIELD`, 20, 95);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 105, 150, 10);
      ctx.fillStyle = health > 30 ? "#38bdf8" : "#ef4444";
      ctx.fillRect(20, 105, (health / 100) * 150, 10);

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
          <h1 className="text-4xl font-extrabold text-sky-400 mb-3 tracking-wider">QUANTUM DRIFT 2</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Drift down the quantum highway, avoid anti-matter pylons & grab speed boosts!
          </p>
          <p className="text-sm text-zinc-400 mb-6">A / D or Left / Right Arrows to Steer & Drift</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl shadow-lg transition"
          >
            ENGAGE TURBO
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">VEHICLE CRASHED</h2>
          <p className="text-2xl font-bold text-sky-400 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl shadow-lg transition"
          >
            RETRY DRIFT
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-sky-500/30 rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
