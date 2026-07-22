"use client";
import React, { useEffect, useRef, useState } from "react";

export default function SonicKnight() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);

  const knightRef = useRef({ x: 400, y: 460, vy: 0, grounded: true, shieldActive: false });
  const wavesRef = useRef<Array<{ x: number; y: number; vx: number; radius: number }>>([]);
  const gemsRef = useRef<Array<{ x: number; y: number; radius: number }>>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean; shield: boolean }>({
    left: false,
    right: false,
    jump: false,
    shield: false,
  });

  const scoreRef = useRef(0);
  scoreRef.current = score;

  const startGame = () => {
    knightRef.current = { x: 400, y: 460, vy: 0, grounded: true, shieldActive: false };
    wavesRef.current = [];
    gemsRef.current = [];
    setScore(0);
    setHp(3);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        if (knightRef.current.grounded) {
          knightRef.current.vy = -13;
          knightRef.current.grounded = false;
        }
      }
      if (e.key === "Shift" || e.key === "s" || e.key === "S") keysRef.current.shield = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
      if (e.key === "Shift" || e.key === "s" || e.key === "S") keysRef.current.shield = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    const groundY = 480;

    const loop = () => {
      frame++;
      const knight = knightRef.current;

      // Left/Right Movement
      if (keysRef.current.left) knight.x = Math.max(30, knight.x - 6);
      if (keysRef.current.right) knight.x = Math.min(canvas.width - 30, knight.x + 6);
      knight.shieldActive = keysRef.current.shield;

      // Gravity & Jumping
      knight.y += knight.vy;
      knight.vy += 0.65;
      if (knight.y >= groundY - 24) {
        knight.y = groundY - 24;
        knight.vy = 0;
        knight.grounded = true;
      }

      // Spawn Sonic Waves from left or right
      if (frame % 55 === 0) {
        const fromLeft = Math.random() > 0.5;
        wavesRef.current.push({
          x: fromLeft ? -20 : canvas.width + 20,
          y: Math.random() > 0.4 ? groundY - 25 : groundY - 75,
          vx: fromLeft ? 4.5 + Math.random() * 2 : -(4.5 + Math.random() * 2),
          radius: 18,
        });
      }

      // Spawn Sonic Gems
      if (frame % 90 === 0) {
        gemsRef.current.push({
          x: 60 + Math.random() * (canvas.width - 120),
          y: groundY - 120 - Math.random() * 80,
          radius: 12,
        });
      }

      // Update Waves & Collision
      for (let i = wavesRef.current.length - 1; i >= 0; i--) {
        const w = wavesRef.current[i];
        w.x += w.vx;

        const dx = knight.x - w.x;
        const dy = knight.y - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < w.radius + 18) {
          if (knight.shieldActive) {
            // Deflected wave
            wavesRef.current.splice(i, 1);
            setScore((s) => s + 100);
          } else {
            // Hit knight
            wavesRef.current.splice(i, 1);
            setHp((h) => {
              const next = h - 1;
              if (next <= 0) {
                setGameState("GAMEOVER");
                window.dispatchEvent(
                  new CustomEvent("xakteir-game-score", {
                    detail: { score: scoreRef.current },
                  })
                );
              }
              return next;
            });
          }
        } else if (w.x < -40 || w.x > canvas.width + 40) {
          wavesRef.current.splice(i, 1);
        }
      }

      // Update Gems
      for (let i = gemsRef.current.length - 1; i >= 0; i--) {
        const g = gemsRef.current[i];
        const dx = knight.x - g.x;
        const dy = knight.y - g.y;

        if (Math.sqrt(dx * dx + dy * dy) < g.radius + 18) {
          gemsRef.current.splice(i, 1);
          setScore((s) => s + 200);
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor
      ctx.fillStyle = "#3f3f46";
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.fillStyle = "#a1a1aa";
      ctx.fillRect(0, groundY, canvas.width, 6);

      // Draw Gems
      gemsRef.current.forEach((g) => {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e0f2fe";
        ctx.stroke();
      });

      // Draw Sonic Waves
      wavesRef.current.forEach((w) => {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Knight
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(knight.x - 14, knight.y - 20, 28, 40);

      // Helmet visor
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(knight.x - 8, knight.y - 14, 16, 6);

      // Shield active effect
      if (knight.shieldActive) {
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(knight.x, knight.y, 32, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 text-xl font-bold uppercase tracking-wider">
        <div>Score: <span className="text-sky-400">{score}</span></div>
        <div>HP: <span className="text-red-400">{"❤️".repeat(hp)}</span></div>
      </div>
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="block bg-zinc-950" />
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-sky-400">SONIC KNIGHT</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-sky-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">A/D or Arrows to Move, Up/Space to Jump, Hold Shift / S for Sonic Shield!</p>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
