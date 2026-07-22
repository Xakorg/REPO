"use client";
import React, { useEffect, useRef, useState } from "react";

export default function TerraNinja() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);

  const ninjaRef = useRef({ x: 120, y: 460, vy: 0, grounded: true, slashing: false, slashTimer: 0 });
  const obstaclesRef = useRef<Array<{ x: number; y: number; width: number; height: number; type: "spike" | "monster" }>>([]);
  const keysRef = useRef<{ jump: boolean; slash: boolean }>({ jump: false, slash: false });
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const startGame = () => {
    ninjaRef.current = { x: 120, y: 460, vy: 0, grounded: true, slashing: false, slashTimer: 0 };
    obstaclesRef.current = [];
    setScore(0);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        if (ninjaRef.current.grounded) {
          ninjaRef.current.vy = -14;
          ninjaRef.current.grounded = false;
        }
      }
      if (e.key === "f" || e.key === "F" || e.key === "z" || e.key === "Z" || e.key === "Enter") {
        ninjaRef.current.slashing = true;
        ninjaRef.current.slashTimer = 12;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      const ninja = ninjaRef.current;

      // Gravity & Jumping
      ninja.y += ninja.vy;
      ninja.vy += 0.7;

      if (ninja.y >= groundY - 24) {
        ninja.y = groundY - 24;
        ninja.vy = 0;
        ninja.grounded = true;
      }

      if (ninja.slashing) {
        ninja.slashTimer--;
        if (ninja.slashTimer <= 0) {
          ninja.slashing = false;
        }
      }

      // Spawn Obstacles & Monsters
      if (frame % 70 === 0) {
        const isMonster = Math.random() > 0.5;
        obstaclesRef.current.push({
          x: canvas.width + 40,
          y: isMonster ? groundY - 50 : groundY - 30,
          width: isMonster ? 32 : 24,
          height: isMonster ? 32 : 30,
          type: isMonster ? "monster" : "spike",
        });
      }

      // Move obstacles & collision
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= 6;

        // NinjaSlash hit monster
        if (obs.type === "monster" && ninja.slashing && Math.abs(obs.x - ninja.x) < 70) {
          obstaclesRef.current.splice(i, 1);
          setScore((s) => s + 150);
          continue;
        }

        // Collision with ninja
        const dx = Math.abs(obs.x - ninja.x);
        const dy = Math.abs(obs.y - ninja.y);

        if (dx < obs.width / 2 + 12 && dy < obs.height / 2 + 18) {
          setGameState("GAMEOVER");
          window.dispatchEvent(
            new CustomEvent("xakteir-game-score", {
              detail: { score: scoreRef.current },
            })
          );
        }

        if (obs.x < -40) {
          obstaclesRef.current.splice(i, 1);
        }
      }

      // Score increment
      if (frame % 8 === 0) {
        setScore((s) => s + 10);
      }

      // Draw
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Ground
      ctx.fillStyle = "#78350f";
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, groundY, canvas.width, 8);

      // Draw Obstacles
      obstaclesRef.current.forEach((obs) => {
        if (obs.type === "spike") {
          ctx.fillStyle = "#b45309";
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y - obs.height / 2);
          ctx.lineTo(obs.x - obs.width / 2, obs.y + obs.height / 2);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = "#a855f7";
          ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
          ctx.strokeStyle = "#c084fc";
          ctx.strokeRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
        }
      });

      // Draw Ninja
      ctx.fillStyle = "#18181b";
      ctx.fillRect(ninja.x - 12, ninja.y - 20, 24, 40);
      ctx.fillStyle = "#ef4444"; // Red headband
      ctx.fillRect(ninja.x - 14, ninja.y - 18, 28, 6);

      // Slash arc effect
      if (ninja.slashing) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ninja.x + 20, ninja.y - 5, 36, -Math.PI / 3, Math.PI / 3);
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
        <div>Score: <span className="text-emerald-400">{score}</span></div>
      </div>
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="block bg-zinc-950" />
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-emerald-400">TERRA NINJA</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-emerald-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">Up Arrow / W / Space to Jump, F / Enter to Slash Shadow Monsters!</p>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
