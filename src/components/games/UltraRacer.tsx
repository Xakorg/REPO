"use client";
import { useEffect, useRef, useState } from "react";

export default function UltraRacer() {
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
    const ROAD_LEFT = 140;
    const ROAD_RIGHT = W - 140;
    const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;

    let px = W / 2;
    let py = H - 70;
    let speed = 6;
    let distanceScore = 0;
    let lives = 3;
    let isDead = false;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const traffic: { x: number; y: number; speed: number; color: string }[] = [];
    const coins: { x: number; y: number; type: "coin" | "nitro" }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    let spawnTimer = 0;
    let animId: number;

    const loop = () => {
      if (isDead) return;

      // Inputs
      if (keys["ArrowLeft"] || keys["KeyA"]) px -= 6;
      if (keys["ArrowRight"] || keys["KeyD"]) px += 6;

      const isNitro = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
      speed = isNitro ? 11 : 7;

      px = Math.max(ROAD_LEFT + 25, Math.min(ROAD_RIGHT - 25, px));

      // Distance score
      distanceScore += Math.round(speed / 2);
      setScore(distanceScore);

      // Spawning Traffic & Items
      spawnTimer++;
      if (spawnTimer > Math.max(18, 45 - Math.floor(distanceScore / 1000))) {
        spawnTimer = 0;
        const laneX = ROAD_LEFT + 40 + Math.random() * (ROAD_WIDTH - 80);
        if (Math.random() < 0.7) {
          traffic.push({
            x: laneX,
            y: -50,
            speed: 2 + Math.random() * 2,
            color: Math.random() > 0.5 ? "#3b82f6" : "#e11d48"
          });
        } else {
          coins.push({
            x: laneX,
            y: -30,
            type: Math.random() < 0.25 ? "nitro" : "coin"
          });
        }
      }

      // Move Traffic
      for (let i = traffic.length - 1; i >= 0; i--) {
        const t = traffic[i];
        t.y += speed - t.speed;

        // Collision with player car
        if (Math.abs(t.x - px) < 26 && Math.abs(t.y - py) < 40) {
          traffic.splice(i, 1);
          lives--;
          for (let p = 0; p < 15; p++) {
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
              new CustomEvent("xakteir-game-score", { detail: { score: distanceScore } })
            );
            return;
          }
        } else if (t.y > H + 60) {
          traffic.splice(i, 1);
        }
      }

      // Move Coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.y += speed;

        if (Math.hypot(c.x - px, c.y - py) < 30) {
          distanceScore += c.type === "nitro" ? 250 : 75;
          setScore(distanceScore);
          for (let p = 0; p < 8; p++) {
            particles.push({
              x: c.x, y: c.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 15,
              color: c.type === "nitro" ? "#38bdf8" : "#facc15"
            });
          }
          coins.splice(i, 1);
        } else if (c.y > H + 40) {
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
      ctx.fillStyle = "#022c22"; // Off-road grass
      ctx.fillRect(0, 0, W, H);

      // Road Asphalt
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, H);

      // Road Borders (Neon Green)
      ctx.fillStyle = "#10b981";
      ctx.fillRect(ROAD_LEFT - 6, 0, 6, H);
      ctx.fillRect(ROAD_RIGHT, 0, 6, H);

      // Moving Lane Dashes
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 25]);
      ctx.lineDashOffset = -distanceScore % 45;

      const laneStep = ROAD_WIDTH / 3;
      for (let l = 1; l < 3; l++) {
        ctx.beginPath();
        ctx.moveTo(ROAD_LEFT + l * laneStep, 0);
        ctx.lineTo(ROAD_LEFT + l * laneStep, H);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Items
      for (const c of coins) {
        ctx.fillStyle = c.type === "nitro" ? "#0284c7" : "#eab308";
        ctx.shadowColor = c.type === "nitro" ? "#38bdf8" : "#facc15";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Traffic Cars
      for (const t of traffic) {
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(t.x - 14, t.y - 24, 28, 48, 6);
        ctx.fill();

        // Windshield
        ctx.fillStyle = "#00000088";
        ctx.fillRect(t.x - 10, t.y - 6, 20, 12);
        ctx.shadowBlur = 0;
      }

      // Draw Player Super Car
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = isNitro ? 20 : 10;
      ctx.beginPath();
      ctx.roundRect(px - 15, py - 25, 30, 50, 8);
      ctx.fill();

      // Cockpit
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(px - 10, py - 10, 20, 16);

      // Taillights
      ctx.fillStyle = isNitro ? "#38bdf8" : "#ef4444";
      ctx.fillRect(px - 12, py + 20, 6, 4);
      ctx.fillRect(px + 6, py + 20, 6, 4);
      ctx.shadowBlur = 0;

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
      ctx.fillText(`DIST: ${distanceScore} m`, 20, 30);
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
      <div className="relative border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto" />
        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mb-2">
              ULTRA RACER
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Weave through highway traffic at ultra speeds and boost to hit high distance records!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Distance Record</p>
                <p className="text-3xl font-mono font-bold text-emerald-400">{score} m</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "START RACING"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              [Left / Right] Steer • [Space / Up Arrow] Nitro Boost
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
