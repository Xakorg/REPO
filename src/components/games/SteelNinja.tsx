"use client";
import { useEffect, useRef, useState } from "react";

export default function SteelNinja() {
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

    let nx = W / 2;
    let ny = H - 80;
    let facingLeft = false;
    let slashTimer = 0;
    let isSlashing = false;
    let score = 0;
    let lives = 3;
    let isDead = false;

    type Shuriken = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      angle: number;
    };
    const shurikens: Shuriken[] = [];
    const keys: Record<string, boolean> = {};

    const spawnShuriken = () => {
      const fromLeft = Math.random() < 0.5;
      shurikens.push({
        x: fromLeft ? -20 : W + 20,
        y: Math.random() * (H - 180) + 40,
        vx: (fromLeft ? 1 : -1) * (2.5 + Math.random() * 3 + score / 300),
        vy: (Math.random() - 0.5) * 1.5,
        size: 14 + Math.random() * 8,
        angle: 0,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Space" && !isSlashing) {
        isSlashing = true;
        slashTimer = 12;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let spawnCounter = 0;
    let animationFrameId: number;

    const gameLoop = () => {
      if (!isDead) {
        // Controls
        if (keys["ArrowLeft"] || keys["KeyA"]) {
          nx -= 5;
          facingLeft = true;
        }
        if (keys["ArrowRight"] || keys["KeyD"]) {
          nx += 5;
          facingLeft = false;
        }
        nx = Math.max(30, Math.min(W - 30, nx));

        if (isSlashing) {
          slashTimer--;
          if (slashTimer <= 0) isSlashing = false;
        }

        spawnCounter++;
        if (spawnCounter > Math.max(30, 80 - Math.floor(score / 50))) {
          spawnShuriken();
          spawnCounter = 0;
        }

        // Update shurikens
        for (let i = shurikens.length - 1; i >= 0; i--) {
          const s = shurikens[i];
          s.x += s.vx;
          s.y += s.vy;
          s.angle += 0.2;

          // Check slash collision
          if (isSlashing) {
            const slashX = facingLeft ? nx - 45 : nx + 45;
            const distToSlash = Math.hypot(s.x - slashX, s.y - ny);
            if (distToSlash < 55) {
              shurikens.splice(i, 1);
              score += 100;
              continue;
            }
          }

          // Check body hit
          const distToNinja = Math.hypot(s.x - nx, s.y - ny);
          if (distToNinja < s.size + 18) {
            shurikens.splice(i, 1);
            lives--;
            if (lives <= 0) {
              isDead = true;
              setFinalScore(score);
              setGameOver(true);
              window.dispatchEvent(
                new CustomEvent("xakteir-game-score", { detail: { score } })
              );
            }
          } else if (s.x < -40 || s.x > W + 40 || s.y > H + 40) {
            shurikens.splice(i, 1);
          }
        }
      }

      // Draw background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      // Steel grid floor
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 40);
      ctx.lineTo(W, H - 40);
      ctx.stroke();

      // Shurikens
      for (const s of shurikens) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.fillStyle = "#e4e4e7";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(0, -s.size);
          ctx.lineTo(s.size / 4, -s.size / 4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Ninja
      ctx.save();
      ctx.translate(nx, ny);

      // Body
      ctx.fillStyle = "#18181b";
      ctx.fillRect(-14, -20, 28, 40);
      // Headband / eye scarf
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-14, -14, 28, 8);
      // Eyes glowing
      ctx.fillStyle = "#fef08a";
      if (facingLeft) {
        ctx.fillRect(-10, -12, 4, 4);
      } else {
        ctx.fillRect(6, -12, 4, 4);
      }

      // Blade slash effect
      if (isSlashing) {
        ctx.strokeStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (facingLeft) {
          ctx.arc(0, 0, 50, Math.PI * 0.7, Math.PI * 1.4);
        } else {
          ctx.arc(0, 0, 50, -Math.PI * 0.4, Math.PI * 0.3);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // HUD
      ctx.fillStyle = "#f4f4f5";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`SCORE: ${score}`, 20, 30);
      ctx.fillText(`LIVES: ${"❤️".repeat(Math.max(0, lives))}`, W - 140, 30);

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
      <h2 className="text-zinc-200 text-xl font-bold uppercase tracking-wider mb-2">Steel Ninja</h2>
      <div className="relative">
        <canvas ref={canvasRef} width={640} height={480} className="border border-zinc-800 rounded-xl bg-zinc-950 shadow-2xl" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4">
            <h3 className="text-red-500 font-extrabold text-3xl uppercase">Defeated</h3>
            <p className="text-zinc-300 text-lg">Final Score: <span className="text-sky-400 font-bold">{finalScore}</span></p>
            <button
              onClick={restart}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold uppercase rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <p className="text-zinc-500 text-xs mt-3">Controls: A/D or Left/Right to move, Space to Slice!</p>
    </div>
  );
}
