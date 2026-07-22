"use client";

import React, { useEffect, useRef, useState } from "react";

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Enemy {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function NeonShooter() {
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

    let player = {
      x: canvas.width / 2,
      y: canvas.height - 80,
      radius: 18,
      speed: 6,
    };

    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let particles: Particle[] = [];

    const keys: Record<string, boolean> = {};
    let shootCooldown = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let frame = 0;

    const createExplosion = (x: number, y: number, color: string) => {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
        });
      }
    };

    const update = () => {
      frame++;
      shootCooldown--;

      // Controls
      if ((keys["a"] || keys["arrowleft"]) && player.x > player.radius + 10) player.x -= player.speed;
      if ((keys["d"] || keys["arrowright"]) && player.x < canvas.width - player.radius - 10) player.x += player.speed;
      if ((keys["w"] || keys["arrowup"]) && player.y > player.radius + 10) player.y -= player.speed;
      if ((keys["s"] || keys["arrowdown"]) && player.y < canvas.height - player.radius - 10) player.y += player.speed;

      // Shooting
      if ((keys[" "] || keys["space"] || keys["k"]) && shootCooldown <= 0) {
        bullets.push({ x: player.x, y: player.y - 20, vx: 0, vy: -12 });
        shootCooldown = 8;
      }

      // Spawn enemies
      if (frame % 35 === 0) {
        const colors = ["#00f0ff", "#ff007f", "#39ff14", "#ff00ff", "#ffff00"];
        enemies.push({
          x: Math.random() * (canvas.width - 60) + 30,
          y: -20,
          radius: 16 + Math.random() * 10,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      // Update bullets
      bullets.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
      });
      bullets = bullets.filter((b) => b.y > -20);

      // Update enemies
      enemies.forEach((e) => {
        e.x += e.vx;
        e.y += e.vy;
      });

      // Update particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
      });
      particles = particles.filter((p) => p.alpha > 0);

      // Bullet-Enemy Collisions
      for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const b = bullets[i];
          const e = enemies[j];
          if (!b || !e) continue;
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.radius + 4) {
            createExplosion(e.x, e.y, e.color);
            enemies.splice(j, 1);
            bullets.splice(i, 1);
            currentScore += 15;
            setScore(currentScore);
            break;
          }
        }
      }

      // Player-Enemy Collisions & Bounds
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < player.radius + e.radius) {
          createExplosion(e.x, e.y, "#ff0055");
          enemies.splice(j, 1);
          health -= 25;
          if (health <= 0) {
            setScore(currentScore);
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
            setGameState("gameover");
            return;
          }
        } else if (e.y > canvas.height + 30) {
          enemies.splice(j, 1);
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid effect
      ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      const offsetY = (frame * 2) % gridSize;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Particles
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Bullets
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00ffff";
      ctx.fillStyle = "#00ffff";
      bullets.forEach((b) => {
        ctx.fillRect(b.x - 3, b.y - 10, 6, 14);
      });

      // Draw Enemies
      enemies.forEach((e) => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player Ship
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - player.radius);
      ctx.lineTo(player.x + player.radius, player.y + player.radius);
      ctx.lineTo(player.x - player.radius, player.y + player.radius);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      // Health bar
      ctx.fillText(`Shield`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 150, 12);
      ctx.fillStyle = health > 40 ? "#38bdf8" : "#ef4444";
      ctx.fillRect(20, 75, (health / 100) * 150, 12);

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
          <h1 className="text-4xl font-bold text-cyan-400 mb-4 tracking-wider">NEON SHOOTER</h1>
          <p className="text-zinc-400 mb-2">Blast neon targets and shield your ship from incoming energy Orbs!</p>
          <p className="text-sm text-zinc-500 mb-6">WASD / Arrow keys to Move, Spacebar or K to Shoot</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START MISSION
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">SHIELD DESTROYED</h2>
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
