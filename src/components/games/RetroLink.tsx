"use client";
import { useEffect, useRef, useState } from "react";

const NODE_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#eab308", "#a855f7"];

interface NodePair {
  color: string;
  start: { r: number; c: number };
  end: { r: number; c: number };
}

export default function RetroLink() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const GRID_SIZE = 5;

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const CELL_SIZE = Math.floor(Math.min(W, H - 60) / GRID_SIZE);
    const OFFSET_X = Math.floor((W - CELL_SIZE * GRID_SIZE) / 2);
    const OFFSET_Y = 60;

    let localScore = 0;
    let localLevel = 1;

    // Define fixed node pairs for levels
    let pairs: NodePair[] = [
      { color: NODE_COLORS[0], start: { r: 0, c: 0 }, end: { r: 4, c: 0 } },
      { color: NODE_COLORS[1], start: { r: 0, c: 4 }, end: { r: 4, c: 4 } },
      { color: NODE_COLORS[2], start: { r: 1, c: 1 }, end: { r: 3, c: 1 } },
      { color: NODE_COLORS[3], start: { r: 1, c: 3 }, end: { r: 3, c: 3 } },
      { color: NODE_COLORS[4], start: { r: 2, c: 0 }, end: { r: 2, c: 4 } }
    ];

    let paths: { [color: string]: { r: number; c: number }[] } = {};

    let isDrawing = false;
    let activeColor: string | null = null;

    const getCellFromMouse = (mx: number, my: number) => {
      const c = Math.floor((mx - OFFSET_X) / CELL_SIZE);
      const r = Math.floor((my - OFFSET_Y) / CELL_SIZE);
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        return { r, c };
      }
      return null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cell = getCellFromMouse(e.clientX - rect.left, e.clientY - rect.top);
      if (!cell) return;

      // Check if clicked on a start/end node
      const matchingPair = pairs.find(
        p => (p.start.r === cell.r && p.start.c === cell.c) || (p.end.r === cell.r && p.end.c === cell.c)
      );

      if (matchingPair) {
        isDrawing = true;
        activeColor = matchingPair.color;
        paths[activeColor] = [cell];
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !activeColor) return;
      const rect = canvas.getBoundingClientRect();
      const cell = getCellFromMouse(e.clientX - rect.left, e.clientY - rect.top);
      if (!cell) return;

      const currentPath = paths[activeColor];
      if (!currentPath || currentPath.length === 0) return;

      const lastCell = currentPath[currentPath.length - 1];
      if (lastCell.r === cell.r && lastCell.c === cell.c) return;

      // Check adjacency
      const dr = Math.abs(cell.r - lastCell.r);
      const dc = Math.abs(cell.c - lastCell.c);
      if (dr + dc === 1) {
        // Prevent overlapping other colors' paths
        for (const [col, p] of Object.entries(paths)) {
          if (col !== activeColor && p.some(pt => pt.r === cell.r && pt.c === cell.c)) {
            return;
          }
        }
        currentPath.push(cell);

        // Check if reached destination node
        const pair = pairs.find(p => p.color === activeColor);
        if (pair) {
          const isEnd = (pair.start.r === cell.r && pair.start.c === cell.c) || (pair.end.r === cell.r && pair.end.c === cell.c);
          if (isEnd && currentPath.length > 1) {
            isDrawing = false;
            activeColor = null;
            checkLevelCompletion();
          }
        }
      }
    };

    const handleMouseUp = () => {
      isDrawing = false;
      activeColor = null;
    };

    const checkLevelCompletion = () => {
      let completedPairs = 0;
      for (const p of pairs) {
        const path = paths[p.color];
        if (path && path.length > 1) {
          const first = path[0];
          const last = path[path.length - 1];
          const matchStart = (p.start.r === first.r && p.start.c === first.c) || (p.end.r === first.r && p.end.c === first.c);
          const matchEnd = (p.start.r === last.r && p.start.c === last.c) || (p.end.r === last.r && p.end.c === last.c);
          if (matchStart && matchEnd) completedPairs++;
        }
      }

      if (completedPairs === pairs.length) {
        localScore += 500 * localLevel;
        localLevel += 1;
        setScore(localScore);
        setLevel(localLevel);
        paths = {};
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    let animId: number;

    const loop = () => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      // Grid Background
      ctx.fillStyle = "#18181b";
      ctx.fillRect(OFFSET_X, OFFSET_Y, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE);

      // Grid Lines
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      for (let r = 0; r <= GRID_SIZE; r++) {
        ctx.beginPath();
        ctx.moveTo(OFFSET_X, OFFSET_Y + r * CELL_SIZE);
        ctx.lineTo(OFFSET_X + GRID_SIZE * CELL_SIZE, OFFSET_Y + r * CELL_SIZE);
        ctx.stroke();
      }
      for (let c = 0; c <= GRID_SIZE; c++) {
        ctx.beginPath();
        ctx.moveTo(OFFSET_X + c * CELL_SIZE, OFFSET_Y);
        ctx.lineTo(OFFSET_X + c * CELL_SIZE, OFFSET_Y + GRID_SIZE * CELL_SIZE);
        ctx.stroke();
      }

      // Draw Drawn Paths
      for (const [col, p] of Object.entries(paths)) {
        if (p.length < 2) continue;
        ctx.strokeStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(
          OFFSET_X + p[0].c * CELL_SIZE + CELL_SIZE / 2,
          OFFSET_Y + p[0].r * CELL_SIZE + CELL_SIZE / 2
        );
        for (let i = 1; i < p.length; i++) {
          ctx.lineTo(
            OFFSET_X + p[i].c * CELL_SIZE + CELL_SIZE / 2,
            OFFSET_Y + p[i].r * CELL_SIZE + CELL_SIZE / 2
          );
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Node Terminals
      for (const p of pairs) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;

        // Start node
        const sx = OFFSET_X + p.start.c * CELL_SIZE + CELL_SIZE / 2;
        const sy = OFFSET_Y + p.start.r * CELL_SIZE + CELL_SIZE / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();

        // End node
        const ex = OFFSET_X + p.end.c * CELL_SIZE + CELL_SIZE / 2;
        const ey = OFFSET_Y + p.end.r * CELL_SIZE + CELL_SIZE / 2;
        ctx.beginPath();
        ctx.arc(ex, ey, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${localScore}`, 20, 35);
      ctx.textAlign = "right";
      ctx.fillText(`LEVEL: ${localLevel}`, W - 20, 35);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
  };

  const finishGame = () => {
    setGameOver(true);
    window.dispatchEvent(
      new CustomEvent("xakteir-game-score", { detail: { score } })
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto cursor-pointer" />

        {gameStarted && !gameOver && (
          <button
            onClick={finishGame}
            className="absolute top-3 right-36 px-4 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-lg transition"
          >
            END GAME & SUBMIT
          </button>
        )}

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
              RETRO LINK
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Connect matching color circuit nodes without letting wire paths cross each other!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Puzzle Score</p>
                <p className="text-3xl font-mono font-bold text-indigo-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "START LINKING"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              Click & Drag between matching colored terminals
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
