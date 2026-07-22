"use client";

import React, { useEffect, useState } from "react";

const GEM_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899"];

export default function InfinityMatch() {
  const [grid, setGrid] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAMEOVER">("START");

  const generateGrid = () => {
    const newGrid: string[] = [];
    for (let i = 0; i < 36; i++) {
      newGrid.push(GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)]);
    }
    return newGrid;
  };

  const startGame = () => {
    setGrid(generateGrid());
    setScore(0);
    setTimeLeft(30);
    setSelectedIdx(null);
    setGameState("PLAYING");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "PLAYING" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setGameState("GAMEOVER");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === "GAMEOVER") {
      window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score } }));
    }
  }, [gameState, score]);

  const checkMatches = (currentGrid: string[]) => {
    const toClear = new Set<number>();

    // Check rows
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 6 + c;
        if (
          currentGrid[i] &&
          currentGrid[i] === currentGrid[i + 1] &&
          currentGrid[i] === currentGrid[i + 2]
        ) {
          toClear.add(i);
          toClear.add(i + 1);
          toClear.add(i + 2);
        }
      }
    }

    // Check columns
    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 4; r++) {
        const i = r * 6 + c;
        if (
          currentGrid[i] &&
          currentGrid[i] === currentGrid[i + 6] &&
          currentGrid[i] === currentGrid[i + 12]
        ) {
          toClear.add(i);
          toClear.add(i + 6);
          toClear.add(i + 12);
        }
      }
    }

    if (toClear.size > 0) {
      const updated = [...currentGrid];
      toClear.forEach((idx) => {
        updated[idx] = GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];
      });
      const addedScore = toClear.size * 100;
      setScore((s) => s + addedScore);
      setTimeLeft((t) => Math.min(60, t + 2));
      setGrid(updated);
    }
  };

  const handleGemClick = (idx: number) => {
    if (gameState !== "PLAYING") return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else {
      if (selectedIdx === idx) {
        setSelectedIdx(null);
        return;
      }

      // Check adjacency
      const r1 = Math.floor(selectedIdx / 6);
      const c1 = selectedIdx % 6;
      const r2 = Math.floor(idx / 6);
      const c2 = idx % 6;

      const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

      if (isAdjacent) {
        const newGrid = [...grid];
        [newGrid[selectedIdx], newGrid[idx]] = [newGrid[idx], newGrid[selectedIdx]];
        setGrid(newGrid);
        checkMatches(newGrid);
      }
      setSelectedIdx(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-pink-500 mb-2 uppercase tracking-wider">
        Infinity Match
      </h1>

      <div className="flex gap-8 mb-4 font-bold text-zinc-300">
        <div>Score: <span className="text-amber-400">{score}</span></div>
        <div>Time Left: <span className={timeLeft <= 5 ? "text-rose-500" : "text-emerald-400"}>{timeLeft}s</span></div>
      </div>

      <div className="relative p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-6 gap-2 w-96 h-96">
          {grid.map((color, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => handleGemClick(idx)}
                style={{ backgroundColor: color }}
                className={`rounded-xl transition-all duration-150 shadow-md ${
                  isSelected ? "ring-4 ring-white scale-110" : "hover:scale-105"
                }`}
              />
            );
          })}
        </div>

        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4">
            <h2 className="text-3xl font-extrabold text-pink-500 uppercase tracking-widest">
              {gameState === "GAMEOVER" ? "Time Expired" : "Infinity Match"}
            </h2>
            {gameState === "GAMEOVER" && <p className="text-2xl font-bold">Final Score: {score}</p>}
            <p className="text-sm text-zinc-400">Match 3 or more gems to earn time & points!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {gameState === "GAMEOVER" ? "Play Again" : "Start Matching"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
