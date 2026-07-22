"use client";
import React, { useEffect, useRef, useState } from "react";

export default function SteelShooter() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);

  const playerRef = useRef({ x: 400, y: 530, width: 48, height: 24, speed: 7 });
  const bulletsRef = useRef<Array<{ x: number; y: number; vy: number }>>([]);
  const enemiesRef = useRef<Array<{ x: number; y: number; width: number; height: number; speed: number; hp: number }>>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({ left: false, right: false, shoot: false });
  const lastShotRef = useRef(0);
  const scoreRef = useRef(0);
  const hpRef = useRef(3);

  scoreRef.current = score;
  hpRef.current = hp;

  const startGame = () => {
    playerRef.current.x = 400;
    bulletsRef.current = [];
    enemiesRef.current = [];
    setScore(0);
    setHp(3);
    setGameState("PLAYING");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") keysRef.current.shoot = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") keysRef.current.shoot = false;
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
    let spawnTimer = 0;

    const loop = () => {
      // Update Player
      const player = playerRef.current;
      if (keysRef.current.left) player.x = Math.max(30, player.x - player.speed);
      if (keysRef.current.right) player.x = Math.min(canvas.width - 30, player.x + player.speed);

      // Shooting
      const now = Date.now();
      if (keysRef.current.shoot && now - lastShotRef.current > 160) {
        bulletsRef.current.push({ x: player.x, y: player.y - 15, vy: -10 });
        lastShotRef.current = now;
      }

      // Bullets move
      bulletsRef.current.forEach((b) => (b.y += b.vy));
      bulletsRef.current = bulletsRef.current.filter((b) => b.y > -20);

      // Spawn Enemies
      spawnTimer++;
      if (spawnTimer % 45 === 0) {
        enemiesRef.current.push({
          x: Math.random() * (canvas.width - 60) + 30,
          y: -30,
          width: 36,
          height: 36,
          speed: 2 + Math.random() * 2,
          hp: 1,
        });
      }

      // Move Enemies & Collisions
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        e.y += e.speed;

        // Check bullet collisions
        for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
          const b = bulletsRef.current[j];
          if (
            Math.abs(b.x - e.x) < e.width / 2 + 4 &&
            Math.abs(b.y - e.y) < e.height / 2 + 4
          ) {
            bulletsRef.current.splice(j, 1);
            enemiesRef.current.splice(i, 1);
            setScore((s) => s + 100);
            break;
          }
        }

        // Enemy reached bottom
        if (e.y > canvas.height + 20) {
          enemiesRef.current.splice(i, 1);
          setHp((h) => {
            const next = h - 1;
            if (next <= 0) {
              setGameState("GAMEOVER");
              window.dispatchEvent(
                new CustomEvent("xakteir-game-score", {
                  detail: { score: scoreRef.current + 100 },
                })
              );
            }
            return next;
          });
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background effect
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Player
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 15);
      ctx.lineTo(player.x - 22, player.y + 12);
      ctx.lineTo(player.x + 22, player.y + 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0284c7";
      ctx.fillRect(player.x - 6, player.y - 20, 12, 12);

      // Draw Bullets
      ctx.fillStyle = "#facc15";
      bulletsRef.current.forEach((b) => {
        ctx.fillRect(b.x - 3, b.y - 8, 6, 12);
      });

      // Draw Enemies
      enemiesRef.current.forEach((e) => {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(e.x - e.width / 2, e.y - e.height / 2, e.width, e.height);
        ctx.strokeStyle = "#fca5a5";
        ctx.strokeRect(e.x - e.width / 2, e.y - e.height / 2, e.width, e.height);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 text-xl font-bold uppercase tracking-wider">
        <div>Score: <span className="text-sky-400">{score}</span></div>
        <div>HP: <span className="text-red-400">{"❤️".repeat(hp)}</span></div>
      </div>
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="block bg-zinc-950" />
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-sky-400">STEEL SHOOTER</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-sky-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">Controls: A/D or Left/Right Arrow to Move, Space to Shoot</p>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
