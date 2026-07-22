'use client';

import React, { useState } from 'react';

type BiomeType = 'Forest' | 'Mountain' | 'Field' | 'River' | 'Village';

const BIOMES: { type: BiomeType; icon: string; name: string }[] = [
  { type: 'Forest', icon: '🌲', name: 'Forest' },
  { type: 'Mountain', icon: '⛰️', name: 'Mountain' },
  { type: 'Field', icon: '🌾', name: 'Field' },
  { type: 'River', icon: '🌊', name: 'River' },
  { type: 'Village', icon: '🏰', name: 'Village' },
];

const GRID_SIZE = 5;

export default function TerraQuest2() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [grid, setGrid] = useState<(BiomeType | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [currentTile, setCurrentTile] = useState<BiomeType>('Forest');
  const [score, setScore] = useState(0);
  const [turnsLeft, setTurnsLeft] = useState(15);
  const [lastBonus, setLastBonus] = useState<string | null>(null);

  const getRandomBiome = (): BiomeType => {
    return BIOMES[Math.floor(Math.random() * BIOMES.length)].type;
  };

  const startGame = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setScore(0);
    setTurnsLeft(15);
    setLastBonus(null);
    setCurrentTile(getRandomBiome());
    setGameState('PLAYING');
  };

  const calculateTileScore = (r: number, c: number, type: BiomeType, currentGrid: (BiomeType | null)[][]): { points: number; bonusMsg: string } => {
    let points = 10;
    let bonuses: string[] = [];

    const neighbors = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];

    neighbors.forEach(([nr, nc]) => {
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        const neighborTile = currentGrid[nr][nc];
        if (!neighborTile) return;

        if (type === 'Forest' && neighborTile === 'River') {
          points += 20;
          bonuses.push('Forest + River (+20)');
        } else if (type === 'River' && neighborTile === 'Forest') {
          points += 20;
          bonuses.push('River + Forest (+20)');
        } else if (type === 'Village' && neighborTile === 'Field') {
          points += 30;
          bonuses.push('Village + Field (+30)');
        } else if (type === 'Field' && neighborTile === 'Village') {
          points += 30;
          bonuses.push('Field + Village (+30)');
        } else if (type === 'Mountain' && neighborTile === 'Forest') {
          points += 25;
          bonuses.push('Mountain + Forest (+25)');
        } else if (type === 'Forest' && neighborTile === 'Mountain') {
          points += 25;
          bonuses.push('Forest + Mountain (+25)');
        } else if (type === neighborTile) {
          points += 15;
          bonuses.push('Biome Cluster (+15)');
        }
      }
    });

    return { points, bonusMsg: bonuses.length > 0 ? bonuses.join(', ') : 'Base Tile (+10)' };
  };

  const placeTile = (r: number, c: number) => {
    if (gameState !== 'PLAYING' || grid[r][c] !== null) return;

    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = currentTile;
    setGrid(newGrid);

    const { points, bonusMsg } = calculateTileScore(r, c, currentTile, newGrid);
    const newScore = score + points;
    setScore(newScore);
    setLastBonus(`+${points} pts: ${bonusMsg}`);

    const newTurns = turnsLeft - 1;
    setTurnsLeft(newTurns);

    if (newTurns <= 0) {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: newScore } }));
      setGameState('GAMEOVER');
    } else {
      setCurrentTile(getRandomBiome());
    }
  };

  const getTileIcon = (biome: BiomeType | null) => {
    if (!biome) return '';
    return BIOMES.find((b) => b.type === biome)?.icon || '';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-[400px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-400">Terra Quest 2</h2>
          <p className="text-xs text-zinc-400">Expand your realm & optimize biomes</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-emerald-300">Score: {score}</div>
          <div className="text-sm text-zinc-400">Tiles Left: {turnsLeft}</div>
        </div>
      </div>

      {gameState === 'PLAYING' && (
        <div className="flex items-center justify-between w-[400px] mb-3 bg-zinc-900 border border-emerald-900/50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Next Biome:</span>
            <span className="text-2xl">{BIOMES.find((b) => b.type === currentTile)?.icon}</span>
            <span className="font-bold text-emerald-300">{currentTile}</span>
          </div>
          {lastBonus && <div className="text-xs text-emerald-400 font-semibold">{lastBonus}</div>}
        </div>
      )}

      <div className="relative border border-emerald-900/50 rounded-xl p-3 bg-zinc-900 w-[400px] h-[400px]">
        <div className="grid grid-cols-5 gap-2 w-full h-full">
          {grid.map((row, r) =>
            row.map((biome, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => placeTile(r, c)}
                disabled={biome !== null || gameState !== 'PLAYING'}
                className={`flex items-center justify-center text-3xl rounded-xl border transition ${
                  biome
                    ? 'bg-zinc-800 border-emerald-700'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-emerald-500 hover:bg-zinc-900'
                }`}
              >
                {getTileIcon(biome)}
              </button>
            ))
          )}
        </div>

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-3xl font-extrabold text-emerald-400 mb-2">TERRA QUEST 2</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Place biomes strategically on the grid. Match Forest with River, Village with Field, and Mountain with Forest for high synergy scores!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
            >
              Start Expedition
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-3xl font-extrabold text-emerald-400 mb-2">EXPEDITION COMPLETE</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Realm Score: <span className="text-emerald-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
            >
              Build New Realm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
