"use client";
import React, { useEffect, useRef, useState } from "react";

export default function ElectroRacer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);

  const laneX = [250, 400, 550];
  const carRef = useRef({ lane: 1, y: 480, targetX: 400, currentX: 400 });
  const obstaclesRef = useRef<Array<{ lane: number; y: number; type: "zap" | "battery" }>>([]);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const startGame = () => {
    carRef.current = { lane: 1, y: 480, targetX: 400, currentX: 400 };
    obstaclesRef.current = [];
    setScore(0);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        carRef.current.lane = Math.max(0, carRef.current.lane - 1);
        carRef.current.targetX = laneX[carRef.current.lane];
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        carRef.current.lane = Math.min(2, carRef.current.lane + 1);
        carRef.current.targetX = laneX[carRef.current.lane];
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
    const speed = 7;

    const loop = () => {
      frame++;
      const car = carRef.current;

      // Smooth lane movement
      car.currentX += (car.targetX - car.currentX) * 0.25;

      // Spawn obstacles / batteries
      if (frame % 40 === 0) {
        const lane = Math.floor(Math.random() * 3);
        const isBattery = Math.random() < 0.35;
        obstaclesRef.current.push({
          lane,
          y: -50,
          type: isBattery ? "battery" : "zap",
        });
      }

      // Update & check collisions
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.y += speed;

        const obsX = laneX[obs.lane];
        if (Math.abs(obs.y - car.y) < 35 && Math.abs(obsX - car.currentX) < 40) {
          if (obs.type === "battery") {
            obstaclesRef.current.splice(i, 1);
            setScore((s) => s + 250);
          } else {
            setGameState("GAMEOVER");
            window.dispatchEvent(
              new CustomEvent("xakteir-game-score", {
                detail: { score: scoreRef.current },
              })
            );
          }
        } else if (obs.y > canvas.height + 60) {
          obstaclesRef.current.splice(i, 1);
        }
      }

      // Passive score
      if (frame % 10 === 0) {
        setScore((s) => s + 15);
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lanes line drawing
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      [175, 325, 475, 625].forEach((lx) => {
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -frame * speed;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, canvas.height);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw Obstacles / Batteries
      obstaclesRef.current.forEach((obs) => {
        const x = laneX[obs.lane];
        if (obs.type === "battery") {
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(x - 16, obs.y - 16, 32, 32);
          ctx.fillStyle = "#ffffff";
          ctx.font = "16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡", x, obs.y + 6);
        } else {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(x - 30, obs.y - 10, 60, 20);
          ctx.strokeStyle = "#fca5a5";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 30, obs.y - 10, 60, 20);
        }
      });

      // Draw Electro Car
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath();
      ctx.roundRect(car.currentX - 22, car.y - 35, 44, 70, 8);
      ctx.fill();

      ctx.fillStyle = "#67e8f9";
      ctx.fillRect(car.currentX - 16, car.y - 20, 32, 20);

      // Tail lights glow
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(car.currentX - 18, car.y + 30, 10, 6);
      ctx.fillRect(car.currentX + 8, car.y + 30, 10, 6);

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
            <h1 className="text-4xl font-extrabold tracking-widest text-cyan-400">ELECTRO RACER</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">Left / Right Arrows or A / D to switch lanes! Collect green batteries, avoid red barriers!</p>
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
