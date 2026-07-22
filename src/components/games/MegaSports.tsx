"use client";

import React, { useEffect, useRef, useState } from "react";

export default function MegaSports() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"START" | "AIMING" | "POWER" | "SHOOTING" | "GAMEOVER">("START");
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<string>("");

  const stateRef = useRef({
    targetX: 400,
    targetDir: 4,
    power: 0,
    powerDir: 3,
    chosenX: 400,
    chosenPower: 0,
    ballY: 520,
    ballX: 400,
    goalX: 400,
    isGoal: false,
    score: 0,
    attempts: 5,
  });

  const startGame = () => {
    stateRef.current = {
      targetX: 400,
      targetDir: 4,
      power: 0,
      powerDir: 3,
      chosenX: 400,
      chosenPower: 0,
      ballY: 520,
      ballX: 400,
      goalX: 300 + Math.random() * 200,
      isGoal: false,
      score: 0,
      attempts: 5,
    };
    setScore(0);
    setAttemptsLeft(5);
    setLastResult("");
    setGameState("AIMING");
  };

  const handleAction = () => {
    const s = stateRef.current;
    if (gameState === "AIMING") {
      s.chosenX = s.targetX;
      setGameState("POWER");
    } else if (gameState === "POWER") {
      s.chosenPower = s.power;
      setGameState("SHOOTING");
      // Calculate shot outcome
      const dist = Math.abs(s.chosenX - s.goalX);
      const powerDiff = Math.abs(s.chosenPower - 75); // ideal power is 75%
      const success = dist < 45 && powerDiff < 25;
      s.isGoal = success;
      if (success) {
        const pts = Math.max(100, 1000 - Math.round(dist * 10 + powerDiff * 10));
        s.score += pts;
        setScore(s.score);
        setLastResult("GOAL! +" + pts + " pts");
      } else {
        setLastResult("MISSED!");
      }

      setTimeout(() => {
        s.attempts--;
        setAttemptsLeft(s.attempts);
        if (s.attempts > 0) {
          s.goalX = 300 + Math.random() * 200;
          s.ballY = 520;
          s.ballX = 400;
          s.power = 0;
          setGameState("AIMING");
        } else {
          setGameState("GAMEOVER");
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: s.score } }));
        }
      }, 1500);
    }
  };

  useEffect(() => {
    if (gameState === "START" || gameState === "GAMEOVER") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const s = stateRef.current;

      // Update Aiming
      if (gameState === "AIMING") {
        s.targetX += s.targetDir;
        if (s.targetX < 200 || s.targetX > 600) s.targetDir *= -1;
      }

      // Update Power
      if (gameState === "POWER") {
        s.power += s.powerDir;
        if (s.power <= 0 || s.power >= 100) s.powerDir *= -1;
      }

      // Update Shooting animation
      if (gameState === "SHOOTING") {
        s.ballY -= 8;
        s.ballX += (s.chosenX - 400) / 40;
      }

      // Render field
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Goal Post
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 8;
      ctx.strokeRect(250, 120, 300, 150);

      // Target Goal Zone
      ctx.fillStyle = "#ef444466";
      ctx.fillRect(s.goalX - 35, 130, 70, 130);

      // Aim Line & Indicator
      if (gameState === "AIMING" || gameState === "POWER") {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(400, 520);
        ctx.lineTo(gameState === "AIMING" ? s.targetX : s.chosenX, 200);
        ctx.stroke();
      }

      // Ball
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(gameState === "SHOOTING" ? s.ballX : 400, gameState === "SHOOTING" ? s.ballY : 520, 14, 0, Math.PI * 2);
      ctx.fill();

      // Power Meter Bar
      if (gameState === "POWER" || gameState === "SHOOTING") {
        ctx.fillStyle = "#18181b";
        ctx.fillRect(50, 200, 30, 200);
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(50, 400 - (s.power / 100) * 200, 30, (s.power / 100) * 200);
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(50, 200, 30, 200);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-emerald-400 mb-2 uppercase tracking-wider">
        Mega Sports Challenge
      </h1>
      <div className="flex gap-8 mb-4 font-bold text-zinc-300">
        <div>Score: <span className="text-amber-400">{score}</span></div>
        <div>Shots Left: <span className="text-emerald-400">{attemptsLeft}</span></div>
        {lastResult && <div className="text-rose-400 font-extrabold">{lastResult}</div>}
      </div>

      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="bg-zinc-950 block" />

        {gameState !== "START" && gameState !== "GAMEOVER" && (
          <button
            onClick={handleAction}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-full font-extrabold uppercase tracking-widest transition shadow-lg"
          >
            {gameState === "AIMING" ? "Lock Aim" : gameState === "POWER" ? "Kick / Shoot!" : "Shooting..."}
          </button>
        )}

        {(gameState === "START" || gameState === "GAMEOVER") && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="text-4xl font-extrabold text-emerald-400 uppercase tracking-widest">
              {gameState === "GAMEOVER" ? "Shootout Finished" : "Mega Sports"}
            </h2>
            {gameState === "GAMEOVER" && <p className="text-2xl font-bold">Total Score: {score}</p>}
            <p className="text-sm text-zinc-400 max-w-sm text-center">
              Lock your aim trajectory, set your power meter, and score maximum goals!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {gameState === "GAMEOVER" ? "Play Again" : "Start Shootout"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
