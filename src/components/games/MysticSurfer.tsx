"use client";
import React, { useEffect, useRef, useState } from "react";

export default function MysticSurfer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);

  const surferRef = useRef({ x: 200, y: 300, vy: 0, vx: 0 });
  const vortexesRef = useRef<Array<{ x: number; y: number; radius: number }>>([]);
  const starsRef = useRef<Array<{ x: number; y: number; radius: number }>>([]);
  const keysRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const scoreRef = useRef(0);
  scoreRef.current = score;

  const startGame = () => {
    surferRef.current = { x: 200, y: 300, vy: 0, vx: 0 };
    vortexesRef.current = [];
    starsRef.current = [];
    setScore(0);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keysRef.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keysRef.current.down = true;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keysRef.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keysRef.current.down = false;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
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

    const loop = () => {
      frame++;
      const s = surferRef.current;

      if (keysRef.current.up) s.vy -= 0.5;
      if (keysRef.current.down) s.vy += 0.5;
      if (keysRef.current.left) s.vx -= 0.5;
      if (keysRef.current.right) s.vx += 0.5;

      s.vx *= 0.92;
      s.vy *= 0.92;
      s.x += s.vx;
      s.y += s.vy;

      // Clamp within canvas boundaries
      s.x = Math.max(40, Math.min(canvas.width - 40, s.x));
      s.y = Math.max(40, Math.min(canvas.height - 40, s.y));

      // Spawn Astral Vortexes
      if (frame % 45 === 0) {
        vortexesRef.current.push({
          x: canvas.width + 40,
          y: 60 + Math.random() * (canvas.height - 120),
          radius: 22 + Math.random() * 12,
        });
      }

      // Spawn Mystical Stars
      if (frame % 60 === 0) {
        starsRef.current.push({
          x: canvas.width + 40,
          y: 40 + Math.random() * (canvas.height - 80),
          radius: 12,
        });
      }

      // Update Vortexes & collision
      for (let i = vortexesRef.current.length - 1; i >= 0; i--) {
        const v = vortexesRef.current[i];
        v.x -= 6;

        const dx = s.x - v.x;
        const dy = s.y - v.y;
        if (Math.sqrt(dx * dx + dy * dy) < v.radius + 15) {
          setGameState("GAMEOVER");
          window.dispatchEvent(
            new CustomEvent("xakteir-game-score", {
              detail: { score: scoreRef.current },
            })
          );
        } else if (v.x < -50) {
          vortexesRef.current.splice(i, 1);
        }
      }

      // Update Stars & collection
      for (let i = starsRef.current.length - 1; i >= 0; i--) {
        const star = starsRef.current[i];
        star.x -= 6;

        const dx = s.x - star.x;
        const dy = s.y - star.y;
        if (Math.sqrt(dx * dx + dy * dy) < star.radius + 15) {
          starsRef.current.splice(i, 1);
          setScore((sc) => sc + 150);
        } else if (star.x < -50) {
          starsRef.current.splice(i, 1);
        }
      }

      // Passive score increase
      if (frame % 10 === 0) {
        setScore((sc) => sc + 10);
      }

      // Draw Cosmic Ocean
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Wave lines animation
      ctx.strokeStyle = "rgba(192, 132, 252, 0.15)";
      ctx.lineWidth = 3;
      for (let y = 50; y < canvas.height; y += 80) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 20) {
          const waveY = y + Math.sin((x + frame * 8) * 0.02) * 15;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }

      // Draw Mystical Stars
      starsRef.current.forEach((star) => {
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fef08a";
        ctx.stroke();
      });

      // Draw Vortexes
      vortexesRef.current.forEach((v) => {
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e9d5ff";
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Draw Surfer and Surfboard
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.vy * 0.05);

      // Surfboard
      ctx.fillStyle = "#ec4899";
      ctx.beginPath();
      ctx.ellipse(0, 10, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Surfer Body
      ctx.fillStyle = "#f472b6";
      ctx.fillRect(-6, -20, 12, 24);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 text-xl font-bold uppercase tracking-wider">
        <div>Score: <span className="text-pink-400">{score}</span></div>
      </div>
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="block bg-zinc-950" />
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-pink-400">MYSTIC SURFER</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-pink-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">WASD / Arrow keys to Surf! Collect glowing stars & dodge purple vortexes!</p>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-pink-500 hover:bg-pink-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
