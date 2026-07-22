"use client";
import React, { useEffect, useRef, useState } from "react";

export default function AeroDrift() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);

  const shipRef = useRef({ x: 400, y: 500, vx: 0 });
  const gatesRef = useRef<Array<{ x: number; y: number; width: number; passed: boolean }>>([]);
  const obstaclesRef = useRef<Array<{ x: number; y: number; radius: number }>>([]);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const startGame = () => {
    shipRef.current = { x: 400, y: 500, vx: 0 };
    gatesRef.current = [];
    obstaclesRef.current = [];
    setScore(0);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
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
    const speed = 6;

    const loop = () => {
      frame++;
      const ship = shipRef.current;

      // Steering dynamics
      if (keysRef.current.left) ship.vx -= 0.6;
      if (keysRef.current.right) ship.vx += 0.6;
      ship.vx *= 0.92;
      ship.x += ship.vx;

      // Boundary check
      if (ship.x < 40 || ship.x > canvas.width - 40) {
        setGameState("GAMEOVER");
        window.dispatchEvent(
          new CustomEvent("xakteir-game-score", {
            detail: { score: scoreRef.current },
          })
        );
      }

      // Spawn boost gates
      if (frame % 50 === 0) {
        gatesRef.current.push({
          x: 150 + Math.random() * (canvas.width - 300),
          y: -40,
          width: 120,
          passed: false,
        });
      }

      // Spawn cloud obstacles
      if (frame % 70 === 0) {
        obstaclesRef.current.push({
          x: 80 + Math.random() * (canvas.width - 160),
          y: -40,
          radius: 25 + Math.random() * 15,
        });
      }

      // Update gates
      for (let i = gatesRef.current.length - 1; i >= 0; i--) {
        const g = gatesRef.current[i];
        g.y += speed;

        if (!g.passed && Math.abs(g.y - ship.y) < 20) {
          if (ship.x >= g.x - g.width / 2 && ship.x <= g.x + g.width / 2) {
            g.passed = true;
            setScore((s) => s + 200);
          }
        }

        if (g.y > canvas.height + 40) {
          gatesRef.current.splice(i, 1);
        }
      }

      // Update obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.y += speed;

        const dx = ship.x - obs.x;
        const dy = ship.y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < obs.radius + 15) {
          setGameState("GAMEOVER");
          window.dispatchEvent(
            new CustomEvent("xakteir-game-score", {
              detail: { score: scoreRef.current },
            })
          );
        }

        if (obs.y > canvas.height + 40) {
          obstaclesRef.current.splice(i, 1);
        }
      }

      // Increment score passively for survival
      if (frame % 10 === 0) {
        setScore((s) => s + 10);
      }

      // Draw Screen
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track boundaries
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(30, canvas.height);
      ctx.moveTo(canvas.width - 30, 0);
      ctx.lineTo(canvas.width - 30, canvas.height);
      ctx.stroke();

      // Draw speed lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const lx = 100 + i * 150;
        const ly = (frame * 12 + i * 120) % canvas.height;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly + 40);
        ctx.stroke();
      }

      // Draw Gates
      gatesRef.current.forEach((g) => {
        ctx.strokeStyle = g.passed ? "#10b981" : "#38bdf8";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(g.x - g.width / 2, g.y);
        ctx.lineTo(g.x + g.width / 2, g.y);
        ctx.stroke();
      });

      // Draw Obstacles
      obstaclesRef.current.forEach((obs) => {
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Aero Ship
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate((ship.vx * 0.05));
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(-18, 18);
      ctx.lineTo(0, 10);
      ctx.lineTo(18, 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 text-xl font-bold uppercase tracking-wider">
        <div>Score: <span className="text-cyan-400">{score}</span></div>
      </div>
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="block bg-zinc-950" />
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-cyan-400">AERO DRIFT</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">Controls: A/D or Left/Right Arrow to Drift! Pass green gates & dodge red obstacles!</p>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
