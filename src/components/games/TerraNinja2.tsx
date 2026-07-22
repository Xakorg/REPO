"use client";

import React, { useEffect, useRef, useState } from "react";

interface Golem {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "spike" | "golem";
  hp: number;
}

interface Crystal {
  x: number;
  y: number;
  radius: number;
}

export default function TerraNinja2() {
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

    const groundY = canvas.height - 100;
    const ninja = {
      x: 100,
      y: groundY - 40,
      width: 30,
      height: 40,
      vy: 0,
      gravity: 0.8,
      jumping: false,
      jumpCount: 0,
      slashingTimer: 0,
    };

    let enemies: Golem[] = [];
    let crystals: Crystal[] = [];
    let spawnTimer = 0;
    let speed = 6;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((key === "w" || key === "arrowup" || key === " ") && ninja.jumpCount < 2) {
        ninja.vy = -14;
        ninja.jumping = true;
        ninja.jumpCount++;
      }
      if (key === "s" || key === "arrowdown" || key === "j") {
        ninja.slashingTimer = 15;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const update = () => {
      speed = 6 + Math.min(6, currentScore / 100);

      // Ninja physics
      ninja.vy += ninja.gravity;
      ninja.y += ninja.vy;

      if (ninja.y >= groundY - ninja.height) {
        ninja.y = groundY - ninja.height;
        ninja.vy = 0;
        ninja.jumping = false;
        ninja.jumpCount = 0;
      }

      if (ninja.slashingTimer > 0) ninja.slashingTimer--;

      // Spawning
      spawnTimer++;
      if (spawnTimer % Math.max(35, 80 - Math.floor(currentScore / 30)) === 0) {
        const isGolem = Math.random() > 0.4;
        enemies.push({
          x: canvas.width + 30,
          y: isGolem ? groundY - 50 : groundY - 30,
          width: isGolem ? 35 : 25,
          height: isGolem ? 50 : 30,
          type: isGolem ? "golem" : "spike",
          hp: 1,
        });
      }

      if (spawnTimer % 60 === 0) {
        crystals.push({
          x: canvas.width + 30,
          y: groundY - 100 - Math.random() * 80,
          radius: 12,
        });
      }

      // Update enemies
      enemies.forEach((e) => { e.x -= speed; });
      crystals.forEach((c) => { c.x -= speed; });

      // Ninja Slash hit golem
      if (ninja.slashingTimer > 0) {
        const slashBox = {
          x: ninja.x + ninja.width,
          y: ninja.y - 10,
          width: 50,
          height: ninja.height + 20,
        };

        enemies.forEach((e) => {
          if (
            e.hp > 0 &&
            slashBox.x < e.x + e.width &&
            slashBox.x + slashBox.width > e.x &&
            slashBox.y < e.y + e.height &&
            slashBox.y + slashBox.height > e.y
          ) {
            e.hp = 0;
            currentScore += 30;
            setScore(currentScore);
          }
        });
      }

      // Collision Ninja with Enemies
      enemies.forEach((e) => {
        if (
          e.hp > 0 &&
          ninja.x < e.x + e.width &&
          ninja.x + ninja.width > e.x &&
          ninja.y < e.y + e.height &&
          ninja.y + ninja.height > e.y
        ) {
          e.hp = 0;
          lives--;
        }
      });

      // Crystals collection
      crystals.forEach((c, idx) => {
        if (Math.hypot(ninja.x + ninja.width / 2 - c.x, ninja.y + ninja.height / 2 - c.y) < c.radius + 20) {
          currentScore += 25;
          setScore(currentScore);
          crystals.splice(idx, 1);
        }
      });

      // Cleanup
      enemies = enemies.filter((e) => e.hp > 0 && e.x > -50);
      crystals = crystals.filter((c) => c.x > -50);

      currentScore += 1;
      setScore(currentScore);

      if (lives <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Earth Ground
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.fillStyle = "#166534";
      ctx.fillRect(0, groundY + 10, canvas.width, canvas.height - groundY - 10);

      // Crystals
      crystals.forEach((c) => {
        ctx.fillStyle = "#a3e635";
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "#a3e635"; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      });

      // Enemies
      enemies.forEach((e) => {
        if (e.type === "golem") {
          ctx.fillStyle = "#78350f";
          ctx.fillRect(e.x, e.y, e.width, e.height);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(e.x + 5, e.y + 10, 8, 8);
        } else {
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + e.height);
          ctx.lineTo(e.x + e.width / 2, e.y);
          ctx.lineTo(e.x + e.width, e.y + e.height);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Ninja Body
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(ninja.x, ninja.y, ninja.width, ninja.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ninja.x + 18, ninja.y + 8, 8, 4); // Ninja Visor

      // Ninja Slash effect
      if (ninja.slashingTimer > 0) {
        ctx.fillStyle = "#86efac";
        ctx.beginPath();
        ctx.arc(ninja.x + ninja.width + 15, ninja.y + ninja.height / 2, 30, -Math.PI / 3, Math.PI / 3);
        ctx.lineTo(ninja.x + ninja.width, ninja.y + ninja.height / 2);
        ctx.fill();
      }

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);
      ctx.fillText(`Lives: ${"💚".repeat(lives)}`, 20, 65);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-emerald-400 mb-4 tracking-wider">TERRA NINJA 2</h1>
          <p className="text-zinc-400 mb-2">Run, jump over spikes, slash earth golems & harvest crystals!</p>
          <p className="text-sm text-zinc-500 mb-6">W / Up Arrow / Space to Double Jump | S / Down Arrow / J to Slash</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START RUN
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">NINJA DEFEATED</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-emerald-500/30 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
