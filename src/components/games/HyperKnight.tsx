"use client";

import React, { useEffect, useRef, useState } from "react";

interface Enemy {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
}

interface Slash {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export default function HyperKnight() {
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
    let knightHp = 100;

    let knight = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 20,
      speed: 5,
      attackCooldown: 0,
    };

    let enemies: Enemy[] = [];
    let slashes: Slash[] = [];
    let frame = 0;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      frame++;
      if (knight.attackCooldown > 0) knight.attackCooldown--;

      // Movement
      if ((keys["a"] || keys["arrowleft"]) && knight.x > knight.radius + 10) knight.x -= knight.speed;
      if ((keys["d"] || keys["arrowright"]) && knight.x < canvas.width - knight.radius - 10) knight.x += knight.speed;
      if ((keys["w"] || keys["arrowup"]) && knight.y > knight.radius + 10) knight.y -= knight.speed;
      if ((keys["s"] || keys["arrowdown"]) && knight.y < canvas.height - knight.radius - 10) knight.y += knight.speed;

      // Attack
      if ((keys[" "] || keys["space"] || keys["k"] || keys["j"]) && knight.attackCooldown <= 0) {
        slashes.push({
          x: knight.x,
          y: knight.y,
          radius: 70,
          alpha: 1,
        });
        knight.attackCooldown = 18;
      }

      // Spawn Enemies from edges
      if (frame % 35 === 0) {
        const side = Math.floor(Math.random() * 4);
        let ex = 0, ey = 0;
        if (side === 0) { ex = Math.random() * canvas.width; ey = -20; }
        else if (side === 1) { ex = canvas.width + 20; ey = Math.random() * canvas.height; }
        else if (side === 2) { ex = Math.random() * canvas.width; ey = canvas.height + 20; }
        else { ex = -20; ey = Math.random() * canvas.height; }

        enemies.push({
          x: ex,
          y: ey,
          radius: 16,
          speed: 1.8 + Math.random() * 1.5,
          hp: 1,
        });
      }

      // Update Slashes
      for (let i = slashes.length - 1; i >= 0; i--) {
        const s = slashes[i];
        s.alpha -= 0.08;

        // Check enemies inside slash
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          const dist = Math.hypot(s.x - e.x, s.y - e.y);
          if (dist < s.radius + e.radius) {
            enemies.splice(j, 1);
            currentScore += 25;
            setScore(currentScore);
          }
        }

        if (s.alpha <= 0) slashes.splice(i, 1);
      }

      // Update Enemies moving towards Knight
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const dx = knight.x - e.x;
        const dy = knight.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist < knight.radius + e.radius) {
          knightHp -= 15;
          enemies.splice(j, 1);
          if (knightHp <= 0) {
            setScore(currentScore);
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: currentScore } }));
            setGameState("gameover");
            return;
          }
        } else {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Arena tile pattern
      ctx.strokeStyle = "rgba(234, 179, 8, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Render Slashes (Golden Energy Swings)
      slashes.forEach((s) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#eab308";
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Render Enemies (Red Goblins)
      enemies.forEach((e) => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ef4444";
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Knight (Gold Shield Knight)
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#eab308";
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(knight.x, knight.y, knight.radius, 0, Math.PI * 2);
      ctx.fill();

      // Knight Crest/Sword symbol
      ctx.fillStyle = "#18181b";
      ctx.fillRect(knight.x - 3, knight.y - 12, 6, 24);
      ctx.fillRect(knight.x - 10, knight.y - 4, 20, 5);

      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Score: ${currentScore}`, 20, 35);

      ctx.fillText(`Knight Health`, 20, 65);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(20, 75, 150, 12);
      ctx.fillStyle = knightHp > 30 ? "#eab308" : "#ef4444";
      ctx.fillRect(20, 75, (knightHp / 100) * 150, 12);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4 tracking-wider">HYPER KNIGHT</h1>
          <p className="text-zinc-400 mb-2">Defend the arena from invading dark goblins with hyper sword swings!</p>
          <p className="text-sm text-zinc-500 mb-6">WASD / Arrow Keys to Move | Spacebar / K to Slash</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            ENTER ARENA
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">KNIGHT FELL IN BATTLE</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-yellow-500/30 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.2)] max-w-full max-h-full object-contain"
      />
    </div>
  );
}
