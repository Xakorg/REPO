"use client";

import React, { useEffect, useRef, useState } from "react";

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "spike" | "shuriken";
}

interface Target {
  x: number;
  y: number;
  radius: number;
  sliced: boolean;
}

export default function TurboNinja() {
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
    let speed = 7;
    let groundY = canvas.height - 80;

    let ninja = {
      x: 120,
      y: groundY - 40,
      vy: 0,
      width: 30,
      height: 40,
      isGrounded: true,
      isAttacking: false,
      attackCooldown: 0,
    };

    let obstacles: Obstacle[] = [];
    let targets: Target[] = [];
    let frame = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((key === "w" || key === "arrowup" || key === " ") && ninja.isGrounded) {
        ninja.vy = -14;
        ninja.isGrounded = false;
      } else if ((key === "k" || key === "j" || key === "f") && ninja.attackCooldown <= 0) {
        ninja.isAttacking = true;
        ninja.attackCooldown = 15;
      }
    };

    const handleClick = () => {
      if (ninja.isGrounded) {
        ninja.vy = -14;
        ninja.isGrounded = false;
      } else if (ninja.attackCooldown <= 0) {
        ninja.isAttacking = true;
        ninja.attackCooldown = 15;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);

    const update = () => {
      frame++;
      currentScore += 1;
      setScore(currentScore);

      // Ninja physics
      ninja.vy += 0.7; // gravity
      ninja.y += ninja.vy;

      if (ninja.y >= groundY - ninja.height) {
        ninja.y = groundY - ninja.height;
        ninja.vy = 0;
        ninja.isGrounded = true;
      }

      if (ninja.attackCooldown > 0) {
        ninja.attackCooldown--;
        if (ninja.attackCooldown < 8) ninja.isAttacking = false;
      }

      // Spawning
      if (frame % 70 === 0) {
        obstacles.push({
          x: canvas.width + 30,
          y: groundY - 26,
          width: 26,
          height: 26,
          type: Math.random() > 0.5 ? "spike" : "shuriken",
        });
      }

      if (frame % 90 === 0) {
        targets.push({
          x: canvas.width + 40,
          y: groundY - 90 - Math.random() * 60,
          radius: 18,
          sliced: false,
        });
      }

      // Update Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;

        // Collision check with Ninja
        if (
          ninja.x < obs.x + obs.width &&
          ninja.x + ninja.width > obs.x &&
          ninja.y < obs.y + obs.height &&
          ninja.y + ninja.height > obs.y
        ) {
          setScore(currentScore);
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
          setGameState("gameover");
          return;
        }

        if (obs.x < -40) obstacles.splice(i, 1);
      }

      // Update Targets
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        t.x -= speed;

        // Slice check if Ninja is attacking nearby
        if (ninja.isAttacking && !t.sliced) {
          const dist = Math.hypot(ninja.x + 40 - t.x, ninja.y + 20 - t.y);
          if (dist < 60) {
            t.sliced = true;
            currentScore += 100;
            setScore(currentScore);
          }
        }

        if (t.x < -40) targets.splice(i, 1);
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Moon background
      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      ctx.beginPath();
      ctx.arc(canvas.width - 150, 150, 90, 0, Math.PI * 2);
      ctx.fill();

      // Ground
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(0, groundY, canvas.width, 4);

      // Render Obstacles
      obstacles.forEach((obs) => {
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ef4444";

        if (obs.type === "spike") {
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
          ctx.rotate(frame * 0.2);
          ctx.fillRect(-obs.width / 2, -2, obs.width, 4);
          ctx.fillRect(-2, -obs.height / 2, 4, obs.height);
          ctx.restore();
        }
      });

      // Render Targets
      targets.forEach((t) => {
        if (!t.sliced) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#eab308";
          ctx.fillStyle = "#eab308";
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(t.x - 15, t.y - 15);
          ctx.lineTo(t.x + 15, t.y + 15);
          ctx.stroke();
        }
      });

      // Render Ninja
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ef4444";
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(ninja.x, ninja.y, ninja.width, ninja.height);

      // Ninja Blade Slash Effect
      if (ninja.isAttacking) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ninja.x + 30, ninja.y + 15, 35, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("click", handleClick);
    };
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-red-500 mb-4 tracking-wider">TURBO NINJA</h1>
          <p className="text-zinc-400 mb-2">Jump over deadly spikes and slice floating targets mid-air!</p>
          <p className="text-sm text-zinc-500 mb-6">W / Spacebar / Click to Jump | K / J / F to Blade Slice</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            RUN NINJA
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">TRIPPED BY HAZARD</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-red-500/30 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
