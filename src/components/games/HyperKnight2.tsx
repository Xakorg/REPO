"use client";

import React, { useEffect, useRef, useState } from "react";

interface Enemy {
  id: number;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
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

export default function HyperKnight2() {
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
    let hp = 100;
    let dashCooldown = 0;
    let attackCooldown = 0;

    const knight = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 18,
      speed: 4.5,
      angle: 0,
      isAttacking: false,
      attackAngle: 0,
      attackTimer: 0,
    };

    let enemies: Enemy[] = [];
    let particles: Particle[] = [];
    let nextEnemyId = 1;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    const handleMouseDown = (e: MouseEvent) => {
      if (attackCooldown <= 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        knight.attackAngle = Math.atan2(mouseY - knight.y, mouseX - knight.x);
        knight.isAttacking = true;
        knight.attackTimer = 10;
        attackCooldown = 18;
        createSlashParticles(knight.x + Math.cos(knight.attackAngle) * 30, knight.y + Math.sin(knight.attackAngle) * 30, "#38bdf8");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousedown", handleMouseDown);

    let frame = 0;

    const createSlashParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          alpha: 1,
          color,
        });
      }
    };

    const update = () => {
      frame++;
      if (attackCooldown > 0) attackCooldown--;
      if (dashCooldown > 0) dashCooldown--;

      if (knight.isAttacking) {
        knight.attackTimer--;
        if (knight.attackTimer <= 0) knight.isAttacking = false;
      }

      // Movement
      let moveX = 0;
      let moveY = 0;
      if (keys["w"] || keys["arrowup"]) moveY -= 1;
      if (keys["s"] || keys["arrowdown"]) moveY += 1;
      if (keys["a"] || keys["arrowleft"]) moveX -= 1;
      if (keys["d"] || keys["arrowright"]) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        let moveSpeed = knight.speed;

        // Dash maneuver
        if (keys["shift"] && dashCooldown <= 0) {
          moveSpeed *= 3.5;
          dashCooldown = 60;
          createSlashParticles(knight.x, knight.y, "#eab308");
        }

        knight.x += (moveX / len) * moveSpeed;
        knight.y += (moveY / len) * moveSpeed;

        // Keep inside arena boundaries
        knight.x = Math.max(30, Math.min(canvas.width - 30, knight.x));
        knight.y = Math.max(30, Math.min(canvas.height - 30, knight.y));
      }

      // Spacebar attack fallback
      if (keys[" "] && attackCooldown <= 0) {
        knight.attackAngle = knight.angle;
        knight.isAttacking = true;
        knight.attackTimer = 10;
        attackCooldown = 18;
        createSlashParticles(knight.x + Math.cos(knight.attackAngle) * 30, knight.y + Math.sin(knight.attackAngle) * 30, "#38bdf8");
      }

      // Enemy Spawner
      if (frame % Math.max(25, 75 - Math.floor(currentScore / 150)) === 0) {
        let spawnX = 0, spawnY = 0;
        if (Math.random() < 0.5) {
          spawnX = Math.random() < 0.5 ? -20 : canvas.width + 20;
          spawnY = Math.random() * canvas.height;
        } else {
          spawnX = Math.random() * canvas.width;
          spawnY = Math.random() < 0.5 ? -20 : canvas.height + 20;
        }

        const isHeavy = Math.random() < 0.2;
        enemies.push({
          id: nextEnemyId++,
          x: spawnX,
          y: spawnY,
          radius: isHeavy ? 24 : 14,
          hp: isHeavy ? 6 : 2,
          maxHp: isHeavy ? 6 : 2,
          speed: isHeavy ? 1.5 : 2.8,
          color: isHeavy ? "#ef4444" : "#a855f7",
        });
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const angleToKnight = Math.atan2(knight.y - e.y, knight.x - e.x);
        e.x += Math.cos(angleToKnight) * e.speed;
        e.y += Math.sin(angleToKnight) * e.speed;

        // Check Blade Slash Collision
        if (knight.isAttacking) {
          const slashX = knight.x + Math.cos(knight.attackAngle) * 35;
          const slashY = knight.y + Math.sin(knight.attackAngle) * 35;
          if (Math.hypot(e.x - slashX, e.y - slashY) < e.radius + 35) {
            e.hp -= 2;
            createSlashParticles(e.x, e.y, "#38bdf8");

            if (e.hp <= 0) {
              createSlashParticles(e.x, e.y, e.color);
              currentScore += e.radius > 20 ? 80 : 30;
              hp = Math.min(100, hp + 2);
              setScore(currentScore);
              enemies.splice(i, 1);
              continue;
            }
          }
        }

        // Enemy Knight Collision
        if (Math.hypot(knight.x - e.x, knight.y - e.y) < knight.radius + e.radius) {
          createSlashParticles(knight.x, knight.y, "#ef4444");
          hp -= e.radius > 20 ? 15 : 8;
          enemies.splice(i, 1);

          if (hp <= 0) {
            setScore(currentScore);
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
            setGameState("gameover");
            return;
          }
        }
      }

      // Update Particles
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

      // Arena boundary ring
      ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

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

      // Render Enemies
      enemies.forEach((e) => {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = "#27272a";
        ctx.fillRect(e.x - 12, e.y - e.radius - 8, 24, 3);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(e.x - 12, e.y - e.radius - 8, (e.hp / e.maxHp) * 24, 3);
        ctx.restore();
      });

      // Render Knight Player
      ctx.save();
      ctx.translate(knight.x, knight.y);
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(0, 0, knight.radius, 0, Math.PI * 2);
      ctx.fill();

      // Blade Attack Arc
      if (knight.isAttacking) {
        ctx.rotate(knight.attackAngle);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 45, -Math.PI / 4, Math.PI / 4);
        ctx.stroke();
      }

      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`SCORE: ${currentScore}`, 30, 45);

      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`HYPER VITALITY`, 30, 75);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(30, 85, 140, 10);
      ctx.fillStyle = hp > 30 ? "#38bdf8" : "#ef4444";
      ctx.fillRect(30, 85, (hp / 100) * 140, 10);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousedown", handleMouseDown);
    };
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h1 className="text-4xl font-extrabold text-sky-400 mb-3 tracking-wider">HYPER KNIGHT 2</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Battle cyber demons in the neon arena with your hyper energy blade!
          </p>
          <p className="text-sm text-zinc-400 mb-6">WASD / Arrows to Move | Click or Space to Attack | Shift to Dash</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl shadow-lg transition"
          >
            ENTER ARENA
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">KNIGHT DEFEATED</h2>
          <p className="text-2xl font-bold text-sky-400 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl shadow-lg transition"
          >
            RETRY ARENA
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-sky-500/30 rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.2)] max-w-full max-h-full object-contain cursor-crosshair"
      />
    </div>
  );
}
