"use client";

import React, { useEffect, useRef, useState } from "react";

interface Node {
  row: number;
  col: number;
  color: string;
  pairId: number;
}

interface Path {
  pairId: number;
  color: string;
  points: { row: number; col: number }[];
}

export default function ShadowLink() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);

  const gridSize = 5;
  const cellSize = 90;
  const startX = (800 - gridSize * cellSize) / 2;
  const startY = (600 - gridSize * cellSize) / 2;

  const nodesRef = useRef<Node[]>([]);
  const pathsRef = useRef<Path[]>([]);
  const currentPathRef = useRef<Path | null>(null);
  const scoreRef = useRef<number>(0);
  const timeRef = useRef<number>(60);

  const palette = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#eab308"];

  const generateLevel = (lvl: number) => {
    const numPairs = Math.min(3 + Math.floor((lvl - 1) / 2), 5);
    const nodes: Node[] = [];
    const used = new Set<string>();

    for (let p = 0; p < numPairs; p++) {
      const color = palette[p % palette.length];
      for (let k = 0; k < 2; k++) {
        let r: number, c: number;
        do {
          r = Math.floor(Math.random() * gridSize);
          c = Math.floor(Math.random() * gridSize);
        } while (used.has(`${r},${c}`));
        used.add(`${r},${c}`);
        nodes.push({ row: r, col: c, color, pairId: p });
      }
    }

    nodesRef.current = nodes;
    pathsRef.current = [];
    currentPathRef.current = null;
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    scoreRef.current = 0;
    timeRef.current = 60;
    generateLevel(1);
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

    const getCellFromMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - startX;
      const my = e.clientY - rect.top - startY;

      const col = Math.floor(mx / cellSize);
      const row = Math.floor(my / cellSize);

      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        return { row, col };
      }
      return null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const cell = getCellFromMouse(e);
      if (!cell) return;

      const node = nodesRef.current.find((n) => n.row === cell.row && n.col === cell.col);
      if (node) {
        // Clear any existing path for this pairId
        pathsRef.current = pathsRef.current.filter((p) => p.pairId !== node.pairId);

        currentPathRef.current = {
          pairId: node.pairId,
          color: node.color,
          points: [{ row: cell.row, col: cell.col }],
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!currentPathRef.current) return;
      const cell = getCellFromMouse(e);
      if (!cell) return;

      const pts = currentPathRef.current.points;
      const last = pts[pts.length - 1];

      if (last.row === cell.row && last.col === cell.col) return;

      // Check adjacency
      const dRow = Math.abs(last.row - cell.row);
      const dCol = Math.abs(last.col - cell.col);
      if ((dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1)) {
        // Prevent path self-intersection
        const existingIdx = pts.findIndex((p) => p.row === cell.row && p.col === cell.col);
        if (existingIdx !== -1) {
          pts.splice(existingIdx + 1);
          return;
        }

        pts.push(cell);

        // Check if reached the matching pair node
        const destNode = nodesRef.current.find(
          (n) => n.row === cell.row && n.col === cell.col && n.pairId === currentPathRef.current!.pairId && (cell.row !== pts[0].row || cell.col !== pts[0].col)
        );

        if (destNode) {
          pathsRef.current.push({ ...currentPathRef.current });
          currentPathRef.current = null;
          checkLevelComplete();
        }
      }
    };

    const handleMouseUp = () => {
      currentPathRef.current = null;
    };

    const checkLevelComplete = () => {
      const numPairs = Math.min(3 + Math.floor((level - 1) / 2), 5);
      if (pathsRef.current.length === numPairs) {
        scoreRef.current += 150 + timeRef.current * 10;
        timeRef.current += 15;
        setScore(scoreRef.current);
        setTimeLeft(timeRef.current);
        setLevel((prev) => {
          const next = prev + 1;
          generateLevel(next);
          return next;
        });
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    const render = () => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Grid lines
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;

      for (let r = 0; r <= gridSize; r++) {
        ctx.beginPath();
        ctx.moveTo(startX, startY + r * cellSize);
        ctx.lineTo(startX + gridSize * cellSize, startY + r * cellSize);
        ctx.stroke();
      }
      for (let c = 0; c <= gridSize; c++) {
        ctx.beginPath();
        ctx.moveTo(startX + c * cellSize, startY);
        ctx.lineTo(startX + c * cellSize, startY + gridSize * cellSize);
        ctx.stroke();
      }

      // Render Completed Paths
      const allPaths = [...pathsRef.current];
      if (currentPathRef.current) allPaths.push(currentPathRef.current);

      allPaths.forEach((path) => {
        if (path.points.length < 2) return;
        ctx.strokeStyle = path.color;
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 15;
        ctx.shadowColor = path.color;

        ctx.beginPath();
        path.points.forEach((p, idx) => {
          const px = startX + p.col * cellSize + cellSize / 2;
          const py = startY + p.row * cellSize + cellSize / 2;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      });

      // Render Nodes (Shadow Orbs)
      nodesRef.current.forEach((n) => {
        const nx = startX + n.col * cellSize + cellSize / 2;
        const ny = startY + n.row * cellSize + cellSize / 2;

        ctx.shadowBlur = 20;
        ctx.shadowColor = n.color;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(nx, ny, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(nx, ny, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gameState, level]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-fuchsia-400 mb-4 tracking-wider">SHADOW LINK</h1>
          <p className="text-zinc-400 mb-2">Connect matching colored shadow nodes by dragging paths across the grid!</p>
          <p className="text-sm text-zinc-500 mb-6">Click & Drag from one orb to its matching pair color</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START LINKING
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-400 mb-2">TIME EXPIRED</h2>
          <p className="text-xl text-zinc-300 mb-1">Final Score: {score}</p>
          <p className="text-sm text-zinc-400 mb-6">Puzzles Cleared: {level - 1}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="w-[800px] max-w-full flex justify-between items-center mb-2 px-4 py-2 bg-zinc-900/80 rounded-lg border border-fuchsia-500/30">
        <span className="font-bold text-fuchsia-400">Puzzle Level: {level}</span>
        <span className="font-bold text-yellow-400">Time: {timeLeft}s</span>
        <span className="font-bold text-cyan-400">Score: {score}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={540}
        className="border-2 border-fuchsia-500/30 rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.2)] max-w-full max-h-full object-contain cursor-pointer"
      />
    </div>
  );
}
