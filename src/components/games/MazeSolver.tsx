"use client";
import { useEffect, useRef } from "react";

const CELL = 30;
const COLS = 21, ROWS = 15;

export default function MazeSolver() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = COLS * CELL, H = ROWS * CELL;

    // Generate maze using recursive backtracking
    const walls: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
    const visited: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    const carve = (r: number, c: number) => {
      visited[r][c] = true;
      walls[r][c] = false;
      const dirs = [[0,2],[0,-2],[2,0],[-2,0]].sort(() => Math.random() - 0.5);
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
          walls[r + dr/2][c + dc/2] = false;
          carve(nr, nc);
        }
      }
    };
    carve(1, 1);
    walls[0][1] = false; // entrance
    walls[ROWS - 1][COLS - 2] = false; // exit

    let px = 1, py = 1;
    const keys: Record<string, boolean> = {};
    let won = false;
    window.addEventListener("keydown", e => { keys[e.code] = true; });
    window.addEventListener("keyup", e => { keys[e.code] = false; });

    let lastMove = 0;
    let frame: number;
    const tick = (time: number) => {
      if (!won && time - lastMove > 120) {
        if (keys["ArrowUp"] || keys["KeyW"]) { if (!walls[py-1]?.[px]) { py--; lastMove = time; } }
        if (keys["ArrowDown"] || keys["KeyS"]) { if (!walls[py+1]?.[px]) { py++; lastMove = time; } }
        if (keys["ArrowLeft"] || keys["KeyA"]) { if (!walls[py]?.[px-1]) { px--; lastMove = time; } }
        if (keys["ArrowRight"] || keys["KeyD"]) { if (!walls[py]?.[px+1]) { px++; lastMove = time; } }
        if (py >= ROWS - 1 && px >= COLS - 2) won = true;
      }

      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(0, 0, W, H);

      // Draw maze
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (walls[r][c]) {
            ctx.fillStyle = "#4f46e5";
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          }
        }
      }

      // Exit glow
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 20;
      ctx.fillRect((COLS - 2) * CELL + 4, (ROWS - 1) * CELL + 4, CELL - 8, CELL - 8);
      ctx.shadowBlur = 0;

      // Player
      ctx.fillStyle = "#22d3ee";
      ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(px * CELL + CELL / 2, py * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (won) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fbbf24";
        ctx.font = `bold ${CELL * 2}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🏆 SOLVED!", W / 2, H / 2);
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1b4b]">
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="border-2 border-indigo-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-indigo-400 text-sm font-mono uppercase tracking-widest">Arrow Keys / WASD — reach the 🏆</p>
    </div>
  );
}
