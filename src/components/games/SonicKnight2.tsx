"use client";

import React, { useEffect, useRef, useState } from "react";

interface Phantom {
  id: number;
  x: number;
  dir: -1 | 1; // -1 comes from right moving left, 1 comes from left moving right
  speed: number;
  type: "phantom" | "wave";
}

interface ShieldEffect {
  x: number;
  y: number;
  life: number;
}

export default function SonicKnight2() {
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
    let knightHp = 100;
    let facingDir: -1 | 1 = 1; // 1 = right, -1 = left
    let isShielding = false;
    let attackTimer = 0;

    let phantoms: Phantom[] = [];
    let effects: ShieldEffect[] = [];
    let phantomIdCount = 0;
    let spawnTimer = 0;

    const knightX = canvas.width / 2;
    const knightY = canvas.height - 150;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys[key] = true;

      if (key === "a" || key === "arrowleft") facingDir = -1;
      if (key === "d" || key === "arrowright") facingDir = 1;
      if (key === "j" || key === "s" || key === "arrowdown") {
        if (attackTimer <= 0) attackTimer = 15;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      isShielding = keys[" "] || keys["w"] || keys["arrowup"] || keys["space"];

      if (attackTimer > 0) attackTimer--;

      // Spawning
      spawnTimer++;
      if (spawnTimer % Math.max(25, 70 - Math.floor(currentScore / 50)) === 0) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const isWave = Math.random() > 0.4;
        phantoms.push({
          id: phantomIdCount++,
          x: side === 1 ? -30 : canvas.width + 30,
          dir: side,
          speed: isWave ? 4 : 2.5,
          type: isWave ? "wave" : "phantom",
        });
      }

      // Update Phantoms
      phantoms.forEach((p) => {
        p.x += p.dir * p.speed;
      });

      // Attack Collision Check (Wave Strike)
      if (attackTimer > 5) {
        const strikeRange = 90;
        phantoms.forEach((p) => {
          const inFront = (facingDir === 1 && p.x > knightX && p.x < knightX + strikeRange) ||
                          (facingDir === -1 && p.x < knightX && p.x > knightX - strikeRange);

          if (inFront) {
            p.x = -9999;
            currentScore += 20;
            setScore(currentScore);
          }
        });
      }

      // Check collision with Knight
      phantoms.forEach((p) => {
        if (Math.abs(p.x - knightX) < 25) {
          const facingTarget = (facingDir === 1 && p.dir === -1) || (facingDir === -1 && p.dir === 1);

          if (isShielding && facingTarget) {
            // Deflect!
            p.dir *= -1;
            p.speed *= 1.5;
            currentScore += 30;
            setScore(currentScore);
            effects.push({ x: knightX + facingDir * 25, y: knightY, life: 1 });
          } else {
            // Take damage
            knightHp -= p.type === "wave" ? 15 : 20;
            p.x = -9999;
          }
        }
      });

      // Cleanup
      phantoms = phantoms.filter((p) => p.x >= -50 && p.x <= canvas.width + 50);

      // Effects
      effects.forEach((ef) => { ef.life -= 0.1; });
      effects = effects.filter((ef) => ef.life > 0);

      if (knightHp <= 0) {
        setGameState("gameover");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Arena Floor
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(0, knightY + 30, canvas.width, canvas.height - (knightY + 30));
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(0, knightY + 30, canvas.width, 4);

      // Effects
      effects.forEach((ef) => {
        ctx.globalAlpha = ef.life;
        ctx.fillStyle = "#818cf8";
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 35 * (1 - ef.life + 0.5), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Phantoms / Wave projectiles
      phantoms.forEach((p) => {
        if (p.type === "wave") {
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.arc(p.x, knightY, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowColor = "#a855f7"; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = "#ec4899";
          ctx.beginPath();
          ctx.arc(p.x, knightY - 5, 20, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Sonic Knight
      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.arc(knightX, knightY, 22, 0, Math.PI * 2);
      ctx.fill();

      // Visor / Eyes
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(knightX + (facingDir === 1 ? 4 : -16), knightY - 6, 12, 5);

      // Shield Aura
      if (isShielding) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 5;
        ctx.beginPath();
        const startAngle = facingDir === 1 ? -Math.PI / 2 : Math.PI / 2;
        const endAngle = facingDir === 1 ? Math.PI / 2 : (3 * Math.PI) / 2;
        ctx.arc(knightX, knightY, 34, startAngle, endAngle);
        ctx.stroke();
      }

      // Attack Wave Arc
      if (attackTimer > 0) {
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(knightX + facingDir * 40, knightY, 40, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      // Knight HP Bar
      ctx.fillText(`Knight Health`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 150, 12);
      ctx.fillStyle = knightHp > 30 ? "#6366f1" : "#ef4444";
      ctx.fillRect(20, 75, (knightHp / 100) * 150, 12);

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
          <h1 className="text-4xl font-bold text-indigo-400 mb-4 tracking-wider">SONIC KNIGHT 2</h1>
          <p className="text-zinc-400 mb-2">Deflect sound waves with your Kinetic Shield and slash incoming phantoms!</p>
          <p className="text-sm text-zinc-500 mb-6">A / D or Left / Right Arrow to Turn | Space or Up Arrow to Shield | J / S / Down Arrow to Slash</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            ENTER ARENA
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">KNIGHT FALLEN</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-indigo-500/30 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
