"use client";

import React, { useEffect, useRef, useState } from "react";

interface Ring {
  radius: number;
  angle: number; // in degrees
  targetAngle: number;
  gapSize: number; // angle width in degrees
  color: string;
  speed: number;
}

export default function CyberSpin2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [level, setLevel] = useState(1);

  const selectedRingRef = useRef<number>(0);
  const ringsRef = useRef<Ring[]>([]);
  const scoreRef = useRef<number>(0);
  const timeRef = useRef<number>(45);

  const initLevel = (lvl: number) => {
    const numRings = Math.min(3 + Math.floor(lvl / 2), 5);
    const colors = ["#00f0ff", "#a855f7", "#ec4899", "#3b82f6", "#10b981"];
    const rings: Ring[] = [];

    for (let i = 0; i < numRings; i++) {
      const radius = 60 + i * 45;
      const targetAngle = Math.floor(Math.random() * 4) * 90;
      const gapSize = Math.max(30, 60 - lvl * 3);
      // random initial angle offset from target
      const offset = (Math.floor(Math.random() * 3) + 1) * 90;
      const angle = (targetAngle + offset) % 360;

      rings.push({
        radius,
        angle,
        targetAngle,
        gapSize,
        color: colors[i % colors.length],
        speed: (i % 2 === 0 ? 1 : -1) * (1 + i * 0.5),
      });
    }

    ringsRef.current = rings;
    selectedRingRef.current = 0;
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(45);
    scoreRef.current = 0;
    timeRef.current = 45;
    initLevel(1);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        clearInterval(timer);
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: scoreRef.current } }));
        setGameState("gameover");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      const rings = ringsRef.current;
      const sel = selectedRingRef.current;
      if (!rings[sel]) return;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        selectedRingRef.current = Math.max(0, sel - 1);
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        selectedRingRef.current = Math.min(rings.length - 1, sel + 1);
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        rings[sel].angle = (rings[sel].angle - 45 + 360) % 360;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D" || e.key === " ") {
        rings[sel].angle = (rings[sel].angle + 45) % 360;
      }

      checkAlignment();
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left - canvas.width / 2;
      const clickY = e.clientY - rect.top - canvas.height / 2;
      const dist = Math.hypot(clickX, clickY);

      const rings = ringsRef.current;
      for (let i = 0; i < rings.length; i++) {
        if (Math.abs(dist - rings[i].radius) < 25) {
          selectedRingRef.current = i;
          rings[i].angle = (rings[i].angle + 45) % 360;
          checkAlignment();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);

    const checkAlignment = () => {
      const rings = ringsRef.current;
      const aligned = rings.every((r) => {
        const diff = Math.abs((r.angle % 360) - r.targetAngle);
        return diff < 15 || diff > 345;
      });

      if (aligned) {
        scoreRef.current += 100 + timeRef.current * 5;
        timeRef.current += 10;
        setScore(scoreRef.current);
        setTimeLeft(timeRef.current);
        setLevel((prev) => {
          const next = prev + 1;
          initLevel(next);
          return next;
        });
      }
    };

    const render = () => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const rings = ringsRef.current;

      // Draw outer target beam line
      ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(centerX, 40);
      ctx.lineTo(centerX, canvas.height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center Core
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00f0ff";
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Render Rings
      rings.forEach((ring, idx) => {
        const isSelected = idx === selectedRingRef.current;
        const currentRad = (ring.angle * Math.PI) / 180;

        ctx.shadowBlur = isSelected ? 20 : 10;
        ctx.shadowColor = ring.color;

        // Draw ring arc with gap
        const gapRad = (ring.gapSize * Math.PI) / 180;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = isSelected ? 8 : 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.radius, currentRad + gapRad / 2, currentRad + Math.PI * 2 - gapRad / 2);
        ctx.stroke();

        // Target marker node
        const targetRad = (ring.targetAngle * Math.PI) / 180;
        const tx = centerX + Math.cos(targetRad) * ring.radius;
        const ty = centerY + Math.sin(targetRad) * ring.radius;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(tx, ty, 6, 0, Math.PI * 2);
        ctx.fill();

        // Selection ring halo
        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ring.radius + 12, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      ctx.shadowBlur = 0;

      // Controls instruction text
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Click Ring or use Up/Down to Select, Left/Right or Click to Rotate", centerX, canvas.height - 20);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

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
          <h1 className="text-4xl font-bold text-purple-400 mb-4 tracking-wider">CYBER SPIN 2</h1>
          <p className="text-zinc-400 mb-2">Rotate cyber rings to align the laser gaps with the target nodes!</p>
          <p className="text-sm text-zinc-500 mb-6">Up/Down to switch Ring | Left/Right or Click to Spin</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START ALIGNMENT
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">TIME EXPIRED</h2>
          <p className="text-xl text-zinc-300 mb-1">Final Score: {score}</p>
          <p className="text-sm text-zinc-400 mb-6">Levels Completed: {level - 1}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Top HUD */}
      <div className="w-[800px] max-w-full flex justify-between items-center mb-2 px-4 py-2 bg-zinc-900/80 rounded-lg border border-purple-500/30">
        <span className="font-bold text-purple-400">Level: {level}</span>
        <span className="font-bold text-yellow-400">Time: {timeLeft}s</span>
        <span className="font-bold text-cyan-400">Score: {score}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={540}
        className="border-2 border-purple-500/30 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
