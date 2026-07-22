"use client";

import React, { useEffect, useRef, useState } from "react";

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  points: number;
  active: boolean;
}

export default function MasterArcade() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAMEOVER">("START");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const stateRef = useRef({
    paddleX: 350,
    paddleW: 100,
    ballX: 400,
    ballY: 500,
    ballVx: 4,
    ballVy: -5,
    ballRadius: 8,
    bricks: [] as Brick[],
    score: 0,
    lives: 3,
    keys: { ArrowLeft: false, ArrowRight: false },
  });

  const initBricks = (): Brick[] => {
    const bricks: Brick[] = [];
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
    const rows = 5;
    const cols = 8;
    const w = 85;
    const h = 25;
    const padding = 10;
    const offsetLeft = 25;
    const offsetTop = 50;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: offsetLeft + c * (w + padding),
          y: offsetTop + r * (h + padding),
          w,
          h,
          color: colors[r],
          points: (rows - r) * 50,
          active: true,
        });
      }
    }
    return bricks;
  };

  const startGame = () => {
    stateRef.current = {
      paddleX: 350,
      paddleW: 100,
      ballX: 400,
      ballY: 500,
      ballVx: 4 * (Math.random() > 0.5 ? 1 : -1),
      ballVy: -5,
      ballRadius: 8,
      bricks: initBricks(),
      score: 0,
      lives: 3,
      keys: { ArrowLeft: false, ArrowRight: false },
    };
    setScore(0);
    setLives(3);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft") stateRef.current.keys.ArrowLeft = true;
      if (e.code === "ArrowRight") stateRef.current.keys.ArrowRight = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft") stateRef.current.keys.ArrowLeft = false;
      if (e.code === "ArrowRight") stateRef.current.keys.ArrowRight = false;
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

    const render = () => {
      const s = stateRef.current;

      // Paddle move
      if (s.keys.ArrowLeft && s.paddleX > 0) s.paddleX -= 8;
      if (s.keys.ArrowRight && s.paddleX + s.paddleW < canvas.width) s.paddleX += 8;

      // Ball move
      s.ballX += s.ballVx;
      s.ballY += s.ballVy;

      // Wall bounce
      if (s.ballX - s.ballRadius < 0 || s.ballX + s.ballRadius > canvas.width) {
        s.ballVx *= -1;
      }
      if (s.ballY - s.ballRadius < 0) {
        s.ballVy *= -1;
      }

      // Paddle bounce
      if (
        s.ballY + s.ballRadius >= 550 &&
        s.ballY + s.ballRadius <= 565 &&
        s.ballX >= s.paddleX &&
        s.ballX <= s.paddleX + s.paddleW
      ) {
        s.ballVy = -Math.abs(s.ballVy);
        const hitPos = (s.ballX - (s.paddleX + s.paddleW / 2)) / (s.paddleW / 2);
        s.ballVx = hitPos * 7;
      }

      // Ball Out of bottom
      if (s.ballY > canvas.height) {
        s.lives--;
        setLives(s.lives);
        if (s.lives <= 0) {
          setGameState("GAMEOVER");
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: s.score } }));
          return;
        } else {
          s.ballX = 400;
          s.ballY = 500;
          s.ballVx = 4 * (Math.random() > 0.5 ? 1 : -1);
          s.ballVy = -5;
        }
      }

      // Brick Collision
      let activeCount = 0;
      s.bricks.forEach((b) => {
        if (!b.active) return;
        activeCount++;
        if (
          s.ballX + s.ballRadius > b.x &&
          s.ballX - s.ballRadius < b.x + b.w &&
          s.ballY + s.ballRadius > b.y &&
          s.ballY - s.ballRadius < b.y + b.h
        ) {
          b.active = false;
          s.ballVy *= -1;
          s.score += b.points;
          setScore(s.score);
        }
      });

      if (activeCount === 0) {
        setGameState("GAMEOVER");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: s.score + 2000 } }));
        return;
      }

      // Drawing
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Bricks
      s.bricks.forEach((b) => {
        if (b.active) {
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = "#18181b";
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        }
      });

      // Draw Paddle
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(s.paddleX, 550, s.paddleW, 15);

      // Draw Ball
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, s.ballRadius, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-purple-400 mb-2 uppercase tracking-wider">
        Master Arcade
      </h1>
      <div className="flex gap-8 mb-4 font-bold text-zinc-300">
        <div>Score: <span className="text-amber-400">{score}</span></div>
        <div>Lives: <span className="text-rose-400">{"❤️".repeat(lives)}</span></div>
      </div>

      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="bg-zinc-950 block" />

        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="text-4xl font-extrabold text-purple-400 uppercase tracking-widest">
              {gameState === "GAMEOVER" ? "Game Over" : "Master Arcade"}
            </h2>
            {gameState === "GAMEOVER" && <p className="text-2xl font-bold">Score: {score}</p>}
            <p className="text-sm text-zinc-400">Use Left/Right Arrow keys to move the paddle!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {gameState === "GAMEOVER" ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
