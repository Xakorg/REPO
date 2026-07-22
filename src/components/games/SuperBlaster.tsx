"use client";
import { useEffect, useRef, useState } from "react";

export default function SuperBlaster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    let px = 60;
    let py = H / 2;
    let localScore = 0;
    let lives = 3;
    let isDead = false;
    let weaponLevel = 1;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const playerBullets: { x: number; y: number; vx: number; vy: number }[] = [];
    const enemyBullets: { x: number; y: number; vx: number; vy: number }[] = [];
    const enemies: { x: number; y: number; r: number; hp: number; vy: number; shootTimer: number }[] = [];
    const powerups: { x: number; y: number; r: number }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    let shootCooldown = 0;
    let spawnTimer = 0;
    let animId: number;

    const spawnExplosion = (x: number, y: number, color: string, count = 10) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 1;
        particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 20,
          color
        });
      }
    };

    const loop = () => {
      if (isDead) return;

      // Player Movement
      const speed = 5.5;
      if (keys["ArrowUp"] || keys["KeyW"]) py -= speed;
      if (keys["ArrowDown"] || keys["KeyS"]) py += speed;
      if (keys["ArrowLeft"] || keys["KeyA"]) px -= speed;
      if (keys["ArrowRight"] || keys["KeyD"]) px += speed;

      px = Math.max(30, Math.min(W - 30, px));
      py = Math.max(30, Math.min(H - 30, py));

      // Player Auto / Manual Shoot
      shootCooldown++;
      if ((keys["Space"] || keys["KeyK"] || shootCooldown > 8) && shootCooldown >= 7) {
        shootCooldown = 0;
        if (weaponLevel === 1) {
          playerBullets.push({ x: px + 20, y: py, vx: 12, vy: 0 });
        } else if (weaponLevel === 2) {
          playerBullets.push({ x: px + 20, y: py - 6, vx: 12, vy: -1.5 });
          playerBullets.push({ x: px + 20, y: py + 6, vx: 12, vy: 1.5 });
        } else {
          playerBullets.push({ x: px + 20, y: py, vx: 14, vy: 0 });
          playerBullets.push({ x: px + 20, y: py - 10, vx: 13, vy: -3 });
          playerBullets.push({ x: px + 20, y: py + 10, vx: 13, vy: 3 });
        }
      }

      // Enemy Spawning
      spawnTimer++;
      if (spawnTimer > Math.max(25, 60 - Math.floor(localScore / 400))) {
        spawnTimer = 0;
        const r = 16 + Math.random() * 12;
        enemies.push({
          x: W + r,
          y: r + Math.random() * (H - r * 2),
          r,
          hp: r > 22 ? 3 : 1,
          vy: (Math.random() - 0.5) * 2,
          shootTimer: Math.floor(Math.random() * 40)
        });
      }

      // Update Player Bullets
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x > W + 20) playerBullets.splice(i, 1);
      }

      // Update Enemy Bullets
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        eb.x += eb.vx;
        eb.y += eb.vy;
        if (Math.hypot(eb.x - px, eb.y - py) < 18) {
          enemyBullets.splice(i, 1);
          spawnExplosion(px, py, "#ef4444", 12);
          lives--;
          if (lives <= 0) {
            isDead = true;
            setGameOver(true);
            window.dispatchEvent(
              new CustomEvent("xakteir-game-score", { detail: { score: localScore } })
            );
            return;
          }
        } else if (eb.x < -20) {
          enemyBullets.splice(i, 1);
        }
      }

      // Update Powerups
      for (let i = powerups.length - 1; i >= 0; i--) {
        const pow = powerups[i];
        pow.x -= 2;
        if (Math.hypot(pow.x - px, pow.y - py) < 25) {
          powerups.splice(i, 1);
          weaponLevel = Math.min(3, weaponLevel + 1);
          localScore += 200;
          setScore(localScore);
          spawnExplosion(px, py, "#38bdf8", 15);
        } else if (pow.x < -20) {
          powerups.splice(i, 1);
        }
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x -= 2.8 + localScore / 2000;
        e.y += e.vy;
        if (e.y < e.r || e.y > H - e.r) e.vy *= -1;

        // Enemy shooting
        e.shootTimer++;
        if (e.shootTimer > 60) {
          e.shootTimer = 0;
          enemyBullets.push({ x: e.x - e.r, y: e.y, vx: -6, vy: 0 });
        }

        // Bullet Collision
        for (let j = playerBullets.length - 1; j >= 0; j--) {
          const pb = playerBullets[j];
          if (Math.hypot(pb.x - e.x, pb.y - e.y) < e.r + 5) {
            playerBullets.splice(j, 1);
            e.hp--;
            spawnExplosion(pb.x, pb.y, "#facc15", 3);
            if (e.hp <= 0) {
              localScore += 100;
              setScore(localScore);
              spawnExplosion(e.x, e.y, "#f97316", 12);
              if (Math.random() < 0.25) {
                powerups.push({ x: e.x, y: e.y, r: 12 });
              }
              enemies.splice(i, 1);
              break;
            }
          }
        }

        // Ship Collision
        if (e && Math.hypot(e.x - px, e.y - py) < e.r + 16) {
          spawnExplosion(e.x, e.y, "#ef4444", 15);
          enemies.splice(i, 1);
          lives--;
          if (lives <= 0) {
            isDead = true;
            setGameOver(true);
            window.dispatchEvent(
              new CustomEvent("xakteir-game-score", { detail: { score: localScore } })
            );
            return;
          }
        } else if (e && e.x < -e.r) {
          enemies.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // DRAWING
      ctx.fillStyle = "#0c0a09";
      ctx.fillRect(0, 0, W, H);

      // Starfield horizontal motion
      ctx.fillStyle = "#ffffff44";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 123 + localScore * 3) % W;
        const sy = (i * 87) % H;
        ctx.fillRect(W - sx, sy, 2, 2);
      }

      // Draw Player Ship
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.moveTo(px + 20, py);
      ctx.lineTo(px - 16, py - 14);
      ctx.lineTo(px - 8, py);
      ctx.lineTo(px - 16, py + 14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(px + 2, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Player Bullets
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 8;
      for (const pb of playerBullets) {
        ctx.fillRect(pb.x, pb.y - 3, 12, 6);
      }
      ctx.shadowBlur = 0;

      // Draw Enemy Bullets
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 8;
      for (const eb of enemyBullets) {
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw Powerups
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      for (const pow of powerups) {
        ctx.beginPath();
        ctx.arc(pow.x, pow.y, pow.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("P", pow.x, pow.y + 3);
      }
      ctx.shadowBlur = 0;

      // Draw Enemies
      for (const e of enemies) {
        ctx.fillStyle = "#dc2626";
        ctx.shadowColor = "#dc2626";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1.0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${localScore}   WEAPON: Lvl ${weaponLevel}`, 20, 30);
      ctx.textAlign = "right";
      ctx.fillText(`LIVES: ${"♥".repeat(lives)}`, W - 20, 30);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto" />
        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 mb-2">
              SUPER BLASTER
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Fly through the space armada, collect power orbs, and blast enemies to pieces!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Score</p>
                <p className="text-3xl font-mono font-bold text-orange-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-orange-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "LAUNCH JET"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              [WASD / Arrow Keys] Fly • [Space] Rapid Fire Blaster
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
