"use client";

import React, { useEffect, useRef, useState } from "react";

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface Enemy {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  color: string;
  type: "basic" | "seeker" | "boss";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: "shield" | "triple";
}

export default function NeonShooter2() {
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
    let tripleShotTimer = 0;

    const player = {
      x: canvas.width / 2,
      y: canvas.height - 70,
      radius: 16,
      speed: 6,
    };

    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let particles: Particle[] = [];
    let powerups: PowerUp[] = [];

    const keys: Record<string, boolean> = {};
    let shootCooldown = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let frame = 0;

    const createExplosion = (x: number, y: number, color: string, count = 14) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: 2 + Math.random() * 3,
        });
      }
    };

    const update = () => {
      frame++;
      shootCooldown--;
      if (tripleShotTimer > 0) tripleShotTimer--;

      // Movement controls
      if ((keys["a"] || keys["arrowleft"]) && player.x > player.radius + 10) player.x -= player.speed;
      if ((keys["d"] || keys["arrowright"]) && player.x < canvas.width - player.radius - 10) player.x += player.speed;
      if ((keys["w"] || keys["arrowup"]) && player.y > player.radius + 10) player.y -= player.speed;
      if ((keys["s"] || keys["arrowdown"]) && player.y < canvas.height - player.radius - 10) player.y += player.speed;

      // Shooting
      if ((keys[" "] || keys["space"] || keys["k"]) && shootCooldown <= 0) {
        shootCooldown = tripleShotTimer > 0 ? 6 : 10;
        if (tripleShotTimer > 0) {
          bullets.push({ x: player.x, y: player.y - 15, vx: 0, vy: -12, color: "#38bdf8" });
          bullets.push({ x: player.x - 8, y: player.y - 10, vx: -3, vy: -11, color: "#38bdf8" });
          bullets.push({ x: player.x + 8, y: player.y - 10, vx: 3, vy: -11, color: "#38bdf8" });
        } else {
          bullets.push({ x: player.x, y: player.y - 15, vx: 0, vy: -12, color: "#00f0ff" });
        }
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.y < -20 || b.x < -20 || b.x > canvas.width + 20) {
          bullets.splice(i, 1);
        }
      }

      // Enemy Spawning
      if (frame % 45 === 0) {
        const x = 30 + Math.random() * (canvas.width - 60);
        const isSeeker = Math.random() < 0.3;
        const isBoss = frame % 300 === 0;

        if (isBoss) {
          enemies.push({
            x, y: -40, radius: 32, vx: Math.random() > 0.5 ? 2 : -2, vy: 1, hp: 12, maxHp: 12, color: "#f43f5e", type: "boss",
          });
        } else if (isSeeker) {
          enemies.push({
            x, y: -20, radius: 14, vx: 0, vy: 2.5, hp: 2, maxHp: 2, color: "#a855f7", type: "seeker",
          });
        } else {
          enemies.push({
            x, y: -20, radius: 18, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 2, hp: 3, maxHp: 3, color: "#eab308", type: "basic",
          });
        }
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.type === "seeker") {
          if (e.x < player.x) e.vx += 0.05;
          else e.vx -= 0.05;
          e.vx = Math.max(-2.5, Math.min(2.5, e.vx));
        } else if (e.type === "boss") {
          if (e.x - e.radius < 10 || e.x + e.radius > canvas.width - 10) e.vx *= -1;
        }

        e.x += e.vx;
        e.y += e.vy;

        if (e.y > canvas.height + 40) {
          enemies.splice(i, 1);
        }
      }

      // Bullet - Enemy Collision
      for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const b = bullets[i];
          const e = enemies[j];
          if (!b || !e) continue;

          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.radius + 6) {
            bullets.splice(i, 1);
            e.hp -= 1;
            createExplosion(b.x, b.y, b.color, 4);

            if (e.hp <= 0) {
              createExplosion(e.x, e.y, e.color, e.type === "boss" ? 30 : 12);
              if (Math.random() < 0.2) {
                powerups.push({
                  x: e.x,
                  y: e.y,
                  type: Math.random() < 0.5 ? "shield" : "triple",
                });
              }
              currentScore += e.type === "boss" ? 250 : e.type === "seeker" ? 35 : 20;
              setScore(currentScore);
              enemies.splice(j, 1);
            }
            break;
          }
        }
      }

      // Player Powerup Collision
      for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += 2;
        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist < player.radius + 14) {
          if (p.type === "shield") shield = Math.min(100, shield + 35);
          if (p.type === "triple") tripleShotTimer = 300;
          powerups.splice(i, 1);
        } else if (p.y > canvas.height + 20) {
          powerups.splice(i, 1);
        }
      }

      // Player Enemy Collision
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < player.radius + e.radius) {
          createExplosion(e.x, e.y, "#f43f5e", 18);
          shield -= e.type === "boss" ? 45 : 20;
          enemies.splice(j, 1);

          if (shield <= 0) {
            setScore(currentScore);
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
            setGameState("gameover");
            return;
          }
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield grid background
      ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
      ctx.lineWidth = 1;
      const step = 40;
      const shiftY = (frame * 2.5) % step;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = shiftY; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Render particles
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render powerups
      powerups.forEach((p) => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.type === "shield" ? "#10b981" : "#a855f7";
        ctx.fillStyle = p.type === "shield" ? "#10b981" : "#a855f7";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.type === "shield" ? "S" : "3", p.x, p.y);
        ctx.restore();
      });

      // Render bullets
      ctx.save();
      bullets.forEach((b) => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 3, b.y - 10, 6, 14);
      });
      ctx.restore();

      // Render enemies
      enemies.forEach((e) => {
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        if (e.type === "boss") {
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
          // Health bar above boss
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(e.x - 20, e.y - e.radius - 10, (e.hp / e.maxHp) * 40, 4);
        } else {
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Render Player Ship
      ctx.save();
      ctx.shadowBlur = 16;
      ctx.shadowColor = tripleShotTimer > 0 ? "#38bdf8" : "#00f0ff";
      ctx.fillStyle = tripleShotTimer > 0 ? "#38bdf8" : "#00f0ff";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - player.radius);
      ctx.lineTo(player.x + player.radius, player.y + player.radius);
      ctx.lineTo(player.x - player.radius, player.y + player.radius);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`Shield Matrix`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 150, 10);
      ctx.fillStyle = shield > 35 ? "#10b981" : "#f43f5e";
      ctx.fillRect(20, 75, (shield / 100) * 150, 10);

      if (tripleShotTimer > 0) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`TRIPLE SHOT OVERDRIVE`, 20, 105);
      }

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
          <h1 className="text-4xl font-extrabold text-cyan-400 mb-3 tracking-wider">NEON SHOOTER 2</h1>
          <p className="text-zinc-300 mb-2">Engage enemy armadas, collect powerups & withstand boss attacks!</p>
          <p className="text-sm text-zinc-400 mb-6">WASD / Arrows to Move | Spacebar or K to Fire</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl shadow-lg transition"
          >
            START MISSION
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">SHIP OVERWHELMED</h2>
          <p className="text-xl text-zinc-200 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl shadow-lg transition"
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
