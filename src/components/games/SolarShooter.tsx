"use client";
import { useEffect, useRef, useState } from "react";

export default function SolarShooter() {
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

    let px = W / 2;
    let py = H - 50;
    let localScore = 0;
    let lives = 3;
    let isDead = false;

    const bullets: { x: number; y: number; vy: number }[] = [];
    const enemies: { x: number; y: number; r: number; vy: number; hp: number; color: string }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        bullets.push({ x: px, y: py - 20, vy: -10 });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      px = e.clientX - rect.left;
      px = Math.max(20, Math.min(W - 20, px));
    };
    const handleMouseDown = () => {
      if (!isDead) {
        bullets.push({ x: px, y: py - 20, vy: -10 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);

    let spawnTimer = 0;
    let animId: number;

    const spawnParticles = (x: number, y: number, color: string, count = 10) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 1;
        particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 20 + Math.random() * 15,
          color
        });
      }
    };

    const loop = () => {
      if (isDead) return;

      // Controls
      if (keys["ArrowLeft"] || keys["KeyA"]) px -= 6;
      if (keys["ArrowRight"] || keys["KeyD"]) px += 6;
      px = Math.max(25, Math.min(W - 25, px));

      // Spawning enemies
      spawnTimer++;
      if (spawnTimer > Math.max(20, 50 - Math.floor(localScore / 300))) {
        spawnTimer = 0;
        const r = 15 + Math.random() * 15;
        enemies.push({
          x: r + Math.random() * (W - r * 2),
          y: -r,
          r,
          vy: 2 + Math.random() * 3 + localScore / 1000,
          hp: r > 22 ? 2 : 1,
          color: Math.random() > 0.5 ? "#f97316" : "#eab308"
        });
      }

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].vy;
        if (bullets[i].y < -10) bullets.splice(i, 1);
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.vy;

        // Collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.r + 5) {
            bullets.splice(j, 1);
            e.hp--;
            spawnParticles(b.x, b.y, "#fde047", 4);
            if (e.hp <= 0) {
              localScore += Math.round(e.r * 5);
              setScore(localScore);
              spawnParticles(e.x, e.y, e.color, 12);
              enemies.splice(i, 1);
              break;
            }
          }
        }

        // Collision with ship
        if (e && Math.hypot(px - e.x, py - e.y) < e.r + 18) {
          spawnParticles(e.x, e.y, "#ef4444", 15);
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
        } else if (e && e.y > H + e.r) {
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
        }
      }

      // Draw background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      // Starfield background
      ctx.fillStyle = "#ffffff33";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97 + localScore * 0.5) % W;
        const sy = (i * 133 + localScore) % H;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Draw sun glow at top center
      const sunGrad = ctx.createRadialGradient(W / 2, 0, 10, W / 2, 0, 200);
      sunGrad.addColorStop(0, "rgba(251, 146, 60, 0.3)");
      sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, W, H);

      // Draw ship
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(px, py - 22);
      ctx.lineTo(px - 18, py + 18);
      ctx.lineTo(px, py + 10);
      ctx.lineTo(px + 18, py + 18);
      ctx.closePath();
      ctx.fill();

      // Core flame
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(px, py + 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Bullets
      ctx.fillStyle = "#fef08a";
      ctx.shadowColor = "#eab308";
      ctx.shadowBlur = 8;
      for (const b of bullets) {
        ctx.fillRect(b.x - 3, b.y - 10, 6, 12);
      }
      ctx.shadowBlur = 0;

      // Draw Enemies
      for (const e of enemies) {
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#00000044";
        ctx.beginPath();
        ctx.arc(e.x - e.r * 0.3, e.y - e.r * 0.3, e.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 35;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1.0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${localScore}`, 15, 30);
      ctx.textAlign = "right";
      ctx.fillText(`LIVES: ${"♥".repeat(lives)}`, W - 15, 30);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto" />
        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 mb-2">
              SOLAR SHOOTER
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Blast coronal asteroids before they breach the solar defense shield!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Score</p>
                <p className="text-3xl font-mono font-bold text-amber-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-amber-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "START MISSION"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              [Left / Right] or Mouse to Move • [Space / Click] to Blast
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
