"use client";
import { useEffect, useRef, useState } from "react";

export default function ElectroDash() {
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

    let py = H - 120;
    let vy = 0;
    let isJumping = false;
    let score = 0;
    let lives = 3;
    let distance = 0;
    let isDead = false;

    const groundY = H - 100;
    const gravity = 0.8;

    type Element = { x: number; y: number; width: number; height: number; isCoin: boolean };
    const elements: Element[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && !isJumping) {
        vy = -14;
        isJumping = true;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    let spawnTimer = 0;
    let animationFrameId: number;

    const spawnElement = () => {
      const isCoin = Math.random() < 0.45;
      elements.push({
        x: W + 30,
        y: isCoin ? groundY - 70 - Math.random() * 50 : groundY - 35,
        width: isCoin ? 18 : 24,
        height: isCoin ? 18 : 35,
        isCoin,
      });
    };

    const gameLoop = () => {
      if (!isDead) {
        // Jump Physics
        vy += gravity;
        py += vy;

        if (py >= groundY - 25) {
          py = groundY - 25;
          vy = 0;
          isJumping = false;
        }

        distance++;
        score = Math.floor(distance / 4);

        spawnTimer++;
        if (spawnTimer > Math.max(30, 75 - Math.floor(distance / 250))) {
          spawnElement();
          spawnTimer = 0;
        }

        const speed = 6 + Math.floor(distance / 400);

        // Update elements
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i];
          el.x -= speed;

          // Collision Check
          const px = 100;
          const pw = 24;
          const ph = 25;

          if (
            px < el.x + el.width &&
            px + pw > el.x &&
            py < el.y + el.height &&
            py + ph > el.y
          ) {
            if (el.isCoin) {
              score += 200;
              distance += 40;
              elements.splice(i, 1);
            } else {
              elements.splice(i, 1);
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
          } else if (el.x < -40) {
            elements.splice(i, 1);
          }
        }
      }

      // Render Cyberpunk Background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      // Electric grid ground
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // Neon grid lines scrolling
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      const offsetX = (distance * 6) % 40;
      for (let x = -offsetX; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 20, H);
        ctx.stroke();
      }

      // Render Elements (Coins & Obstacles)
      for (const el of elements) {
        ctx.save();
        if (el.isCoin) {
          ctx.shadowColor = "#facc15";
          ctx.shadowBlur = 12;
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 15;
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(el.x, el.y, el.width, el.height);
        }
        ctx.restore();
      }

      // Render Electric Runner Character
      if (!isDead) {
        ctx.save();
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(100, py, 24, 25);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(114, py + 5, 6, 6);
        ctx.restore();
      }

      // HUD
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`SCORE: ${score}`, 20, 30);
      ctx.fillText(`VOLTAGE: ${"⚡".repeat(Math.max(0, lives))}`, W - 160, 30);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameKey]);

  const restart = () => {
    setGameOver(false);
    setFinalScore(0);
    setGameKey((k) => k + 1);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4">
      <h2 className="text-cyan-400 text-xl font-bold uppercase tracking-wider mb-2">Electro Dash</h2>
      <div className="relative">
        <canvas ref={canvasRef} width={640} height={480} className="border border-cyan-900/50 rounded-xl bg-zinc-950 shadow-2xl" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4">
            <h3 className="text-cyan-400 font-extrabold text-3xl uppercase">Short Circuit!</h3>
            <p className="text-zinc-300 text-lg">Final Score: <span className="text-cyan-400 font-bold">{finalScore}</span></p>
            <button
              onClick={restart}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold uppercase rounded-lg transition"
            >
              Recharge & Dash
            </button>
          </div>
        )}
      </div>
      <p className="text-zinc-500 text-xs mt-3">Controls: Press Space / Up Arrow to jump over high voltage obstacles!</p>
    </div>
  );
}
