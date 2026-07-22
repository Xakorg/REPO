"use client";

import React, { useEffect, useRef, useState } from "react";

interface SubBullet {
  x: number;
  y: number;
  speed: number;
}

interface AquaEnemy {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
}

interface Pearl {
  x: number;
  y: number;
  radius: number;
}

export default function AquaBlaster2() {
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

    let subY = canvas.height / 2;
    let subSpeed = 5;

    let bullets: SubBullet[] = [];
    let enemies: AquaEnemy[] = [];
    let pearls: Pearl[] = [];

    let spawnTimer = 0;
    let lastShoot = 0;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      // Sub movement
      if (keys["w"] || keys["arrowup"]) subY = Math.max(30, subY - subSpeed);
      if (keys["s"] || keys["arrowdown"]) subY = Math.min(canvas.height - 30, subY + subSpeed);

      // Shooting
      const now = Date.now();
      if ((keys[" "] || keys["space"]) && now - lastShoot > 150) {
        bullets.push({ x: 90, y: subY, speed: 10 });
        lastShoot = now;
      }

      // Bullets
      bullets.forEach((b) => { b.x += b.speed; });
      bullets = bullets.filter((b) => b.x <= canvas.width + 20);

      // Spawning enemies & pearls
      spawnTimer++;
      if (spawnTimer % Math.max(25, 60 - Math.floor(currentScore / 40)) === 0) {
        enemies.push({
          x: canvas.width + 30,
          y: 40 + Math.random() * (canvas.height - 80),
          radius: 18,
          speed: 2 + Math.random() * 2,
          hp: 2,
        });
      }

      if (spawnTimer % 90 === 0) {
        pearls.push({
          x: canvas.width + 30,
          y: 40 + Math.random() * (canvas.height - 80),
          radius: 14,
        });
      }

      // Update Enemies
      enemies.forEach((e) => { e.x -= e.speed; });

      // Enemy hit sub
      enemies.forEach((e) => {
        if (Math.hypot(60 - e.x, subY - e.y) < e.radius + 20) {
          lives--;
          e.hp = 0;
        }
      });

      // Update Pearls
      pearls.forEach((p) => { p.x -= 2; });

      // Collect Pearl
      pearls.forEach((p, idx) => {
        if (Math.hypot(60 - p.x, subY - p.y) < p.radius + 20) {
          currentScore += 30;
          setScore(currentScore);
          pearls.splice(idx, 1);
        }
      });

      // Bullet - Enemy collision
      bullets.forEach((b) => {
        enemies.forEach((e) => {
          if (e.hp > 0 && Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 6) {
            b.x = 9999;
            e.hp--;
            if (e.hp <= 0) {
              currentScore += 15;
              setScore(currentScore);
            }
          }
        });
      });

      // Filter dead
      enemies = enemies.filter((e) => e.hp > 0 && e.x >= -40);
      pearls = pearls.filter((p) => p.x >= -40);

      if (lives <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Draw Deep Sea
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient overlay
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#0369a1");
      grad.addColorStop(1, "#0c4a6e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Bullets
      ctx.fillStyle = "#38bdf8";
      bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies (Squids/Mines)
      enemies.forEach((e) => {
        ctx.fillStyle = "#e11d48";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fda4af";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Pearls
      pearls.forEach((p) => {
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "#fef08a"; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      });

      // Draw Submarine
      ctx.save();
      ctx.translate(60, subY);
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.ellipse(0, 0, 25, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sub Window
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.arc(8, -2, 6, 0, Math.PI * 2);
      ctx.fill();

      // Periscope
      ctx.fillStyle = "#ca8a04";
      ctx.fillRect(-5, -20, 4, 10);
      ctx.fillRect(-5, -20, 8, 4);

      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);
      ctx.fillText(`Sub Health: ${"💙".repeat(lives)}`, 20, 65);

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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-sky-400 mb-4 tracking-wider">AQUA BLASTER 2</h1>
          <p className="text-zinc-400 mb-2">Pilot the submarine, blast deep sea monsters & collect golden pearls!</p>
          <p className="text-sm text-zinc-500 mb-6">W/S or Up/Down Arrows to steer, Spacebar to fire torpedoes</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl shadow-lg transition"
          >
            LAUNCH SUB
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">SUB CRUSHED</h2>
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
        className="border-2 border-sky-500/30 rounded-xl shadow-[0_0_30px_rgba(14,165,233,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
