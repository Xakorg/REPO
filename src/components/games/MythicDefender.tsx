"use client";

import React, { useEffect, useRef, useState } from "react";

interface Defender {
  lane: number;
  slot: number;
  type: "ARCHER" | "MAGE" | "CANNON";
  cooldown: number;
}

interface Enemy {
  lane: number;
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
}

export default function MythicDefender() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAMEOVER">("START");
  const [gold, setGold] = useState(150);
  const [baseHp, setBaseHp] = useState(100);
  const [score, setScore] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<"ARCHER" | "MAGE" | "CANNON">("ARCHER");

  const stateRef = useRef({
    defenders: [] as Defender[],
    enemies: [] as Enemy[],
    projectiles: [] as { x: number; y: number; targetX: number; targetY: number; lane: number; dmg: number }[],
    gold: 150,
    baseHp: 100,
    score: 0,
    wave: 1,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      defenders: [],
      enemies: [],
      projectiles: [],
      gold: 150,
      baseHp: 100,
      score: 0,
      wave: 1,
      spawnTimer: 0,
    };
    setGold(150);
    setBaseHp(100);
    setScore(0);
    setGameState("PLAYING");
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "PLAYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Determine lane (3 lanes)
    const lane = Math.floor(y / 180);
    const slot = Math.floor(x / 90);

    if (lane < 0 || lane >= 3 || slot < 1 || slot >= 7) return;

    const costs = { ARCHER: 50, MAGE: 80, CANNON: 120 };
    const cost = costs[selectedUnit];

    const s = stateRef.current;
    if (s.gold < cost) return;

    // Check existing
    const exists = s.defenders.some((d) => d.lane === lane && d.slot === slot);
    if (!exists) {
      s.defenders.push({ lane, slot, type: selectedUnit, cooldown: 0 });
      s.gold -= cost;
      setGold(s.gold);
    }
  };

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const s = stateRef.current;

      // Spawn Enemies
      s.spawnTimer++;
      if (s.spawnTimer % Math.max(30, 120 - s.wave * 15) === 0) {
        const lane = Math.floor(Math.random() * 3);
        const hp = 50 + s.wave * 25;
        s.enemies.push({ lane, x: 800, hp, maxHp: hp, speed: 1.2 + s.wave * 0.2 });
      }

      // Defenders Attack
      s.defenders.forEach((d) => {
        d.cooldown++;
        const target = s.enemies.find((e) => e.lane === d.lane && e.x > d.slot * 90);
        if (target) {
          const rate = d.type === "ARCHER" ? 30 : d.type === "MAGE" ? 45 : 60;
          if (d.cooldown >= rate) {
            d.cooldown = 0;
            const dmg = d.type === "ARCHER" ? 20 : d.type === "MAGE" ? 35 : 60;
            s.projectiles.push({
              x: d.slot * 90 + 45,
              y: d.lane * 180 + 90,
              targetX: target.x,
              targetY: d.lane * 180 + 90,
              lane: d.lane,
              dmg,
            });
          }
        }
      });

      // Update Projectiles
      s.projectiles = s.projectiles.filter((p) => {
        p.x += 10;
        const hitEnemy = s.enemies.find((e) => e.lane === p.lane && Math.abs(e.x - p.x) < 15);
        if (hitEnemy) {
          hitEnemy.hp -= p.dmg;
          if (hitEnemy.hp <= 0) {
            s.gold += 25;
            s.score += 100;
            setGold(s.gold);
            setScore(s.score);
          }
          return false;
        }
        return p.x < canvas.width;
      });

      // Filter Enemies
      s.enemies = s.enemies.filter((e) => {
        if (e.hp <= 0) return false;
        e.x -= e.speed;

        // Base damaged
        if (e.x <= 80) {
          s.baseHp = Math.max(0, s.baseHp - 15);
          setBaseHp(s.baseHp);
          return false;
        }
        return true;
      });

      // Base destroyed
      if (s.baseHp <= 0) {
        setGameState("GAMEOVER");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: s.score } }));
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lanes
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#18181b" : "#27272a";
        ctx.fillRect(0, i * 180, canvas.width, 180);
        ctx.strokeStyle = "#3f3f46";
        ctx.strokeRect(0, i * 180, canvas.width, 180);
      }

      // Base Line
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, 0, 80, canvas.height);

      // Defenders
      s.defenders.forEach((d) => {
        ctx.fillStyle = d.type === "ARCHER" ? "#3b82f6" : d.type === "MAGE" ? "#a855f7" : "#eab308";
        ctx.beginPath();
        ctx.arc(d.slot * 90 + 45, d.lane * 180 + 90, 25, 0, Math.PI * 2);
        ctx.fill();
      });

      // Enemies
      s.enemies.forEach((e) => {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(e.x - 20, e.lane * 180 + 70, 40, 40);
        // HP Bar
        ctx.fillStyle = "#374151";
        ctx.fillRect(e.x - 20, e.lane * 180 + 55, 40, 6);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(e.x - 20, e.lane * 180 + 55, (e.hp / e.maxHp) * 40, 6);
      });

      // Projectiles
      ctx.fillStyle = "#60a5fa";
      s.projectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-blue-500 mb-2 uppercase tracking-wider">
        Mythic Defender
      </h1>

      <div className="flex gap-8 mb-4 font-bold text-zinc-300">
        <div>Score: <span className="text-amber-400">{score}</span></div>
        <div>Gold: <span className="text-yellow-400">{gold}g</span></div>
        <div>Base HP: <span className="text-rose-400">{baseHp}%</span></div>
      </div>

      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={540} onClick={handleCanvasClick} className="bg-zinc-950 block cursor-pointer" />

        {gameState === "PLAYING" && (
          <div className="absolute top-4 right-4 flex gap-2 bg-black/70 p-2 rounded-xl border border-zinc-800">
            {(["ARCHER", "MAGE", "CANNON"] as const).map((u) => {
              const costs = { ARCHER: 50, MAGE: 80, CANNON: 120 };
              return (
                <button
                  key={u}
                  onClick={() => setSelectedUnit(u)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase ${
                    selectedUnit === u ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {u} ({costs[u]}g)
                </button>
              );
            })}
          </div>
        )}

        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="text-4xl font-extrabold text-blue-500 uppercase tracking-widest">
              {gameState === "GAMEOVER" ? "Base Overrun" : "Mythic Defender"}
            </h2>
            {gameState === "GAMEOVER" && <p className="text-2xl font-bold">Final Score: {score}</p>}
            <p className="text-sm text-zinc-400">Place defenders on the map to block enemy waves!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {gameState === "GAMEOVER" ? "Try Again" : "Start Defense"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
