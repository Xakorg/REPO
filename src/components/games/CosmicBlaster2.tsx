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
  vx: number;
  vy: number;
  radius: number;
  color: string;
  hp: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function CosmicBlaster2() {
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

    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 18,
      speed: 5,
      angle: 0,
    };

    let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
    let isMouseDown = false;

    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let particles: Particle[] = [];

    const keys: Record<string, boolean> = {};
    let shootCooldown = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => { isMouseDown = true; };
    const handleMouseUp = () => { isMouseDown = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    let frame = 0;

    const createExplosion = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
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

      // Movement controls
      if ((keys["a"] || keys["arrowleft"]) && player.x > player.radius + 10) player.x -= player.speed;
      if ((keys["d"] || keys["arrowright"]) && player.x < canvas.width - player.radius - 10) player.x += player.speed;
      if ((keys["w"] || keys["arrowup"]) && player.y > player.radius + 10) player.y -= player.speed;
      if ((keys["s"] || keys["arrowdown"]) && player.y < canvas.height - player.radius - 10) player.y += player.speed;

      // Player rotation towards mouse
      player.angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);

      // Shooting
      if ((isMouseDown || keys[" "] || keys["space"]) && shootCooldown <= 0) {
        shootCooldown = 8;
        const bulletSpeed = 12;
        bullets.push({
          x: player.x + Math.cos(player.angle) * 20,
          y: player.y + Math.sin(player.angle) * 20,
          vx: Math.cos(player.angle) * bulletSpeed,
          vy: Math.sin(player.angle) * bulletSpeed,
        });
      }

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          bullets.splice(i, 1);
        }
      }

      // Spawn Enemies around edges
      if (frame % Math.max(20, 60 - Math.floor(currentScore / 200)) === 0) {
        let spawnX = 0;
        let spawnY = 0;
        if (Math.random() < 0.5) {
          spawnX = Math.random() < 0.5 ? -20 : canvas.width + 20;
          spawnY = Math.random() * canvas.height;
        } else {
          spawnX = Math.random() * canvas.width;
          spawnY = Math.random() < 0.5 ? -20 : canvas.height + 20;
        }

        const angleToPlayer = Math.atan2(player.y - spawnY, player.x - spawnX);
        const speed = 1.5 + Math.random() * 2;
        const isBig = Math.random() < 0.2;

        enemies.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angleToPlayer) * speed,
          vy: Math.sin(angleToPlayer) * speed,
          radius: isBig ? 24 : 14,
          color: isBig ? "#f43f5e" : "#a855f7",
          hp: isBig ? 4 : 1,
        });
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        // Re-steer towards player slightly
        const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        e.vx += Math.cos(angleToPlayer) * 0.05;
        e.vy += Math.sin(angleToPlayer) * 0.05;
        const currentSpeed = Math.hypot(e.vx, e.vy);
        const maxSpeed = 2.8;
        if (currentSpeed > maxSpeed) {
          e.vx = (e.vx / currentSpeed) * maxSpeed;
          e.vy = (e.vy / currentSpeed) * maxSpeed;
        }

        e.x += e.vx;
        e.y += e.vy;

        // Player Collision
        const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
        if (distToPlayer < player.radius + e.radius) {
          createExplosion(e.x, e.y, "#f43f5e", 20);
          enemies.splice(i, 1);
          lives--;

          if (lives <= 0) {
            setScore(currentScore);
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
            setGameState("gameover");
            return;
          }
        }
      }

      // Bullet - Enemy Collision
      for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const b = bullets[i];
          const e = enemies[j];
          if (!b || !e) continue;

          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.radius + 5) {
            createExplosion(b.x, b.y, "#38bdf8", 5);
            bullets.splice(i, 1);
            e.hp--;

            if (e.hp <= 0) {
              createExplosion(e.x, e.y, e.color, 16);
              currentScore += e.radius > 20 ? 50 : 20;
              setScore(currentScore);
              enemies.splice(j, 1);
            }
            break;
          }
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      // RENDER
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield background
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) {
        const starX = (i * 137) % canvas.width;
        const starY = (i * 243) % canvas.height;
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      // Particles
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Bullets
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Enemies
      enemies.forEach((e) => {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Player Ship
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#eab308";
      ctx.fillStyle = "#eab308";

      ctx.beginPath();
      ctx.moveTo(player.radius + 4, 0);
      ctx.lineTo(-player.radius, -player.radius + 4);
      ctx.lineTo(-player.radius / 2, 0);
      ctx.lineTo(-player.radius, player.radius - 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`SCORE: ${currentScore}`, 20, 35);
      ctx.fillText(`SHIELDS: ${"❤️ ".repeat(lives)}`, 20, 65);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h1 className="text-4xl font-extrabold text-amber-400 mb-3 tracking-wider">COSMIC BLASTER 2</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Defend against surrounding alien swarms in 360° cosmic space combat!
          </p>
          <p className="text-sm text-zinc-400 mb-6">WASD / Arrows to Move | Mouse to Aim & Click to Blast</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl shadow-lg transition"
          >
            LAUNCH INTERCEPTOR
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">DEFENSES DESTROYED</h2>
          <p className="text-2xl font-bold text-amber-400 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl shadow-lg transition"
          >
            RETRY BLASTER
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-amber-500/30 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.2)] max-w-full max-h-full object-contain cursor-crosshair"
      />
    </div>
  );
}
