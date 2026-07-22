"use client";

import React, { useEffect, useRef, useState } from "react";

interface Enemy {
  id: number;
  x: number;
  y: number;
  pathIdx: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  color: string;
}

interface Turret {
  id: number;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  type: "laser" | "plasma" | "frost";
  range: number;
  damage: number;
  cooldown: number;
  lastShot: number;
  cost: number;
  color: string;
}

interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetEnemyId: number;
  damage: number;
  color: string;
  speed: number;
}

// Path waypoints on a 800x600 canvas grid
const PATH = [
  { x: 0, y: 150 },
  { x: 250, y: 150 },
  { x: 250, y: 450 },
  { x: 550, y: 450 },
  { x: 550, y: 200 },
  { x: 800, y: 200 },
];

export default function PixelDefender2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [gold, setGold] = useState(150);
  const [baseHp, setBaseHp] = useState(10);
  const [wave, setWave] = useState(1);
  const [selectedType, setSelectedType] = useState<"laser" | "plasma" | "frost">("laser");

  const startGame = () => {
    setScore(0);
    setGold(180);
    setBaseHp(10);
    setWave(1);
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
    let currentGold = 180;
    let currentHp = 10;
    let currentWave = 1;

    let enemies: Enemy[] = [];
    let turrets: Turret[] = [];
    let projectiles: Projectile[] = [];

    let nextEnemyId = 1;
    let frame = 0;
    let enemiesSpawnedInWave = 0;

    const canvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check if spot is occupied
      const existing = turrets.find(
        (t) => Math.hypot(t.x - clickX, t.y - clickY) < 30
      );
      if (existing) return;

      // Don't build directly on the path
      let onPath = false;
      for (let i = 0; i < PATH.length - 1; i++) {
        const p1 = PATH[i];
        const p2 = PATH[i + 1];
        const distToSegment = distanceToSegment({ x: clickX, y: clickY }, p1, p2);
        if (distToSegment < 30) {
          onPath = true;
          break;
        }
      }
      if (onPath) return;

      const costs = { laser: 60, plasma: 100, frost: 80 };
      const cost = costs[selectedType];

      if (currentGold >= cost) {
        currentGold -= cost;
        setGold(currentGold);

        const turretSpecs = {
          laser: { range: 140, damage: 1.5, cooldown: 12, color: "#00f0ff" },
          plasma: { range: 170, damage: 6, cooldown: 35, color: "#f43f5e" },
          frost: { range: 120, damage: 1, cooldown: 25, color: "#a855f7" },
        };

        const spec = turretSpecs[selectedType];
        turrets.push({
          id: Date.now(),
          gridX: Math.floor(clickX / 40),
          gridY: Math.floor(clickY / 40),
          x: clickX,
          y: clickY,
          type: selectedType,
          range: spec.range,
          damage: spec.damage,
          cooldown: spec.cooldown,
          lastShot: 0,
          cost,
          color: spec.color,
        });
      }
    };

    canvas.addEventListener("click", canvasClick);

    const distanceToSegment = (
      p: { x: number; y: number },
      v: { x: number; y: number },
      w: { x: number; y: number }
    ) => {
      const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    };

    const update = () => {
      frame++;

      // Wave Spawner
      const maxPerWave = 10 + currentWave * 4;
      if (enemiesSpawnedInWave < maxPerWave && frame % Math.max(15, 60 - currentWave * 4) === 0) {
        enemiesSpawnedInWave++;
        const isFast = Math.random() < 0.25;
        const isTank = Math.random() < 0.15;

        enemies.push({
          id: nextEnemyId++,
          x: PATH[0].x,
          y: PATH[0].y,
          pathIdx: 0,
          hp: isTank ? 40 + currentWave * 15 : isFast ? 12 + currentWave * 4 : 20 + currentWave * 8,
          maxHp: isTank ? 40 + currentWave * 15 : isFast ? 12 + currentWave * 4 : 20 + currentWave * 8,
          speed: isFast ? 2.6 : isTank ? 1.0 : 1.7,
          reward: isTank ? 25 : isFast ? 12 : 15,
          color: isTank ? "#eab308" : isFast ? "#38bdf8" : "#f43f5e",
        });
      }

      // Next Wave trigger
      if (enemiesSpawnedInWave >= maxPerWave && enemies.length === 0) {
        currentWave++;
        enemiesSpawnedInWave = 0;
        currentGold += 50 + currentWave * 10;
        currentScore += 100 * currentWave;
        setWave(currentWave);
        setGold(currentGold);
        setScore(currentScore);
      }

      // Move Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const targetPoint = PATH[e.pathIdx + 1];

        if (targetPoint) {
          const dx = targetPoint.x - e.x;
          const dy = targetPoint.y - e.y;
          const dist = Math.hypot(dx, dy);

          if (dist < e.speed) {
            e.pathIdx++;
            if (e.pathIdx >= PATH.length - 1) {
              // Reached core
              currentHp -= 1;
              setBaseHp(currentHp);
              enemies.splice(i, 1);

              if (currentHp <= 0) {
                setScore(currentScore);
                window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
                setGameState("gameover");
                return;
              }
            }
          } else {
            e.x += (dx / dist) * e.speed;
            e.y += (dy / dist) * e.speed;
          }
        }
      }

      // Turret Operations
      turrets.forEach((t) => {
        t.lastShot++;
        if (t.lastShot >= t.cooldown) {
          // Find closest enemy in range
          let closest: Enemy | null = null;
          let minDist = t.range;

          enemies.forEach((e) => {
            const d = Math.hypot(e.x - t.x, e.y - t.y);
            if (d < minDist) {
              minDist = d;
              closest = e;
            }
          });

          if (closest) {
            t.lastShot = 0;
            const target: Enemy = closest;
            projectiles.push({
              x: t.x,
              y: t.y,
              targetX: target.x,
              targetY: target.y,
              targetEnemyId: target.id,
              damage: t.damage,
              color: t.color,
              speed: 10,
            });
          }
        }
      });

      // Move Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const enemy = enemies.find((e) => e.id === p.targetEnemyId);

        const destX = enemy ? enemy.x : p.targetX;
        const destY = enemy ? enemy.y : p.targetY;

        const dx = destX - p.x;
        const dy = destY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < p.speed) {
          if (enemy) {
            enemy.hp -= p.damage;
            if (enemy.hp <= 0) {
              currentGold += enemy.reward;
              currentScore += enemy.reward * 2;
              setGold(currentGold);
              setScore(currentScore);
              const eIdx = enemies.indexOf(enemy);
              if (eIdx !== -1) enemies.splice(eIdx, 1);
            }
          }
          projectiles.splice(i, 1);
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
        }
      }

      // RENDER
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Path
      ctx.strokeStyle = "rgba(168, 85, 247, 0.3)";
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw Core Base
      const lastPoint = PATH[PATH.length - 1];
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(lastPoint.x - 20, lastPoint.y, 25, 0, Math.PI * 2);
      ctx.fill();

      // Draw Enemies
      enemies.forEach((e) => {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = "#27272a";
        ctx.fillRect(e.x - 12, e.y - 18, 24, 4);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(e.x - 12, e.y - 18, Math.max(0, (e.hp / e.maxHp) * 24), 4);
      });

      // Draw Turrets
      turrets.forEach((t) => {
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Projectiles
      projectiles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("click", canvasClick);
    };
  }, [gameState, selectedType]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h1 className="text-4xl font-extrabold text-purple-400 mb-3 tracking-wider">PIXEL DEFENDER 2</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Build defense turrets along the path to protect your energy core from invading pixel creeps!
          </p>
          <p className="text-sm text-zinc-400 mb-6">Select a turret type & click on empty ground to build.</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl shadow-lg transition"
          >
            DEPLOY DEFENSES
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">CORE BREACHED</h2>
          <p className="text-xl text-zinc-200 mb-1">Waves Defended: {wave - 1}</p>
          <p className="text-2xl font-bold text-purple-400 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Top HUD */}
      <div className="w-full max-w-[800px] flex justify-between items-center bg-zinc-900/90 px-4 py-2 rounded-t-xl border-t border-x border-zinc-800">
        <div className="flex gap-6">
          <span className="text-sm font-bold text-amber-400">⚡ Gold: {gold}</span>
          <span className="text-sm font-bold text-purple-400">🌊 Wave: {wave}</span>
          <span className="text-sm font-bold text-rose-400">❤️ Core HP: {baseHp}</span>
        </div>
        <div className="flex gap-2">
          {(["laser", "plasma", "frost"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition capitalize ${
                selectedType === type
                  ? "bg-purple-600 text-white ring-2 ring-purple-400"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {type} ({type === "laser" ? 60 : type === "plasma" ? 100 : 80}g)
            </button>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="border-b border-x border-purple-500/30 rounded-b-xl shadow-[0_0_30px_rgba(168,85,247,0.2)] max-w-full object-contain cursor-crosshair"
      />
    </div>
  );
}
