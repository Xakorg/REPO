"use client";
import React, { useEffect, useRef, useState } from "react";

export default function ChronoDefender() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);
  const [coreHp, setCoreHp] = useState(100);
  const [energy, setEnergy] = useState(50);

  const scoreRef = useRef(0);
  scoreRef.current = score;

  const enemiesRef = useRef<Array<{ x: number; y: number; hp: number; speed: number; maxHp: number }>>([]);
  const pulsesRef = useRef<Array<{ x: number; y: number; radius: number; maxRadius: number }>>([]);

  const startGame = () => {
    enemiesRef.current = [];
    pulsesRef.current = [];
    setScore(0);
    setCoreHp(100);
    setEnergy(50);
    setGameState("PLAYING");
  };

  const triggerPulse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "PLAYING" || energy < 10) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pulsesRef.current.push({ x, y, radius: 10, maxRadius: 75 });
    setEnergy((eng) => Math.max(0, eng - 10));
  };

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const loop = () => {
      // Regenerate energy
      if (Math.random() < 0.1) {
        setEnergy((eng) => Math.min(100, eng + 1));
      }

      // Spawn Enemies from outer edges towards center
      spawnTimer++;
      if (spawnTimer % 40 === 0) {
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = 450;
        enemiesRef.current.push({
          x: centerX + Math.cos(angle) * spawnDist,
          y: centerY + Math.sin(angle) * spawnDist,
          hp: 2,
          maxHp: 2,
          speed: 1.5 + Math.random() * 1.5,
        });
      }

      // Update Pulses
      for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
        const p = pulsesRef.current[i];
        p.radius += 4;
        if (p.radius > p.maxRadius) {
          pulsesRef.current.splice(i, 1);
        }
      }

      // Update Enemies
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];
        const dx = centerX - enemy.x;
        const dy = centerY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 30) {
          enemy.x += (dx / dist) * enemy.speed;
          enemy.y += (dy / dist) * enemy.speed;
        } else {
          // Hit core!
          enemiesRef.current.splice(i, 1);
          setCoreHp((hp) => {
            const next = hp - 10;
            if (next <= 0) {
              setGameState("GAMEOVER");
              window.dispatchEvent(
                new CustomEvent("xakteir-game-score", {
                  detail: { score: scoreRef.current },
                })
              );
            }
            return Math.max(0, next);
          });
          continue;
        }

        // Check pulse collisions
        for (let j = 0; j < pulsesRef.current.length; j++) {
          const p = pulsesRef.current[j];
          const pdx = enemy.x - p.x;
          const pdy = enemy.y - p.y;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy);

          if (pDist <= p.radius + 12) {
            enemy.hp -= 1;
            if (enemy.hp <= 0) {
              enemiesRef.current.splice(i, 1);
              setScore((s) => s + 120);
              break;
            }
          }
        }
      }

      // Draw Screen
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radial grid effect
      ctx.strokeStyle = "rgba(168, 85, 247, 0.1)";
      ctx.lineWidth = 1;
      [100, 200, 300, 400].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Pulses
      pulsesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168, 85, 247, 0.25)";
        ctx.fill();
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Enemies
      enemiesRef.current.forEach((e) => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#f43f5e";
        ctx.fill();
        ctx.strokeStyle = "#fda4af";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Central Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
      ctx.fillStyle = "#8b5cf6";
      ctx.fill();
      ctx.strokeStyle = "#ddd6fe";
      ctx.lineWidth = 4;
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 text-xl font-bold uppercase tracking-wider">
        <div>Score: <span className="text-purple-400">{score}</span></div>
        <div>Core HP: <span className="text-rose-400">{coreHp}%</span></div>
        <div>Energy: <span className="text-yellow-400">{energy}</span></div>
      </div>
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={triggerPulse}
          className="block bg-zinc-950 cursor-crosshair"
        />
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-purple-400">CHRONO DEFENDER</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-purple-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">Controls: Click anywhere to emit Chrono Energy Pulses (Costs 10 Energy)!</p>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-purple-500 hover:bg-purple-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
