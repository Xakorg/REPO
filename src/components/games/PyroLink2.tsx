"use client";

import React, { useEffect, useState } from "react";

type TileType = "I" | "L" | "T" | "X";

interface Tile {
  type: TileType;
  rotation: number; // 0, 90, 180, 270
}

const GRID_SIZE = 4;

export default function PyroLink2() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [connected, setConnected] = useState<boolean[][]>([]);

  const generateBoard = () => {
    const types: TileType[] = ["I", "L", "T", "X"];
    const newGrid: Tile[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const rotation = Math.floor(Math.random() * 4) * 90;
        row.push({ type, rotation });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    generateBoard();
    setGameState("playing");
  };

  // Check connections (top, right, bottom, left)
  const getOpenings = (tile: Tile): boolean[] => {
    // [Top, Right, Bottom, Left]
    let base = [false, false, false, false];
    if (tile.type === "I") base = [true, false, true, false];
    else if (tile.type === "L") base = [true, true, false, false];
    else if (tile.type === "T") base = [true, true, true, false];
    else if (tile.type === "X") base = [true, true, true, true];

    const shift = (tile.rotation / 90) % 4;
    const result = [false, false, false, false];
    for (let i = 0; i < 4; i++) {
      result[(i + shift) % 4] = base[i];
    }
    return result;
  };

  useEffect(() => {
    if (gameState !== "playing" || grid.length === 0) return;

    // BFS from (0,0)
    const conn: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    const queue: [number, number][] = [[0, 0]];
    conn[0][0] = true;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const openings = getOpenings(grid[r][c]);

      // Top (r-1, c)
      if (openings[0] && r > 0) {
        const neighborOpenings = getOpenings(grid[r - 1][c]);
        if (neighborOpenings[2] && !conn[r - 1][c]) {
          conn[r - 1][c] = true;
          queue.push([r - 1, c]);
        }
      }
      // Right (r, c+1)
      if (openings[1] && c < GRID_SIZE - 1) {
        const neighborOpenings = getOpenings(grid[r][c + 1]);
        if (neighborOpenings[3] && !conn[r][c + 1]) {
          conn[r][c + 1] = true;
          queue.push([r, c + 1]);
        }
      }
      // Bottom (r+1, c)
      if (openings[2] && r < GRID_SIZE - 1) {
        const neighborOpenings = getOpenings(grid[r + 1][c]);
        if (neighborOpenings[0] && !conn[r + 1][c]) {
          conn[r + 1][c] = true;
          queue.push([r + 1, c]);
        }
      }
      // Left (r, c-1)
      if (openings[3] && c > 0) {
        const neighborOpenings = getOpenings(grid[r][c - 1]);
        if (neighborOpenings[1] && !conn[r][c - 1]) {
          conn[r][c - 1] = true;
          queue.push([r, c - 1]);
        }
      }
    }

    setConnected(conn);

    // If bottom right is connected, level completed!
    if (conn[GRID_SIZE - 1][GRID_SIZE - 1]) {
      const newScore = score + 200;
      setScore(newScore);
      setTimeLeft((prev) => prev + 15);
      generateBoard();
    }
  }, [grid, gameState]);

  // Timer tick
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("gameover");
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score } }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, score]);

  const rotateTile = (r: number, c: number) => {
    if (gameState !== "playing") return;
    setGrid((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[r][c] = {
        ...copy[r][c],
        rotation: (copy[r][c].rotation + 90) % 360,
      };
      return copy;
    });
  };

  const renderPipeSVG = (type: TileType, isLit: boolean) => {
    const stroke = isLit ? "#f97316" : "#52525b";
    const fill = isLit ? "#ffedd5" : "transparent";

    return (
      <svg className="w-12 h-12" viewBox="0 0 100 100">
        {type === "I" && (
          <path d="M 50 0 L 50 100" stroke={stroke} strokeWidth="18" strokeLinecap="round" />
        )}
        {type === "L" && (
          <path d="M 50 0 L 50 50 L 100 50" stroke={stroke} strokeWidth="18" fill="none" strokeLinecap="round" />
        )}
        {type === "T" && (
          <path d="M 50 0 L 50 100 M 50 50 L 100 50" stroke={stroke} strokeWidth="18" fill="none" strokeLinecap="round" />
        )}
        {type === "X" && (
          <path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke={stroke} strokeWidth="18" fill="none" strokeLinecap="round" />
        )}
        {isLit && <circle cx="50" cy="50" r="10" fill="#f97316" />}
      </svg>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white relative p-4">
      {gameState === "start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h1 className="text-4xl font-bold text-orange-500 mb-4 tracking-wider">PYRO LINK 2</h1>
          <p className="text-zinc-400 mb-2">Rotate the flame conduits to connect the Fire Source (Top-Left) to the Target (Bottom-Right)!</p>
          <p className="text-sm text-zinc-500 mb-6">Click any tile to rotate 90 degrees</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            START LINK
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90">
          <h2 className="text-3xl font-bold text-red-500 mb-2">FLAME EXTINGUISHED</h2>
          <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Top HUD */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 bg-zinc-900 px-6 py-3 rounded-xl border border-orange-500/30">
        <div>
          <span className="text-zinc-400 text-xs uppercase block">Score</span>
          <span className="text-2xl font-bold text-orange-400">{score}</span>
        </div>
        <div>
          <span className="text-zinc-400 text-xs uppercase block">Time Remaining</span>
          <span className={`text-2xl font-bold ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-amber-400"}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-4 gap-3 bg-zinc-900 p-6 rounded-2xl border-2 border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const isLit = connected[r]?.[c];
            const isSource = r === 0 && c === 0;
            const isTarget = r === GRID_SIZE - 1 && c === GRID_SIZE - 1;

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => rotateTile(r, c)}
                className={`w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-200 relative border-2 ${
                  isLit
                    ? "bg-orange-950/50 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    : "bg-zinc-800/80 border-zinc-700 hover:border-zinc-500"
                }`}
              >
                {isSource && (
                  <span className="absolute top-1 left-1 text-[10px] bg-red-600 text-white px-1 rounded font-bold uppercase z-10">
                    SRC
                  </span>
                )}
                {isTarget && (
                  <span className="absolute bottom-1 right-1 text-[10px] bg-amber-500 text-black px-1 rounded font-bold uppercase z-10">
                    TGT
                  </span>
                )}
                <div
                  style={{ transform: `rotate(${tile.rotation}deg)` }}
                  className="transition-transform duration-200"
                >
                  {renderPipeSVG(tile.type, isLit)}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
