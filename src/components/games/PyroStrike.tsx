"use client";
import { useEffect, useRef, useState } from "react";

export default function PyroStrike() {
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
    let py = H - 50;
    let score = 0;
    let hp = 3;
    let isDead = false;

    type Fireball = { x: number; y: number; vy: number; radius: number };
    type IceEnemy = { x: number; y: number; vy: number; radius: number; hp: number };
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

    const fireballs: Fireball[] = [];
    const enemies: IceEnemy[] = [];
    const particles: Particle[] = [];
    const keys: Record<string, boolean> = {};

    let shootCooldown = 0;
    let spawnTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationFrameId: number;

    const createExplosion = (x: number, y: number, color: string, count = 15) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 15 + Math.random() * 15,
          color,
        });
      }
    };

    const gameLoop = () => {
      if (!isDead) {
        // Player Movement
        if (keys["ArrowLeft"] || keys["KeyA"]) px -= 7;
        if (keys["ArrowRight"] || keys["KeyD"]) px += 7;
        px = Math.max(25, Math.min(W - 25, px));

        // Auto Fireball Shooting
        shootCooldown--;
        if (shootCooldown <= 0) {
          fireballs.push({ x: px, y: py - 20, vy: -10, radius: 6 });
          shootCooldown = 9;
        }

        // Spawn Frost Enemies
        spawnTimer++;
        if (spawnTimer > Math.max(20, 60 - Math.floor(score / 150))) {
          spawnTimer = 0;
          const radius = 16 + Math.random() * 12;
          enemies.push({
            x: 30 + Math.random() * (W - 60),
            y: -radius,
            vy: 2 + Math.random() * 3 + score / 400,
            radius,
            hp: radius > 22 ? 2 : 1,
          });
        }

        // Update Fireballs
        for (let i = fireballs.length - 1; i >= 0; i--) {
          const f = fireballs[i];
          f.y += f.vy;
          if (f.y < -20) fireballs.splice(i, 1);
        }

        // Update Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.y += e.vy;

          if (e.y > H + 40) {
            enemies.splice(i, 1);
            continue;
          }

          // Player collision
          if (Math.hypot(e.x - px, e.y - py) < e.radius + 18) {
            createExplosion(e.x, e.y, "#f97316", 20);
            enemies.splice(i, 1);
            hp--;
            if (hp <= 0) {
              isDead = true;
              setFinalScore(score);
              setGameOver(true);
              window.dispatchEvent(
                new CustomEvent("xakteir-game-score", { detail: { score } })
              );
            }
            continue;
          }

          // Fireball collision
          for (let j = fireballs.length - 1; j >= 0; j--) {
            const f = fireballs[j];
            if (Math.hypot(f.x - e.x, f.y - e.y) < e.radius + f.radius) {
              fireballs.splice(j, 1);
              e.hp--;
              createExplosion(f.x, f.y, "#f97316", 6);
              if (e.hp <= 0) {
                createExplosion(e.x, e.y, "#38bdf8", 16);
                score += 100;
                enemies.splice(i, 1);
                break;
              }
            }
          }
        }

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) particles.splice(i, 1);
        }
      }

      // Render Background
      ctx.fillStyle = "#0c0a09";
      ctx.fillRect(0, 0, W, H);

      // Flame Glow Ground
      ctx.fillStyle = "#451a03";
      ctx.fillRect(0, H - 15, W, 15);

      // Render Fireballs
      for (const f of fireballs) {
        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render Ice Enemies
      for (const e of enemies) {
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 25;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      }

      // Render Pyromancer Hero
      if (!isDead) {
        ctx.shadowColor = "#ea580c";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#ea580c";
        ctx.beginPath();
        ctx.moveTo(px, py - 24);
        ctx.lineTo(px - 18, py + 16);
        ctx.lineTo(px + 18, py + 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(px, py - 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = "#fff font-sans";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`SCORE: ${score}`, 20, 30);
      ctx.fillText(`HP: ${"🔥".repeat(Math.max(0, hp))}`, W - 120, 30);

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
      <h2 className="text-orange-400 text-xl font-bold uppercase tracking-wider mb-2">Pyro Strike</h2>
      <div className="relative">
        <canvas ref={canvasRef} width={640} height={480} className="border border-orange-900/50 rounded-xl bg-zinc-950 shadow-2xl" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4">
            <h3 className="text-orange-500 font-extrabold text-3xl uppercase">Flame Extinguished</h3>
            <p className="text-zinc-300 text-lg">Final Score: <span className="text-orange-400 font-bold">{finalScore}</span></p>
            <button
              onClick={restart}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold uppercase rounded-lg transition"
            >
              Ignite Again
            </button>
          </div>
        )}
      </div>
      <p className="text-zinc-500 text-xs mt-3">Controls: Arrow keys / A & D to move. Rapid fire enabled!</p>
    </div>
  );
}
