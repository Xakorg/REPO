"use client";
import React, { useEffect, useState } from "react";

interface Node {
  r: number;
  c: number;
  active: boolean;
  color: string;
}

export default function PyroLink() {
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [grid, setGrid] = useState<Node[][]>([]);
  const [targetPattern, setTargetPattern] = useState<boolean[]>([]);

  const colors = ["#ef4444", "#f97316", "#facc15", "#ea580c"];

  const generateGrid = () => {
    const newGrid: Node[][] = [];
    for (let r = 0; r < 5; r++) {
      const row: Node[] = [];
      for (let c = 0; c < 5; c++) {
        row.push({
          r,
          c,
          active: Math.random() > 0.6,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    generateGrid();
    setGameState("PLAYING");
  };

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameState("GAMEOVER");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === "GAMEOVER") {
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", {
          detail: { score },
        })
      );
    }
  }, [gameState, score]);

  const toggleNode = (r: number, c: number) => {
    if (gameState !== "PLAYING") return;
    const updated = grid.map((row) => row.map((node) => ({ ...node })));

    // Toggle self & 4 neighbors
    const coords = [
      [r, c],
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];

    coords.forEach(([nr, nc]) => {
      if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
        updated[nr][nc].active = !updated[nr][nc].active;
      }
    });

    setGrid(updated);
    setScore((s) => s + 50);

    // Check if all active
    const allActive = updated.every((row) => row.every((n) => n.active));
    if (allActive) {
      setScore((s) => s + 500);
      setTimeLeft((t) => t + 5);
      generateGrid();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 text-xl font-bold uppercase tracking-wider">
        <div>Score: <span className="text-orange-400">{score}</span></div>
        <div>Time Left: <span className={timeLeft <= 5 ? "text-red-500 animate-bounce" : "text-amber-400"}>{timeLeft}s</span></div>
      </div>

      <div className="relative w-[500px] h-[500px] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 shadow-2xl">
        {gameState === "PLAYING" ? (
          <div className="grid grid-cols-5 gap-3 w-full h-full">
            {grid.map((row, r) =>
              row.map((node, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => toggleNode(r, c)}
                  style={{ backgroundColor: node.active ? node.color : "#27272a" }}
                  className={`rounded-xl transition-all duration-200 transform active:scale-90 border border-zinc-700 flex items-center justify-center shadow-lg ${
                    node.active ? "shadow-orange-500/50 scale-105" : "opacity-60"
                  }`}
                >
                  <span className="text-2xl">{node.active ? "🔥" : "⚫"}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-orange-500">PYRO LINK</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-orange-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400 max-w-xs text-center">
              Click nodes to ignite adjacent flames. Light all nodes to complete the Pyro Link before time runs out!
            </p>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
