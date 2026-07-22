"use client";
import { useState } from "react";

type BuildingType = "forest" | "lake" | "mountain" | "citadel";

interface Tile {
  building: BuildingType | null;
  score: number;
}

const BUILDINGS: { type: BuildingType; name: string; icon: string; cost: number; desc: string }[] = [
  { type: "forest", name: "Forest", icon: "🌲", cost: 1, desc: "+100 pts (+50 near Lake)" },
  { type: "lake", name: "Lake", icon: "🌊", cost: 1, desc: "+150 pts (+50 near Mountain)" },
  { type: "mountain", name: "Mountain", icon: "⛰️", cost: 1, desc: "+200 pts (+100 near Forest)" },
  { type: "citadel", name: "Citadel", icon: "🏰", cost: 2, desc: "+300 pts (+150 with varied neighbors)" },
];

const GRID_SIZE = 5;

const createEmptyGrid = (): Tile[][] =>
  Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ building: null, score: 0 }))
  );

export default function TerraBuilder() {
  const [grid, setGrid] = useState<Tile[][]>(createEmptyGrid);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType>("forest");
  const [energy, setEnergy] = useState(15);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const calculateTotalScore = (newGrid: Tile[][]) => {
    let total = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const b = newGrid[r][c].building;
        if (!b) continue;

        let tileScore = 0;
        const neighbors: BuildingType[] = [];
        const dirs = [
          [-1, 0], [1, 0], [0, -1], [0, 1],
        ];

        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            const nb = newGrid[nr][nc].building;
            if (nb) neighbors.push(nb);
          }
        }

        if (b === "forest") {
          tileScore = 100 + neighbors.filter((n) => n === "lake").length * 50;
        } else if (b === "lake") {
          tileScore = 150 + neighbors.filter((n) => n === "mountain").length * 50;
        } else if (b === "mountain") {
          tileScore = 200 + neighbors.filter((n) => n === "forest").length * 100;
        } else if (b === "citadel") {
          const uniqueTypes = new Set(neighbors).size;
          tileScore = 300 + (uniqueTypes >= 2 ? 150 : 0);
        }

        total += tileScore;
      }
    }
    return total;
  };

  const handleTileClick = (r: number, c: number) => {
    if (gameOver || grid[r][c].building) return;

    const bInfo = BUILDINGS.find((b) => b.type === selectedBuilding)!;
    if (energy < bInfo.cost) return;

    const newGrid = grid.map((row, ri) =>
      row.map((tile, ci) => (ri === r && ci === c ? { ...tile, building: selectedBuilding } : tile))
    );

    const newEnergy = energy - bInfo.cost;
    const newScore = calculateTotalScore(newGrid);

    setGrid(newGrid);
    setEnergy(newEnergy);
    setScore(newScore);

    // Check if board full or no energy left
    const isFull = newGrid.every((row) => row.every((t) => t.building !== null));
    if (newEnergy <= 0 || isFull) {
      setGameOver(true);
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", { detail: { score: newScore } })
      );
    }
  };

  const restart = () => {
    setGrid(createEmptyGrid());
    setSelectedBuilding("forest");
    setEnergy(15);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-emerald-400 mb-1">Terra Builder</h2>
        <p className="text-zinc-400 text-xs mb-4">Build ecosystems and maximize terrain synergy!</p>

        {/* Stats */}
        <div className="w-full flex justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800 mb-4 font-mono text-sm">
          <div>
            ECO SCORE: <span className="text-emerald-400 font-bold">{score}</span>
          </div>
          <div>
            ENERGY: <span className="text-amber-400 font-bold">{energy}⚡</span>
          </div>
        </div>

        {/* Building Selector */}
        <div className="grid grid-cols-4 gap-2 w-full mb-4">
          {BUILDINGS.map((b) => (
            <button
              key={b.type}
              onClick={() => setSelectedBuilding(b.type)}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                selectedBuilding === b.type
                  ? "bg-emerald-950 border-emerald-500 scale-105 shadow-md shadow-emerald-500/20"
                  : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              <span className="text-xl">{b.icon}</span>
              <span className="text-[10px] font-bold mt-1 text-zinc-300">{b.name}</span>
              <span className="text-[9px] text-amber-400 font-mono">{b.cost}⚡</span>
            </button>
          ))}
        </div>

        {/* 5x5 Grid */}
        <div className="relative p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="grid grid-cols-5 gap-2">
            {grid.map((row, r) =>
              row.map((tile, c) => (
                <button
                  key={`${r}-${c}`}
                  disabled={gameOver || tile.building !== null}
                  onClick={() => handleTileClick(r, c)}
                  className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl transition-all duration-200 ${
                    tile.building
                      ? "bg-zinc-800 border-zinc-700 shadow-inner"
                      : "bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:border-emerald-500/50 cursor-pointer"
                  }`}
                >
                  {tile.building ? (
                    BUILDINGS.find((b) => b.type === tile.building)?.icon
                  ) : (
                    <span className="text-zinc-800 text-xs">+</span>
                  )}
                </button>
              ))
            )}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
              <h3 className="text-emerald-400 font-extrabold text-2xl uppercase tracking-wider">World Created!</h3>
              <p className="text-zinc-300 text-sm">Final Synergy Score: <span className="text-emerald-400 font-bold">{score}</span></p>
              <button
                onClick={restart}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold uppercase text-xs rounded-lg transition"
              >
                Terraform Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
