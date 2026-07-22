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
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function SteelShooter2() {
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
    let playerHp = 100;

    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      speed: 4,
      angle: 0,
    };

    const keys: Record<string, boolean> = {};
    const mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };

    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let particles: Particle[] = [];
    let lastShoot = 0;
    let spawnTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseDown = () => { mouse.down = true; };
    const handleMouseUp = () => { mouse.down = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    const update = () => {
      // Movement
      if (keys["w"] || keys["arrowup"]) player.y = Math.max(20, player.y - player.speed);
      if (keys["s"] || keys["arrowdown"]) player.y = Math.min(canvas.height - 20, player.y + player.speed);
      if (keys["a"] || keys["arrowleft"]) player.x = Math.max(20, player.x - player.speed);
      if (keys["d"] || keys["arrowright"]) player.x = Math.min(canvas.width - 20, player.x + player.speed);

      // Aiming
      player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

      // Shooting
      const now = Date.now();
      if (mouse.down && now - lastShoot > 120) {
        bullets.push({
          x: player.x + Math.cos(player.angle) * 20,
          y: player.y + Math.sin(player.angle) * 20,
          vx: Math.cos(player.angle) * 12,
          vy: Math.sin(player.angle) * 12,
        });
        lastShoot = now;
      }

      // Bullets update
      bullets.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
      });
      bullets = bullets.filter((b) => b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height);

      // Enemy Spawning
      spawnTimer++;
      if (spawnTimer % Math.max(20, 60 - Math.floor(currentScore / 50)) === 0) {
        const edge = Math.floor(Math.random() * 4);
        let ex = 0, ey = 0;
        if (edge === 0) { ex = Math.random() * canvas.width; ey = -20; }
        else if (edge === 1) { ex = canvas.width + 20; ey = Math.random() * canvas.height; }
        else if (edge === 2) { ex = Math.random() * canvas.width; ey = canvas.height + 20; }
        else { ex = -20; ey = Math.random() * canvas.height; }

        enemies.push({
          x: ex,
          y: ey,
          hp: 2,
          maxHp: 2,
          speed: 1.5 + Math.random() * 1.5,
          radius: 16,
        });
      }

      // Enemies update
      enemies.forEach((e) => {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;

        // Player collision
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < e.radius + 15) {
          playerHp -= 10;
          e.hp = 0;
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: e.x, y: e.y,
              vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
              life: 1, color: "#ff4444"
            });
          }
        }
      });

      // Bullet-Enemy Collision
      bullets.forEach((b) => {
        enemies.forEach((e) => {
          if (e.hp > 0 && Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 4) {
            b.x = -999;
            e.hp--;
            if (e.hp <= 0) {
              currentScore += 10;
              setScore(currentScore);
              for (let i = 0; i < 10; i++) {
                particles.push({
                  x: e.x, y: e.y,
                  vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                  life: 1, color: "#e2e8f0"
                });
              }
            }
          }
        });
      });

      enemies = enemies.filter((e) => e.hp > 0);

      // Particles update
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
      });
      particles = particles.filter((p) => p.life > 0);

      // Game Over condition
      if (playerHp <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Particles
      particles.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Bullets
      ctx.fillStyle = "#38bdf8";
      bullets.forEach((b) => {
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
      });

      // Enemies
      enemies.forEach((e) => {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#f87171"; ctx.lineWidth = 2; ctx.stroke();
      });

      // Player Mech
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(0, -4, 20, 8);
      ctx.restore();

      // UI
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 30);

      // Player HP Bar
      ctx.fillStyle = "#3f3f46";
      ctx.fillRect(20, 40, 150, 12);
      ctx.fillStyle = playerHp > 30 ? "#22c55e" : "#ef4444";
      ctx.fillRect(20, 40, (playerHp / 100) * 150, 12);

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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-sky-400 mb-4 tracking-wider">STEEL SHOOTER 2</h1>
          <p className="text-zinc-400 mb-6">WASD / Arrow Keys to move, Mouse to aim & shoot metallic drones</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl shadow-lg transition"
          >
            START GAME
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">MECH DESTROYED</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
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
