"use client";
import { useEffect, useRef, useState } from "react";

export default function AeroSurfer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    let py = H / 2;
    let vy = 0;
    let score = 0;
    let lives = 3;
    let distance = 0;
    let isDead = false;

    type Obstacle = { x: number; y: number; radius: number; isOrb: boolean };
    const items: Obstacle[] = [];
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let spawnTimer = 0;
    let animationFrameId: number;

    const spawnItem = () => {
      const isOrb = Math.random() < 0.4;
      items.push({
        x: W + 30,
        y: 40 + Math.random() * (H - 80),
        radius: isOrb ? 14 : 20 + Math.random() * 10,
        isOrb,
      });
    };

    const gameLoop = () => {
      if (!isDead) {
        // Controls (Smooth surfing physics)
        if (keys["ArrowUp"] || keys["KeyW"]) vy -= 0.8;
        if (keys["ArrowDown"] || keys["KeyS"]) vy += 0.8;

        vy *= 0.92; // Friction
        py += vy;

        if (py < 30) { py = 30; vy = 0; }
        if (py > H - 30) { py = H - 30; vy = 0; }

        distance += 1;
        score = Math.floor(distance / 5);

        spawnTimer++;
        if (spawnTimer > Math.max(20, 50 - Math.floor(distance / 200))) {
          spawnItem();
          spawnTimer = 0;
        }

        const scrollSpeed = 4 + Math.floor(distance / 300);

        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          item.x -= scrollSpeed;

          // Collision check
          const px = 100;
          const dist = Math.hypot(item.x - px, item.y - py);

          if (dist < item.radius + 18) {
            if (item.isOrb) {
              score += 250;
              distance += 50;
              items.splice(i, 1);
            } else {
              items.splice(i, 1);
              lives--;
              if (lives <= 0) {
                isDead = true;
                setFinalScore(score);
                setGameOver(true);
                window.dispatchEvent(
                  new CustomEvent("xakteir-game-score", { detail: { score } })
                );
              }
            }
          } else if (item.x < -40) {
            items.splice(i, 1);
          }
        }
      }

      // Render Sky Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, "#0284c7");
      gradient.addColorStop(0.5, "#0369a1");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // Speed lines / Wind currents
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const lineY = ((distance * 5 + i * 100) % H);
        ctx.beginPath();
        ctx.moveTo((distance * 8 + i * 150) % W, lineY);
        ctx.lineTo(((distance * 8 + i * 150) % W) + 60, lineY);
        ctx.stroke();
      }

      // Render Items (Orbs & Storm Clouds)
      for (const item of items) {
        ctx.save();
        if (item.isOrb) {
          ctx.shadowColor = "#fde047";
          ctx.shadowBlur = 15;
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 10;
          ctx.fillStyle = "#334155";
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fill();
          // Cloud details
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(item.x - 6, item.y - 4, item.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Render Surfer
      if (!isDead) {
        const px = 100;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((vy * Math.PI) / 180 * 2.5); // Tilt board based on velocity

        // Surfboard
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.ellipse(0, 10, 24, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Surfer character
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(-6, -16, 12, 22); // Body
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(0, -22, 7, 0, Math.PI * 2); // Head
        ctx.fill();

        ctx.restore();
      }

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`SCORE: ${score}`, 20, 30);
      ctx.fillText(`ENERGY: ${"⚡".repeat(Math.max(0, lives))}`, W - 150, 30);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameKey]);

  const restart = () => {
    setGameOver(false);
    setFinalScore(0);
    setGameKey((k) => k + 1);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4">
      <h2 className="text-sky-300 text-xl font-bold uppercase tracking-wider mb-2">Aero Surfer</h2>
      <div className="relative">
        <canvas ref={canvasRef} width={640} height={480} className="border border-sky-900/50 rounded-xl bg-zinc-950 shadow-2xl" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4">
            <h3 className="text-sky-400 font-extrabold text-3xl uppercase">Wipeout!</h3>
            <p className="text-zinc-300 text-lg">Final Score: <span className="text-sky-400 font-bold">{finalScore}</span></p>
            <button
              onClick={restart}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold uppercase rounded-lg transition"
            >
              Catch Next Wave
            </button>
          </div>
        )}
      </div>
      <p className="text-zinc-500 text-xs mt-3">Controls: Arrow Up / Down or W / S to glide smoothly across currents.</p>
    </div>
  );
}
