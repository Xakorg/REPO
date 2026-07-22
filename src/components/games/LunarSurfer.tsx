"use client";

import React, { useEffect, useRef, useState } from "react";

interface Crater {
  x: number;
  width: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export default function LunarSurfer() {
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
    let groundY = canvas.height - 90;

    let surfer = {
      x: 140,
      y: groundY - 24,
      vy: 0,
      radius: 16,
      isGrounded: true,
      rotation: 0,
    };

    let craters: Crater[] = [];
    let stars: Star[] = [];
    let frame = 0;
    let speed = 6;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "ArrowUp" || e.key.toLowerCase() === "w") && surfer.isGrounded) {
        surfer.vy = -12; // lunar low-gravity jump
        surfer.isGrounded = false;
      }
    };

    const handleClick = () => {
      if (surfer.isGrounded) {
        surfer.vy = -12;
        surfer.isGrounded = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);

    const update = () => {
      frame++;
      currentScore += 1;
      setScore(currentScore);

      // Low gravity physics
      surfer.vy += 0.35;
      surfer.y += surfer.vy;

      if (!surfer.isGrounded) {
        surfer.rotation += 0.08;
      } else {
        surfer.rotation = 0;
      }

      if (surfer.y >= groundY - surfer.radius) {
        surfer.y = groundY - surfer.radius;
        surfer.vy = 0;
        surfer.isGrounded = true;
      }

      // Spawning Craters
      if (frame % 85 === 0) {
        craters.push({
          x: canvas.width + 40,
          width: 50 + Math.random() * 40,
        });
      }

      // Spawning Stars
      if (frame % 60 === 0) {
        stars.push({
          x: canvas.width + 30,
          y: groundY - 70 - Math.random() * 80,
          radius: 12,
          collected: false,
        });
      }

      // Update Craters
      for (let i = craters.length - 1; i >= 0; i--) {
        const c = craters[i];
        c.x -= speed;

        // Check if surfer falls into crater while grounded
        if (
          surfer.isGrounded &&
          surfer.x > c.x &&
          surfer.x < c.x + c.width
        ) {
          setScore(currentScore);
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
          setGameState("gameover");
          return;
        }

        if (c.x + c.width < -50) craters.splice(i, 1);
      }

      // Update Stars
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x -= speed;

        if (!s.collected) {
          const dist = Math.hypot(surfer.x - s.x, surfer.y - s.y);
          if (dist < surfer.radius + s.radius) {
            s.collected = true;
            currentScore += 80;
            setScore(currentScore);
          }
        }

        if (s.x < -30) stars.splice(i, 1);
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield background
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 53 + frame * 0.2) % canvas.width;
        const sy = (i * 29) % (canvas.height - 120);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Earth / Moon in sky
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(680, 100, 45, 0, Math.PI * 2);
      ctx.fill();

      // Ground (Lunar Surface)
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#27272a";
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      // Render Craters (Gaps in surface)
      craters.forEach((c) => {
        ctx.fillStyle = "#09090b";
        ctx.fillRect(c.x, groundY, c.width, canvas.height - groundY);

        ctx.strokeStyle = "#52525b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x + c.width / 2, groundY, c.width / 2, 0, Math.PI);
        ctx.stroke();
      });

      // Surface line
      ctx.strokeStyle = "#71717a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Render Stars
      stars.forEach((s) => {
        if (!s.collected) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#fde047";
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Render Lunar Surfer Pod
      ctx.save();
      ctx.translate(surfer.x, surfer.y);
      ctx.rotate(surfer.rotation);

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#38bdf8";
      ctx.fillStyle = "#38bdf8";

      // Hoverboard
      ctx.fillRect(-22, 10, 44, 6);

      // Surfer figure
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.arc(0, -6, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
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
          <h1 className="text-4xl font-bold text-sky-400 mb-4 tracking-wider">LUNAR SURFER</h1>
          <p className="text-zinc-400 mb-2">Surf across moon dunes, jump over lunar craters, and catch star energy!</p>
          <p className="text-sm text-zinc-500 mb-6">Spacebar / Up Arrow / Click to Low-Gravity Jump</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START SURFING
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">FELL INTO CRATER</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-sky-500/30 rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
