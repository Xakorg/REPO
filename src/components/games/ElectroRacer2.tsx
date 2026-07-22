"use client";

import React, { useEffect, useRef, useState } from "react";

interface Item {
  lane: number;
  y: number;
  type: "orb" | "hazard";
}

export default function ElectroRacer2() {
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
    let battery = 100;
    let lane = 1; // 0, 1, 2
    let speed = 7;

    const laneX = [250, 400, 550];

    let items: Item[] = [];
    let spawnTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((key === "a" || key === "arrowleft") && lane > 0) lane--;
      if ((key === "d" || key === "arrowright") && lane < 2) lane++;
    };

    window.addEventListener("keydown", handleKeyDown);

    const update = () => {
      speed = 7 + Math.min(8, currentScore / 100);
      battery -= 0.08;

      // Spawn items
      spawnTimer++;
      if (spawnTimer % 35 === 0) {
        const itemLane = Math.floor(Math.random() * 3);
        const isOrb = Math.random() > 0.45;
        items.push({
          lane: itemLane,
          y: -40,
          type: isOrb ? "orb" : "hazard",
        });
      }

      // Move items
      items.forEach((it) => { it.y += speed; });

      // Player Y
      const playerY = canvas.height - 110;

      // Item Collision
      items.forEach((it, idx) => {
        if (it.lane === lane && Math.abs(it.y - playerY) < 35) {
          if (it.type === "orb") {
            currentScore += 50;
            battery = Math.min(100, battery + 15);
            setScore(currentScore);
          } else {
            battery -= 25;
          }
          items.splice(idx, 1);
        }
      });

      // Filter offscreen
      items = items.filter((it) => it.y < canvas.height + 50);

      currentScore += 1;
      setScore(currentScore);

      if (battery <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track area
      ctx.fillStyle = "#18181b";
      ctx.fillRect(175, 0, 450, canvas.height);

      // Lane dividers (Electric lines)
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.setLineDash([25, 20]);
      ctx.lineDashOffset = -spawnTimer * speed;

      ctx.beginPath();
      ctx.moveTo(325, 0); ctx.lineTo(325, canvas.height);
      ctx.moveTo(475, 0); ctx.lineTo(475, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Borders
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(170, 0, 5, canvas.height);
      ctx.fillRect(625, 0, 5, canvas.height);

      // Items
      items.forEach((it) => {
        const ix = laneX[it.lane];
        if (it.type === "orb") {
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(ix, it.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowColor = "#facc15"; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(ix - 25, it.y - 10, 50, 20);
          ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 12; ctx.fillRect(ix - 25, it.y - 10, 50, 20); ctx.shadowBlur = 0;
        }
      });

      // Electro Car
      const px = laneX[lane];
      ctx.fillStyle = "#0284c7";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.fillRect(px - 20, playerY - 30, 40, 60);
      ctx.shadowBlur = 0;

      // Car Windshield & Lights
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(px - 14, playerY - 15, 28, 15);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(px - 16, playerY - 28, 8, 4);
      ctx.fillRect(px + 8, playerY - 28, 8, 4);

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      // Battery Bar
      ctx.fillText(`Electro Battery`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 140, 12);
      ctx.fillStyle = battery > 30 ? "#38bdf8" : "#ef4444";
      ctx.fillRect(20, 75, (battery / 100) * 140, 12);

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
          <h1 className="text-4xl font-bold text-sky-400 mb-4 tracking-wider">ELECTRO RACER 2</h1>
          <p className="text-zinc-400 mb-2">Switch lanes to collect Electro-Orbs and dodge high-voltage laser barriers!</p>
          <p className="text-sm text-zinc-500 mb-6">A / D or Left / Right Arrow to change lanes</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl shadow-lg transition"
          >
            START RACE
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">BATTERY DEPLETED</h2>
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
        className="border-2 border-sky-500/30 rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
