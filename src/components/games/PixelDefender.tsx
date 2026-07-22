"use client";

import React, { useEffect, useRef, useState } from "react";

interface Creep {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  radius: number;
  color: string;
}

interface Turret {
  x: number;
  y: number;
  range: number;
  cooldown: number;
  maxCooldown: number;
  damage: number;
}

interface Projectile {
  x: number;
  y: number;
  tx: number;
  ty: number;
  targetId: number;
  speed: number;
  damage: number;
}

export default function PixelDefender() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [gold, setGold] = useState(100);
  const [baseHp, setBaseHp] = useState(10);

  const startGame = () => {
    setScore(0);
    setGold(100);
    setBaseHp(10);
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
    let currentGold = 120;
    let currentHp = 10;
    let frame = 0;
    let creepIdCounter = 1;

    let creeps: Creep[] = [];
    let turrets: Turret[] = [];
    let projectiles: Projectile[] = [];

    // Pre-set turret placement spots (grid nodes)
    const spots = [
      { x: 180, y: 150 },
      { x: 340, y: 150 },
      { x: 500, y: 150 },
      { x: 660, y: 150 },
      { x: 180, y: 350 },
      { x: 340, y: 350 },
      { x: 500, y: 350 },
      { x: 660, y: 350 },
    ];

    // Path waypoints
    const waypoints = [
      { x: 50, y: 240 },
      { x: 750, y: 240 },
      { x: 750, y: 480 },
      { x: 50, y: 480 },
    ];

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Check click on placement spots
      spots.forEach((spot) => {
        const dist = Math.hypot(spot.x - mx, spot.y - my);
        if (dist < 28) {
          const hasTurret = turrets.some((t) => t.x === spot.x && t.y === spot.y);
          if (!hasTurret && currentGold >= 40) {
            currentGold -= 40;
            setGold(currentGold);
            turrets.push({
              x: spot.x,
              y: spot.y,
              range: 150,
              cooldown: 0,
              maxCooldown: 25,
              damage: 15,
            });
          }
        }
      });
    };

    canvas.addEventListener("click", handleClick);

    const spawnCreep = () => {
      const types = [
        { hp: 30, speed: 2, reward: 10, color: "#22c55e", radius: 10 },
        { hp: 60, speed: 1.4, reward: 18, color: "#3b82f6", radius: 12 },
        { hp: 120, speed: 1, reward: 30, color: "#a855f7", radius: 16 },
      ];
      const tier = Math.min(2, Math.floor(frame / 600));
      const type = types[Math.floor(Math.random() * (tier + 1))];

      creeps.push({
        id: creepIdCounter++,
        x: waypoints[0].x,
        y: waypoints[0].y,
        hp: type.hp,
        maxHp: type.hp,
        speed: type.speed,
        reward: type.reward,
        radius: type.radius,
        color: type.color,
      });
    };

    const update = () => {
      frame++;

      if (frame % 45 === 0) {
        spawnCreep();
      }

      // Update Turrets & Shoot
      turrets.forEach((t) => {
        if (t.cooldown > 0) {
          t.cooldown--;
        } else {
          // Find nearest target
          let nearest: Creep | null = null;
          let minDistance = t.range;
          creeps.forEach((c) => {
            const d = Math.hypot(c.x - t.x, c.y - t.y);
            if (d < minDistance) {
              minDistance = d;
              nearest = c;
            }
          });

          if (nearest) {
            const n: Creep = nearest;
            projectiles.push({
              x: t.x,
              y: t.y,
              tx: n.x,
              ty: n.y,
              targetId: n.id,
              speed: 8,
              damage: t.damage,
            });
            t.cooldown = t.maxCooldown;
          }
        }
      });

      // Update Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const target = creeps.find((c) => c.id === p.targetId);
        if (!target) {
          projectiles.splice(i, 1);
          continue;
        }

        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 8) {
          target.hp -= p.damage;
          if (target.hp <= 0) {
            currentGold += target.reward;
            currentScore += target.reward * 2;
            setGold(currentGold);
            setScore(currentScore);
            creeps = creeps.filter((c) => c.id !== target.id);
          }
          projectiles.splice(i, 1);
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
        }
      }

      // Update Creeps movement along path
      for (let i = creeps.length - 1; i >= 0; i--) {
        const c = creeps[i];

        // determine target waypoint
        let targetWP = waypoints[1];
        if (c.x >= waypoints[1].x - 5 && c.y < waypoints[2].y) {
          targetWP = waypoints[2];
        }
        if (c.y >= waypoints[2].y - 5) {
          targetWP = waypoints[3];
        }

        const dx = targetWP.x - c.x;
        const dy = targetWP.y - c.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 5) {
          if (targetWP === waypoints[3]) {
            // Reached base
            creeps.splice(i, 1);
            currentHp -= 1;
            setBaseHp(currentHp);

            if (currentHp <= 0) {
              setScore(currentScore);
              window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
              setGameState("gameover");
              return;
            }
            continue;
          }
        } else {
          c.x += (dx / dist) * c.speed;
          c.y += (dy / dist) * c.speed;
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Path
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
      }
      ctx.stroke();

      // Base icon
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(waypoints[3].x, waypoints[3].y, 22, 0, Math.PI * 2);
      ctx.fill();

      // Render Placement Spots
      spots.forEach((spot) => {
        const hasTurret = turrets.some((t) => t.x === spot.x && t.y === spot.y);
        ctx.fillStyle = hasTurret ? "#1e293b" : "#3f3f46";
        ctx.strokeStyle = currentGold >= 40 && !hasTurret ? "#eab308" : "#52525b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!hasTurret) {
          ctx.fillStyle = "#eab308";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("40G", spot.x, spot.y + 4);
        }
      });

      // Render Turrets
      turrets.forEach((t) => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#eab308";
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Render Creeps
      creeps.forEach((c) => {
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = "#18181b";
        ctx.fillRect(c.x - 12, c.y - c.radius - 8, 24, 4);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(c.x - 12, c.y - c.radius - 8, (c.hp / c.maxHp) * 24, 4);
      });

      // Render Projectiles
      ctx.fillStyle = "#f97316";
      projectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // HUD overlay inside canvas
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Gold: ${currentGold} G`, 20, 35);
      ctx.fillText(`Base HP: ${currentHp}`, 20, 60);
      ctx.fillText(`Score: ${currentScore}`, 20, 85);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("click", handleClick);
    };
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4 tracking-wider">PIXEL DEFENDER</h1>
          <p className="text-zinc-400 mb-2">Build energy turrets to stop invading pixel creeps before they reach base!</p>
          <p className="text-sm text-zinc-500 mb-6">Click yellow circular slots (40 Gold each) to place Turrets</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START DEFENSE
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">BASE OVERRUN</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-yellow-500/30 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
