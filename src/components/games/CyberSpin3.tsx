"use client";

import React, { useEffect, useState } from "react";

// 4x4 Grid of Cyber Spin dials with connection paths [N, E, S, W]
interface Tile {
  id: number;
  rotation: number; // 0, 1, 2, 3 (* 90 deg)
  type: "straight" | "corner" | "t-junction";
  connected: boolean;
}

export default function CyberSpin3() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [grid, setGrid] = useState<Tile[]>([]);

  // Generator for 4x4 grid
  const generateLevel = () => {
    const newGrid: Tile[] = [];
    const types: ("straight" | "corner" | "t-junction")[] = ["straight", "corner", "t-junction"];
    for (let i = 0; i < 16; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const rotation = Math.floor(Math.random() * 4);
      newGrid.push({ id: i, rotation, type, connected: false });
    }
    setGrid(newGrid);
    evaluateConnections(newGrid);
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(30);
    generateLevel();
    setGameState("playing");
  };

  // Check connections starting from top-left (tile 0)
  const evaluateConnections = (currentGrid: Tile[]) => {
    const updated = currentGrid.map((t) => ({ ...t, connected: false }));
    const visited = new Set<number>();
    const queue = [0];

    const getOpenings = (tile: Tile) => {
      // Base openings at rotation 0: [North, East, South, West]
      let base = [false, false, false, false];
      if (tile.type === "straight") base = [true, false, true, false];
      if (tile.type === "corner") base = [true, true, false, false];
      if (tile.type === "t-junction") base = [true, true, true, false];

      const rot = tile.rotation;
      return [
        base[(4 - rot) % 4],
        base[(5 - rot) % 4],
        base[(6 - rot) % 4],
        base[(7 - rot) % 4],
      ];
    };

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      updated[curr].connected = true;

      const row = Math.floor(curr / 4);
      const col = curr % 4;
      const openings = getOpenings(updated[curr]);

      // North
      if (openings[0] && row > 0) {
        const neighbor = (row - 1) * 4 + col;
        const nOpenings = getOpenings(updated[neighbor]);
        if (nOpenings[2]) queue.push(neighbor);
      }
      // East
      if (openings[1] && col < 3) {
        const neighbor = row * 4 + (col + 1);
        const nOpenings = getOpenings(updated[neighbor]);
        if (nOpenings[3]) queue.push(neighbor);
      }
      // South
      if (openings[2] && row < 3) {
        const neighbor = (row + 1) * 4 + col;
        const nOpenings = getOpenings(updated[neighbor]);
        if (nOpenings[0]) queue.push(neighbor);
      }
      // West
      if (openings[3] && col > 0) {
        const neighbor = row * 4 + (col - 1);
        const nOpenings = getOpenings(updated[neighbor]);
        if (nOpenings[1]) queue.push(neighbor);
      }
    }

    setGrid(updated);

    // Check if bottom right (tile 15) is connected
    if (updated[15].connected) {
      setTimeout(() => {
        setScore((prev) => {
          const nextScore = prev + 100 + timeLeft * 10;
          return nextScore;
        });
        setLevel((prev) => prev + 1);
        setTimeLeft((prev) => Math.min(45, prev + 15));
        generateLevel();
      }, 200);
    }
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "playing") return;
    const newGrid = [...grid];
    newGrid[index].rotation = (newGrid[index].rotation + 1) % 4;
    evaluateConnections(newGrid);
  };

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState("gameover");
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score } }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, score]);

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-zinc-950 text-white relative p-4 select-none">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h1 className="text-4xl font-extrabold text-emerald-400 mb-3 tracking-wider">CYBER SPIN 3</h1>
          <p className="text-zinc-300 mb-2 max-w-md text-center">
            Rotate cyber dials to channel energy from top-left core to bottom-right node before time runs out!
          </p>
          <p className="text-sm text-zinc-400 mb-6">Click any tile to rotate 90° clockwise</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl shadow-lg transition"
          >
            INITIALIZE CORE
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 p-4">
          <h2 className="text-3xl font-bold text-red-400 mb-2">TIME EXPIRED</h2>
          <p className="text-xl text-zinc-200 mb-1">Levels Solved: {level - 1}</p>
          <p className="text-2xl font-bold text-emerald-400 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl shadow-lg transition"
          >
            RETRY MATRIX
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800">
        <div>
          <span className="text-zinc-400 text-xs block">LEVEL</span>
          <span className="text-lg font-bold text-emerald-400">{level}</span>
        </div>
        <div>
          <span className="text-zinc-400 text-xs block">SCORE</span>
          <span className="text-lg font-bold text-white">{score}</span>
        </div>
        <div>
          <span className="text-zinc-400 text-xs block">TIME</span>
          <span className={`text-lg font-bold ${timeLeft < 8 ? "text-red-400 animate-pulse" : "text-amber-400"}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        {grid.map((tile, idx) => (
          <button
            key={tile.id}
            onClick={() => handleTileClick(idx)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center transition-transform duration-200 border relative overflow-hidden ${
              tile.connected
                ? "bg-emerald-950/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
            }`}
            style={{ transform: `rotate(${tile.rotation * 90}deg)` }}
          >
            {/* Start / End indicator glow */}
            {idx === 0 && (
              <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
            {idx === 15 && (
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}

            {/* Tile Conduit SVG Graphics */}
            <svg viewBox="0 0 100 100" className="w-full h-full p-2 pointer-events-none">
              {tile.type === "straight" && (
                <path
                  d="M50 0 L50 100"
                  stroke={tile.connected ? "#10b981" : "#52525b"}
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              )}
              {tile.type === "corner" && (
                <path
                  d="M50 0 L50 50 L100 50"
                  stroke={tile.connected ? "#10b981" : "#52525b"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              {tile.type === "t-junction" && (
                <path
                  d="M50 0 L50 100 M50 50 L100 50"
                  stroke={tile.connected ? "#10b981" : "#52525b"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-zinc-500 flex items-center gap-4">
        <span>● Top-Left: Core Source</span>
        <span>● Bottom-Right: Power Target</span>
      </div>
    </div>
  );
}
