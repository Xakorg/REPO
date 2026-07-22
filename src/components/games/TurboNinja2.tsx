"use client";

import React, { useEffect, useRef, useState } from "react";

interface Building {
  x: number;
  width: number;
  height: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "ninja" | "shuriken";
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function TurboNinja2() {
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
    let hp = 3;
    let gameSpeed = 7;

    const groundY = canvas.height - 80;

    const ninja = {
      x: 100,
      y: groundY - 40,
      width: 30,
      height: 40,
      vy: 0,
      gravity: 0.8,
      jumping: false,
      jumpsLeft: 2,
      sliding: false,
      slideTimer: 0,
      slashing: false,
      slashTimer: 0,
    };

    let buildings: Building[] = [];
    let enemies: Enemy[] = [];
    let particles: Particle[] = [];

    // Initial buildings setup
    let bX = 0;
    while (bX < canvas.width + 400) {
      const w = 150 + Math.random() * 200;
      const h = 80 + Math.random() * 60;
      buildings.push({ x: bX, width: w, height: h });
      bX += w + 60 + Math.random() * 80; // gaps
    }

    const keys: Record<string, boolean> = {};

    const createSlashEffect = (x: number, y: number) => {
      for (let i = 0; i < 15; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          alpha: 1,
          color: "#f43f5e",
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!keys[k]) {
        keys[k] = true;

        if (k === " " || k === "w" || k === "arrowup") {
          if (ninja.jumpsLeft > 0) {
            ninja.vy = -14;
            ninja.jumping = true;
            ninja.jumpsLeft--;
          }
        }
        if (k === "s" || k === "arrowdown") {
          if (!ninja.jumping && !ninja.sliding) {
            ninja.sliding = true;
            ninja.slideTimer = 25;
          }
        }
        if (k === "j" || k === "k") {
          if (!ninja.slashing) {
            ninja.slashing = true;
            ninja.slashTimer = 15;
            createSlashEffect(ninja.x + 40, ninja.y + 10);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let frame = 0;

    const update = () => {
      frame++;
      currentScore += 1;
      setScore(currentScore);

      if (frame % 300 === 0) gameSpeed += 0.5;

      // Handle Slash & Slide timers
      if (ninja.slashing) {
        ninja.slashTimer--;
        if (ninja.slashTimer <= 0) ninja.slashing = false;
      }
      if (ninja.sliding) {
        ninja.slideTimer--;
        if (ninja.slideTimer <= 0) ninja.sliding = false;
      }

      // Gravity & Ninja Movement
      ninja.vy += ninja.gravity;
      ninja.y += ninja.vy;

      // Check current building collision beneath player
      let onGround = false;
      const effectiveHeight = ninja.sliding ? 20 : ninja.height;

      buildings.forEach((b) => {
        const buildingTop = canvas.height - b.height;
        if (
          ninja.x + ninja.width > b.x &&
          ninja.x < b.x + b.width &&
          ninja.y + effectiveHeight >= buildingTop &&
          ninja.y + effectiveHeight - ninja.vy <= buildingTop + 10
        ) {
          ninja.y = buildingTop - effectiveHeight;
          ninja.vy = 0;
          ninja.jumping = false;
          ninja.jumpsLeft = 2;
          onGround = true;
        }
      });

      // Fall into pit gap
      if (ninja.y > canvas.height + 50) {
        hp = 0;
        setScore(currentScore);
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        setGameState("gameover");
        return;
      }

      // Move Buildings
      buildings.forEach((b) => { b.x -= gameSpeed; });

      // Spawn new buildings
      const lastBuilding = buildings[buildings.length - 1];
      if (lastBuilding.x + lastBuilding.width < canvas.width + 200) {
        const w = 160 + Math.random() * 220;
        const h = 80 + Math.random() * 70;
        buildings.push({
          x: lastBuilding.x + lastBuilding.width + 70 + Math.random() * 70,
          width: w,
          height: h,
        });
      }

      // Remove off-screen buildings
      if (buildings[0] && buildings[0].x + buildings[0].width < -100) {
        buildings.shift();
      }

      // Spawn Enemies & Obstacles
      if (frame % Math.max(40, 90 - Math.floor(frame / 100)) === 0) {
        const isShuriken = Math.random() < 0.4;
        if (isShuriken) {
          enemies.push({
            x: canvas.width + 50,
            y: canvas.height - 120 - Math.random() * 50,
            width: 24,
            height: 24,
            type: "shuriken",
            speed: gameSpeed + 3,
          });
        } else {
          const b = buildings.find((b) => b.x > canvas.width - 200);
          const enemyY = b ? canvas.height - b.height - 40 : canvas.height - 120;
          enemies.push({
            x: canvas.width + 50,
            y: enemyY,
            width: 30,
            height: 40,
            type: "ninja",
            speed: gameSpeed,
          });
        }
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x -= e.speed;

        // Katana Slash hit check
        if (ninja.slashing) {
          const slashArea = {
            x: ninja.x,
            y: ninja.y - 10,
            width: ninja.width + 50,
            height: ninja.height + 20,
          };
          if (
            slashArea.x < e.x + e.width &&
            slashArea.x + slashArea.width > e.x &&
            slashArea.y < e.y + e.height &&
            slashArea.y + slashArea.height > e.y
          ) {
            createSlashEffect(e.x, e.y);
            currentScore += 100;
            setScore(currentScore);
            enemies.splice(i, 1);
            continue;
          }
        }

        // Enemy collision with Ninja
        const ninjaBox = {
          x: ninja.x,
          y: ninja.sliding ? ninja.y + 20 : ninja.y,
          width: ninja.width,
          height: ninja.sliding ? 20 : ninja.height,
        };

        if (
          ninjaBox.x < e.x + e.width &&
          ninjaBox.x + ninjaBox.width > e.x &&
          ninjaBox.y < e.y + e.height &&
          ninjaBox.y + ninjaBox.height > e.y
        ) {
          createSlashEffect(ninja.x, ninja.y);
          enemies.splice(i, 1);
          hp--;

          if (hp <= 0) {
            setScore(currentScore);
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
            setGameState("gameover");
            return;
          }
        }

        if (e.x < -60) enemies.splice(i, 1);
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.05;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      // RENDER
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cyber Moon background
      ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
      ctx.beginPath();
      ctx.arc(canvas.width - 150, 120, 80, 0, Math.PI * 2);
      ctx.fill();

      // Draw Buildings
      buildings.forEach((b) => {
        ctx.fillStyle = "#18181b";
        ctx.fillRect(b.x, canvas.height - b.height, b.width, b.height);
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, canvas.height - b.height, b.width, b.height);
      });

      // Draw Enemies
      enemies.forEach((e) => {
        ctx.save();
        if (e.type === "shuriken") {
          ctx.translate(e.x + 12, e.y + 12);
          ctx.rotate(frame * 0.3);
          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(4, -4);
          ctx.lineTo(12, 0);
          ctx.lineTo(4, 4);
          ctx.lineTo(0, 12);
          ctx.lineTo(-4, 4);
          ctx.lineTo(-12, 0);
          ctx.lineTo(-4, -4);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = "#a855f7";
          ctx.fillRect(e.x, e.y, e.width, e.height);
        }
        ctx.restore();
      });

      // Draw Particles
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.restore();
      });

      // Draw Ninja
      ctx.save();
      ctx.fillStyle = "#f43f5e";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#f43f5e";

      if (ninja.sliding) {
        ctx.fillRect(ninja.x, ninja.y + 20, ninja.width + 10, 20);
      } else {
        ctx.fillRect(ninja.x, ninja.y, ninja.width, ninja.height);
      }

      // Katana slash Arc
      if (ninja.slashing) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ninja.x + 30, ninja.y + 15, 35, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`SCORE: ${currentScore}`, 20, 35);
      ctx.fillText(`HEALTH: ${"❤️ ".repeat(hp)}`, 20, 65);
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(`CONTROLS: WASD/Arrows (Jump/Slide) | J/K (Slash)`, 20, 95);

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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h1 className="text-4xl font-extrabold text-rose-500 mb-3 tracking-wider">TURBO NINJA 2</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Dash over neon rooftops, slice enemy ninjas & leap across building gaps!
          </p>
          <p className="text-sm text-zinc-400 mb-6">Space/Up (Jump) | Down (Slide) | J or K (Katana Slash)</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 font-bold rounded-xl shadow-lg transition"
          >
            ENTER THE SHADOWS
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">RUN ENDED</h2>
          <p className="text-2xl font-bold text-rose-500 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 font-bold rounded-xl shadow-lg transition"
          >
            RETRY DASH
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-rose-500/30 rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
