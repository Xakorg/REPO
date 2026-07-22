"use client";
import { useEffect, useRef, useState } from "react";

export default function IronSurfer() {
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

    let px = 100;
    let py = H / 2;
    let vy = 0;
    let isJumping = false;
    let waveOffset = 0;

    let localScore = 0;
    let lives = 3;
    let isDead = false;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && !isJumping) {
        vy = -12;
        isJumping = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const obstacles: { x: number; y: number; r: number }[] = [];
    const coins: { x: number; y: number; r: number }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    let spawnTimer = 0;
    let animId: number;

    const getWaveY = (x: number, offset: number) => {
      return H / 2 + Math.sin((x + offset) * 0.015) * 60 + Math.cos((x + offset) * 0.008) * 30;
    };

    const loop = () => {
      if (isDead) return;

      waveOffset += 4;
      const targetWaveY = getWaveY(px, waveOffset);

      // Surfer Physics
      if (isJumping) {
        vy += 0.6; // Gravity
        py += vy;

        if (py >= targetWaveY - 10) {
          py = targetWaveY - 10;
          vy = 0;
          isJumping = false;
          // Aerial trick score bonus
          localScore += 50;
          setScore(localScore);

          for (let p = 0; p < 8; p++) {
            particles.push({
              x: px, y: py,
              vx: (Math.random() - 0.5) * 5,
              vy: -Math.random() * 3,
              life: 15,
              color: "#38bdf8"
            });
          }
        }
      } else {
        // Stick to wave curve
        py = targetWaveY - 10;

        if (keys["ArrowDown"] || keys["KeyS"]) py += 15;
      }

      // Continuous Surfing Distance Score
      localScore += 1;
      setScore(localScore);

      // Spawning Items & Mines
      spawnTimer++;
      if (spawnTimer > Math.max(30, 75 - Math.floor(localScore / 500))) {
        spawnTimer = 0;
        const itemX = W + 30;
        const waveAtX = getWaveY(itemX, waveOffset);

        if (Math.random() < 0.6) {
          obstacles.push({
            x: itemX,
            y: waveAtX - 15,
            r: 16
          });
        } else {
          coins.push({
            x: itemX,
            y: waveAtX - 70 - Math.random() * 50,
            r: 10
          });
        }
      }

      // Update Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= 5 + localScore / 2000;
        obs.y = getWaveY(obs.x, waveOffset) - 15;

        if (Math.hypot(obs.x - px, obs.y - py) < obs.r + 14) {
          obstacles.splice(i, 1);
          lives--;
          for (let p = 0; p < 12; p++) {
            particles.push({
              x: px, y: py,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 20,
              color: "#ef4444"
            });
          }
          if (lives <= 0) {
            isDead = true;
            setGameOver(true);
            window.dispatchEvent(
              new CustomEvent("xakteir-game-score", { detail: { score: localScore } })
            );
            return;
          }
        } else if (obs.x < -30) {
          obstacles.splice(i, 1);
        }
      }

      // Update Coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.x -= 5 + localScore / 2000;

        if (Math.hypot(c.x - px, c.y - py) < c.r + 14) {
          localScore += 150;
          setScore(localScore);
          for (let p = 0; p < 8; p++) {
            particles.push({
              x: c.x, y: c.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 15,
              color: "#facc15"
            });
          }
          coins.splice(i, 1);
        } else if (c.x < -30) {
          coins.splice(i, 1);
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
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, W, H);

      // Draw Cyber Electric Wave Fill
      ctx.fillStyle = "#0284c733";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) {
        ctx.lineTo(x, getWaveY(x, waveOffset));
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Coins (Orbs)
      for (const c of coins) {
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Obstacles (Mines)
      for (const obs of obstacles) {
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Iron Hoverboard & Surfer
      ctx.save();
      ctx.translate(px, py);

      // Iron Hoverboard
      ctx.fillStyle = "#0284c7";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(0, 8, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Surfer Body
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-6, -22, 12, 22);

      // Helmet
      ctx.fillStyle = "#f0f9ff";
      ctx.beginPath();
      ctx.arc(0, -26, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

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
      ctx.fillText(`SCORE: ${localScore}`, 20, 30);
      ctx.textAlign = "right";
      ctx.fillText(`SHIELD: ${"♥".repeat(lives)}`, W - 20, 30);

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
      <div className="relative border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto" />
        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 mb-2">
              IRON SURFER
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Ride cyber waves on an iron hoverboard, jump air tricks, and collect energy orbs!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Surf Score</p>
                <p className="text-3xl font-mono font-bold text-cyan-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-cyan-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "RIDE WAVES"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              [Space / Up Arrow] Aerial Trick Jump • [Down Arrow] Crouch
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
