"use client";
import { useEffect, useRef } from "react";

const TILE = 20;

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const COLS = W / TILE, ROWS = H / TILE;

    let snake = [{ x: 10, y: 10 }];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = { x: 15, y: 10 };
    let score = 0, gameOver = false;

    const spawnFood = () => {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    };

    window.addEventListener("keydown", e => {
      if (e.code === "ArrowUp" && dir.y !== 1) nextDir = { x: 0, y: -1 };
      if (e.code === "ArrowDown" && dir.y !== -1) nextDir = { x: 0, y: 1 };
      if (e.code === "ArrowLeft" && dir.x !== 1) nextDir = { x: -1, y: 0 };
      if (e.code === "ArrowRight" && dir.x !== -1) nextDir = { x: 1, y: 0 };
    });

    let interval: ReturnType<typeof setInterval>;
    const restart = () => {
      snake = [{ x: 10, y: 10 }]; dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
      score = 0; gameOver = false; spawnFood();
    };
    canvas.addEventListener("click", () => { if (gameOver) restart(); });

    let frame: number;
    const draw = () => {
      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "#111122";
      for (let x = 0; x < W; x += TILE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += TILE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Snake
      snake.forEach((seg, i) => {
        const t = i / snake.length;
        ctx.fillStyle = i === 0 ? "#22c55e" : `hsl(${140 + t * 40}, 70%, ${45 - t * 15}%)`;
        ctx.shadowColor = i === 0 ? "#22c55e" : "transparent";
        ctx.shadowBlur = i === 0 ? 15 : 0;
        ctx.beginPath();
        ctx.roundRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2, 4);
        ctx.fill();
        if (i === 0) {
          // Eyes
          ctx.fillStyle = "white"; ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(seg.x * TILE + 6, seg.y * TILE + 7, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(seg.x * TILE + 14, seg.y * TILE + 7, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#111";
          ctx.beginPath(); ctx.arc(seg.x * TILE + 7, seg.y * TILE + 7, 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(seg.x * TILE + 15, seg.y * TILE + 7, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Food
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(food.x * TILE + TILE / 2, food.y * TILE + TILE / 2, TILE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 10, 28);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 42px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2);
        ctx.fillStyle = "white";
        ctx.font = "22px monospace";
        ctx.fillText(`Score: ${score} — Click to restart`, W / 2, H / 2 + 50);
      }
    };

    interval = setInterval(() => {
      if (gameOver) { draw(); return; }
      dir = nextDir;
      const head = { x: (snake[0].x + dir.x + COLS) % COLS, y: (snake[0].y + dir.y + ROWS) % ROWS };
      if (snake.some(s => s.x === head.x && s.y === head.y)) { gameOver = true; draw(); return; }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) { score++; spawnFood(); } else { snake.pop(); }
      draw();
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a10]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-emerald-500/30 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-pointer" />
      <p className="mt-4 text-emerald-400 text-sm font-mono uppercase tracking-widest">Arrow Keys to move</p>
    </div>
  );
}
