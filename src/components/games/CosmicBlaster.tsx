"use client";

import React, { useEffect, useRef, useState } from "react";

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Meteor {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  hp: number;
}

interface Powerup {
  x: number;
  y: number;
  type: "triple" | "shield";
}

export default function CosmicBlaster() {
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
    let tripleTimer = 0;

    let player = {
      x: canvas.width / 2,
      y: canvas.height - 70,
      width: 44,
      height: 24,
      speed: 7,
    };

    let bullets: Bullet[] = [];
    let meteors: Meteor[] = [];
    let powerups: Powerup[] = [];
    let frame = 0;
    let shootCooldown = 0;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      frame++;
      shootCooldown--;

      if (tripleTimer > 0) tripleTimer--;

      // Movement
      if ((keys["a"] || keys["arrowleft"]) && player.x > player.width / 2 + 10) player.x -= player.speed;
      if ((keys["d"] || keys["arrowright"]) && player.x < canvas.width - player.width / 2 - 10) player.x += player.speed;

      // Shoot
      if ((keys[" "] || keys["space"] || keys["k"]) && shootCooldown <= 0) {
        if (tripleTimer > 0) {
          bullets.push({ x: player.x, y: player.y - 10, vx: 0, vy: -12 });
          bullets.push({ x: player.x - 12, y: player.y - 10, vx: -3, vy: -11 });
          bullets.push({ x: player.x + 12, y: player.y - 10, vx: 3, vy: -11 });
        } else {
          bullets.push({ x: player.x, y: player.y - 10, vx: 0, vy: -12 });
        }
        shootCooldown = 7;
      }

      // Spawn meteors
      if (frame % 30 === 0) {
        const rad = 15 + Math.random() * 20;
        meteors.push({
          x: Math.random() * (canvas.width - 80) + 40,
          y: -30,
          radius: rad,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2 + Math.random() * 3,
          hp: Math.ceil(rad / 10),
        });
      }

      // Spawn powerups randomly
      if (frame % 280 === 0) {
        powerups.push({
          x: Math.random() * (canvas.width - 80) + 40,
          y: -20,
          type: Math.random() > 0.5 ? "triple" : "shield",
        });
      }

      // Update Bullets
      bullets.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
      });
      bullets = bullets.filter((b) => b.y > -20 && b.x > 0 && b.x < canvas.width);

      // Update Meteors
      meteors.forEach((m) => {
        m.x += m.vx;
        m.y += m.vy;
      });

      // Update Powerups
      powerups.forEach((p) => {
        p.y += 2.5;
      });

      // Bullet - Meteor Collisions
      for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = meteors.length - 1; j >= 0; j--) {
          const b = bullets[i];
          const m = meteors[j];
          if (!b || !m) continue;

          const dist = Math.hypot(b.x - m.x, b.y - m.y);
          if (dist < m.radius + 6) {
            m.hp -= 1;
            bullets.splice(i, 1);
            if (m.hp <= 0) {
              meteors.splice(j, 1);
              currentScore += 20;
              setScore(currentScore);
            }
            break;
          }
        }
      }

      // Powerup collection
      for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist < 30) {
          if (p.type === "triple") tripleTimer = 300;
          if (p.type === "shield") health = Math.min(100, health + 30);
          powerups.splice(i, 1);
        } else if (p.y > canvas.height + 20) {
          powerups.splice(i, 1);
        }
      }

      // Meteor - Player Collision
      for (let j = meteors.length - 1; j >= 0; j--) {
        const m = meteors[j];
        const dist = Math.hypot(player.x - m.x, player.y - m.y);
        if (dist < m.radius + 20) {
          health -= 20;
          meteors.splice(j, 1);
          if (health <= 0) {
            setScore(currentScore);
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
            setGameState("gameover");
            return;
          }
        } else if (m.y > canvas.height + 40) {
          meteors.splice(j, 1);
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars background
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 37 + frame * 0.5) % canvas.width;
        const sy = (i * 73 + frame * 1.5) % canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Render Bullets
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#e0e7ff";
      ctx.fillStyle = "#a5b4fc";
      bullets.forEach((b) => {
        ctx.fillRect(b.x - 3, b.y - 8, 6, 12);
      });

      // Render Meteors
      meteors.forEach((m) => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#f97316";
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Powerups
      powerups.forEach((p) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.type === "triple" ? "#38bdf8" : "#22c55e";
        ctx.fillStyle = p.type === "triple" ? "#38bdf8" : "#22c55e";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Player Ship
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#818cf8";
      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 18);
      ctx.lineTo(player.x + 22, player.y + 12);
      ctx.lineTo(player.x - 22, player.y + 12);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);
      if (tripleTimer > 0) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`TRIPLE SHOT ACTIVE`, 20, 95);
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Hull Shield`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(130, 52, 120, 14);
      ctx.fillStyle = health > 30 ? "#6366f1" : "#ef4444";
      ctx.fillRect(130, 52, (health / 100) * 120, 14);

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
          <h1 className="text-4xl font-bold text-indigo-400 mb-4 tracking-wider">COSMIC BLASTER</h1>
          <p className="text-zinc-400 mb-2">Blast cosmic meteors and collect powerups to defend deep space!</p>
          <p className="text-sm text-zinc-500 mb-6">A/D or Left/Right Arrow to Move | Spacebar or K to Shoot</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START BLASTER
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">SHIP DESTROYED</h2>
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
