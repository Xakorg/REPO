"use client";
import { useEffect, useRef, useState } from "react";

export default function VoidShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    let px = W / 2;
    let py = H - 60;
    let score = 0;
    let lives = 3;
    let isDead = false;

    type Laser = { x: number; y: number; vy: number };
    type Enemy = { x: number; y: number; vx: number; vy: number; radius: number; hp: number; maxHp: number; color: string };
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

    const lasers: Laser[] = [];
    const enemies: Enemy[] = [];
    const particles: Particle[] = [];
    const keys: Record<string, boolean> = {};

    let shootCooldown = 0;
    let enemySpawnTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationFrameId: number;

    const spawnParticles = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 20 + Math.random() * 15,
          color,
        });
      }
    };

    const gameLoop = () => {
      if (!isDead) {
        // Player Movement
        if (keys["ArrowLeft"] || keys["KeyA"]) px -= 6;
        if (keys["ArrowRight"] || keys["KeyD"]) px += 6;
        if (keys["ArrowUp"] || keys["KeyW"]) py -= 5;
        if (keys["ArrowDown"] || keys["KeyS"]) py += 5;

        px = Math.max(25, Math.min(W - 25, px));
        py = Math.max(100, Math.min(H - 30, py));

        // Shooting
        shootCooldown--;
        if ((keys["Space"] || keys["KeyJ"] || true) && shootCooldown <= 0) {
          lasers.push({ x: px - 12, y: py - 20, vy: -12 });
          lasers.push({ x: px + 12, y: py - 20, vy: -12 });
          shootCooldown = 10;
        }

        // Spawn Enemies
        enemySpawnTimer++;
        if (enemySpawnTimer > Math.max(18, 50 - Math.floor(score / 200))) {
          enemySpawnTimer = 0;
          const radius = 14 + Math.random() * 14;
          enemies.push({
            x: Math.random() * (W - 60) + 30,
            y: -radius,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 2 + Math.random() * 2.5 + score / 500,
            radius,
            hp: radius > 22 ? 3 : 1,
            maxHp: radius > 22 ? 3 : 1,
            color: radius > 22 ? "#a855f7" : "#ec4899",
          });
        }

        // Update Lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
          lasers[i].y += lasers[i].vy;
          if (lasers[i].y < -20) lasers.splice(i, 1);
        }

        // Update Enemies & Collisions
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.x += e.vx;
          e.y += e.vy;

          // Enemy out of bounds
          if (e.y > H + 40) {
            enemies.splice(i, 1);
            continue;
          }

          // Player collision
          const playerDist = Math.hypot(e.x - px, e.y - py);
          if (playerDist < e.radius + 18) {
            spawnParticles(e.x, e.y, "#ef4444", 20);
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) {
              isDead = true;
              setFinalScore(score);
              setGameOver(true);
              window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score } }));
            }
            continue;
          }

          // Laser collision
          for (let j = lasers.length - 1; j >= 0; j--) {
            const l = lasers[j];
            if (Math.hypot(l.x - e.x, l.y - e.y) < e.radius + 6) {
              lasers.splice(j, 1);
              e.hp--;
              spawnParticles(l.x, l.y, "#38bdf8", 4);
              if (e.hp <= 0) {
                spawnParticles(e.x, e.y, e.color, 16);
                score += e.maxHp * 50;
                enemies.splice(i, 1);
                break;
              }
            }
          }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) particles.splice(i, 1);
        }
      }

      // Render
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, W, H);

      // Starfield / Void Grid
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Render Lasers
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#38bdf8";
      for (const l of lasers) {
        ctx.fillRect(l.x - 2, l.y, 4, 12);
      }
      ctx.shadowBlur = 0;

      // Render Enemies
      for (const e of enemies) {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 35;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      }

      // Render Player Ship
      if (!isDead) {
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#c084fc";
        ctx.beginPath();
        ctx.moveTo(px, py - 22);
        ctx.lineTo(px - 18, py + 16);
        ctx.lineTo(px, py + 8);
        ctx.lineTo(px + 18, py + 16);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = "#f3e8ff";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`SCORE: ${score}`, 20, 30);
      ctx.fillText(`SHIELDS: ${"🛡️".repeat(Math.max(0, lives))}`, W - 160, 30);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameKey]);

  const restart = () => {
    setGameOver(false);
    setFinalScore(0);
    setGameKey((k) => k + 1);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4">
      <h2 className="text-purple-300 text-xl font-bold uppercase tracking-wider mb-2">Void Shooter</h2>
      <div className="relative">
        <canvas ref={canvasRef} width={640} height={480} className="border border-purple-900/40 rounded-xl bg-zinc-950 shadow-2xl" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4">
            <h3 className="text-purple-400 font-extrabold text-3xl uppercase">Ship Destroyed</h3>
            <p className="text-zinc-300 text-lg">Final Score: <span className="text-purple-400 font-bold">{finalScore}</span></p>
            <button
              onClick={restart}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <p className="text-zinc-500 text-xs mt-3">Controls: Arrow keys / WASD to move. Auto-shooting activated!</p>
    </div>
  );
}
