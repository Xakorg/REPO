"use client";

import React, { useEffect, useRef, useState } from "react";

interface Turret {
  lane: number;
  col: number;
  x: number;
  y: number;
  type: "laser" | "slow";
  fireCooldown: number;
}

interface Invader {
  id: number;
  lane: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  slowedTimer: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  lane: number;
  type: "laser" | "slow";
  damage: number;
}

export default function ChronoDefender2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(150);
  const [selectedTurret, setSelectedTurret] = useState<"laser" | "slow">("laser");

  const selectedRef = useRef<"laser" | "slow">("laser");
  selectedRef.current = selectedTurret;

  const startGame = () => {
    setScore(0);
    setEnergy(150);
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
    let currentEnergy = 150;
    let baseHp = 100;
    let invaderIdCount = 0;
    let spawnTimer = 0;
    let energyTimer = 0;

    const GRID_ROWS = 5;
    const GRID_COLS = 8;
    const CELL_W = 80;
    const CELL_H = 90;
    const OFFSET_X = 100;
    const OFFSET_Y = 80;

    let turrets: Turret[] = [];
    let invaders: Invader[] = [];
    let projectiles: Projectile[] = [];

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const col = Math.floor((clickX - OFFSET_X) / CELL_W);
      const lane = Math.floor((clickY - OFFSET_Y) / CELL_H);

      if (col >= 0 && col < GRID_COLS && lane >= 0 && lane < GRID_ROWS) {
        const cost = selectedRef.current === "laser" ? 50 : 75;
        const exists = turrets.some((t) => t.lane === lane && t.col === col);

        if (!exists && currentEnergy >= cost) {
          currentEnergy -= cost;
          setEnergy(currentEnergy);
          turrets.push({
            lane,
            col,
            x: OFFSET_X + col * CELL_W + CELL_W / 2,
            y: OFFSET_Y + lane * CELL_H + CELL_H / 2,
            type: selectedRef.current,
            fireCooldown: 0,
          });
        }
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    const update = () => {
      // Passive energy regen
      energyTimer++;
      if (energyTimer % 60 === 0) {
        currentEnergy = Math.min(300, currentEnergy + 10);
        setEnergy(currentEnergy);
      }

      // Spawn invaders
      spawnTimer++;
      if (spawnTimer % Math.max(30, 120 - Math.floor(currentScore / 50)) === 0) {
        const lane = Math.floor(Math.random() * GRID_ROWS);
        const hp = 30 + Math.floor(currentScore / 10);
        invaders.push({
          id: invaderIdCount++,
          lane,
          x: canvas.width + 20,
          y: OFFSET_Y + lane * CELL_H + CELL_H / 2,
          hp,
          maxHp: hp,
          speed: 1.2,
          slowedTimer: 0,
        });
      }

      // Turrets action
      turrets.forEach((t) => {
        t.fireCooldown++;
        const targetInLane = invaders.some((inv) => inv.lane === t.lane && inv.x > t.x);
        if (targetInLane && t.fireCooldown >= (t.type === "laser" ? 30 : 50)) {
          t.fireCooldown = 0;
          projectiles.push({
            x: t.x + 15,
            y: t.y,
            vx: 8,
            lane: t.lane,
            type: t.type,
            damage: t.type === "laser" ? 15 : 8,
          });
        }
      });

      // Projectiles update
      projectiles.forEach((p) => { p.x += p.vx; });
      projectiles = projectiles.filter((p) => p.x <= canvas.width + 50);

      // Invaders update
      invaders.forEach((inv) => {
        const speed = inv.slowedTimer > 0 ? inv.speed * 0.4 : inv.speed;
        inv.x -= speed;
        if (inv.slowedTimer > 0) inv.slowedTimer--;

        if (inv.x <= OFFSET_X - 20) {
          baseHp -= 20;
          inv.hp = 0;
        }
      });

      // Projectile-Invader collisions
      projectiles.forEach((p) => {
        invaders.forEach((inv) => {
          if (inv.hp > 0 && p.lane === inv.lane && Math.abs(p.x - inv.x) < 20) {
            p.x = 9999;
            inv.hp -= p.damage;
            if (p.type === "slow") inv.slowedTimer = 90;
            if (inv.hp <= 0) {
              currentScore += 25;
              currentEnergy += 15;
              setScore(currentScore);
              setEnergy(currentEnergy);
            }
          }
        });
      });

      invaders = invaders.filter((inv) => inv.hp > 0);

      if (baseHp <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Draw background & grid
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Base line
      ctx.fillStyle = "#ef444433";
      ctx.fillRect(0, 0, OFFSET_X, canvas.height);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(OFFSET_X - 4, 0, 4, canvas.height);

      // Grid lines
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      for (let r = 0; r <= GRID_ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(OFFSET_X, OFFSET_Y + r * CELL_H);
        ctx.lineTo(OFFSET_X + GRID_COLS * CELL_W, OFFSET_Y + r * CELL_H);
        ctx.stroke();
      }
      for (let c = 0; c <= GRID_COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(OFFSET_X + c * CELL_W, OFFSET_Y);
        ctx.lineTo(OFFSET_X + c * CELL_W, OFFSET_Y + GRID_ROWS * CELL_H);
        ctx.stroke();
      }

      // Draw Turrets
      turrets.forEach((t) => {
        ctx.fillStyle = t.type === "laser" ? "#06b6d4" : "#3b82f6";
        ctx.beginPath();
        ctx.arc(t.x, t.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(t.x + 5, t.y - 4, 16, 8);
      });

      // Draw Projectiles
      projectiles.forEach((p) => {
        ctx.fillStyle = p.type === "laser" ? "#22d3ee" : "#60a5fa";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === "laser" ? 5 : 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Invaders
      invaders.forEach((inv) => {
        ctx.fillStyle = inv.slowedTimer > 0 ? "#818cf8" : "#f43f5e";
        ctx.beginPath();
        ctx.arc(inv.x, inv.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = "#3f3f46";
        ctx.fillRect(inv.x - 20, inv.y - 28, 40, 5);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(inv.x - 20, inv.y - 28, (inv.hp / inv.maxHp) * 40, 5);
      });

      // HUD overlay inside canvas
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`Base HP: ${baseHp}%`, 20, 40);
      ctx.fillText(`Score: ${currentScore}`, 200, 40);
      ctx.fillText(`Energy: ⚡${currentEnergy}`, 350, 40);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4 tracking-wider">CHRONO DEFENDER 2</h1>
          <p className="text-zinc-400 mb-2">Place turrets on the grid to defend the temporal base from incoming invaders!</p>
          <p className="text-sm text-zinc-500 mb-6">Click empty grid slots to deploy towers using Chrono Energy</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl shadow-lg transition"
          >
            START DEFENSE
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">TEMPORAL CORE BREACHED</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="mb-3 flex items-center space-x-4">
          <button
            onClick={() => setSelectedTurret("laser")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
              selectedTurret === "laser"
                ? "bg-cyan-500 text-zinc-950 shadow-md"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Laser Turret (⚡50)
          </button>
          <button
            onClick={() => setSelectedTurret("slow")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
              selectedTurret === "slow"
                ? "bg-blue-500 text-zinc-950 shadow-md"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Stasis Turret (⚡75)
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
