"use client";
import { useState } from "react";

type TileType = "past" | "present" | "future" | "paradox" | "artifact";

interface Tile {
  type: TileType;
  visited: boolean;
  value: number;
}

const GRID_SIZE = 6;

const generateGrid = (): Tile[][] => {
  const types: TileType[] = ["past", "present", "present", "future", "paradox", "artifact"];
  const grid: Tile[][] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      if (r === 0 && c === 0) {
        row.push({ type: "present", visited: true, value: 0 });
      } else {
        const randType = types[Math.floor(Math.random() * types.length)];
        let val = 100;
        if (randType === "past") val = 50;
        if (randType === "future") val = 200;
        if (randType === "paradox") val = -100;
        if (randType === "artifact") val = 300;
        row.push({ type: randType, visited: false, value: val });
      }
    }
    grid.push(row);
  }
  return grid;
};

export default function ChronoQuest() {
  const [grid, setGrid] = useState<Tile[][]>(generateGrid);
  const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(20);
  const [hp, setHp] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  const movePlayer = (dr: number, dc: number) => {
    if (gameOver) return;

    const newR = playerPos.r + dr;
    const newC = playerPos.c + dc;

    if (newR < 0 || newR >= GRID_SIZE || newC < 0 || newC >= GRID_SIZE) return;

    const targetTile = grid[newR][newC];
    let newScore = score + targetTile.value;
    let newHp = hp;
    let newEnergy = energy - 1;

    if (targetTile.type === "paradox") {
      newHp -= 1;
    } else if (targetTile.type === "artifact") {
      newEnergy += 3;
    }

    // Update grid
    const updatedGrid = grid.map((row, r) =>
      row.map((tile, c) => (r === newR && c === newC ? { ...tile, visited: true } : tile))
    );

    setGrid(updatedGrid);
    setPlayerPos({ r: newR, c: newC });
    setScore(Math.max(0, newScore));
    setEnergy(newEnergy);
    setHp(newHp);

    // Check level complete (reaching bottom-right corner)
    if (newR === GRID_SIZE - 1 && newC === GRID_SIZE - 1) {
      const bonusScore = newScore + 500 * level;
      setScore(bonusScore);
      setLevel((l) => l + 1);
      setEnergy((e) => e + 10);
      setGrid(generateGrid());
      setPlayerPos({ r: 0, c: 0 });
      return;
    }

    // Check Game Over
    if (newHp <= 0 || newEnergy <= 0) {
      setGameOver(true);
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", { detail: { score: Math.max(0, newScore) } })
      );
    }
  };

  const restart = () => {
    setGrid(generateGrid());
    setPlayerPos({ r: 0, c: 0 });
    setScore(0);
    setEnergy(20);
    setHp(3);
    setLevel(1);
    setGameOver(false);
  };

  const getTileBg = (tile: Tile, isPlayer: boolean, isGoal: boolean) => {
    if (isPlayer) return "bg-cyan-500 shadow-lg shadow-cyan-500/50 scale-105 z-10 border-2 border-white";
    if (isGoal) return "bg-amber-500 animate-pulse border-2 border-yellow-300";
    if (tile.visited) return "bg-zinc-800 border-zinc-700 opacity-60";

    switch (tile.type) {
      case "past":
        return "bg-blue-950 hover:bg-blue-900 border-blue-700/50";
      case "present":
        return "bg-zinc-900 hover:bg-zinc-800 border-zinc-700/50";
      case "future":
        return "bg-emerald-950 hover:bg-emerald-900 border-emerald-700/50";
      case "paradox":
        return "bg-red-950 hover:bg-red-900 border-red-700/50";
      case "artifact":
        return "bg-purple-950 hover:bg-purple-900 border-purple-700/50";
    }
  };

  const getTileLabel = (tile: Tile, isGoal: boolean) => {
    if (isGoal) return "🌀 Portal";
    switch (tile.type) {
      case "past": return "⏳ Past";
      case "present": return "⌛ Present";
      case "future": return "✨ Future";
      case "paradox": return "💥 Paradox";
      case "artifact": return "💎 Relic";
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-cyan-400 mb-1">Chrono Quest</h2>
        <p className="text-zinc-400 text-xs mb-4">Traverse the timeline to reach the Temporal Portal!</p>

        {/* Stats */}
        <div className="w-full grid grid-cols-4 gap-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800 mb-4 text-center text-xs font-mono">
          <div>
            <div className="text-zinc-500">SCORE</div>
            <div className="text-cyan-400 font-bold text-base">{score}</div>
          </div>
          <div>
            <div className="text-zinc-500">ENERGY</div>
            <div className="text-amber-400 font-bold text-base">{energy}</div>
          </div>
          <div>
            <div className="text-zinc-500">HEALTH</div>
            <div className="text-red-400 font-bold text-base">{"❤️".repeat(Math.max(0, hp))}</div>
          </div>
          <div>
            <div className="text-zinc-500">DIMENSION</div>
            <div className="text-purple-400 font-bold text-base">Lvl {level}</div>
          </div>
        </div>

        {/* Grid */}
        <div className="relative p-2 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="grid grid-cols-6 gap-2">
            {grid.map((row, r) =>
              row.map((tile, c) => {
                const isPlayer = playerPos.r === r && playerPos.c === c;
                const isGoal = r === GRID_SIZE - 1 && c === GRID_SIZE - 1;
                const isAdjacent =
                  Math.abs(playerPos.r - r) + Math.abs(playerPos.c - c) === 1;

                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={!isAdjacent || gameOver}
                    onClick={() => movePlayer(r - playerPos.r, c - playerPos.c)}
                    className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all duration-200 ${getTileBg(
                      tile,
                      isPlayer,
                      isGoal
                    )} ${isAdjacent && !gameOver ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                  >
                    {isPlayer ? (
                      <span className="text-lg animate-bounce">⏳</span>
                    ) : (
                      <span>{getTileLabel(tile, isGoal)}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
              <h3 className="text-red-500 font-extrabold text-2xl uppercase tracking-wider">Time Collapse</h3>
              <p className="text-zinc-300 text-sm">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
              <button
                onClick={restart}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold uppercase text-xs rounded-lg transition"
              >
                Reset Timeline
              </button>
            </div>
          )}
        </div>

        {/* Directional Pad */}
        <div className="mt-4 grid grid-cols-3 gap-2 w-36">
          <div />
          <button
            onClick={() => movePlayer(-1, 0)}
            className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg text-xs font-bold border border-zinc-700"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => movePlayer(0, -1)}
            className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg text-xs font-bold border border-zinc-700"
          >
            ◀
          </button>
          <button
            onClick={() => movePlayer(1, 0)}
            className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg text-xs font-bold border border-zinc-700"
          >
            ▼
          </button>
          <button
            onClick={() => movePlayer(0, 1)}
            className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg text-xs font-bold border border-zinc-700"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
