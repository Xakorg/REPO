'use client';

import React, { useState } from 'react';

const GRID_SIZE = 6;

interface Guard {
  id: number;
  x: number;
  y: number;
  dir: 'N' | 'E' | 'S' | 'W';
}

export default function ShadowForce() {
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 5]);
  const [guards, setGuards] = useState<Guard[]>([
    { id: 1, x: 2, y: 1, dir: 'S' },
    { id: 2, x: 4, y: 3, dir: 'W' },
    { id: 3, x: 1, y: 4, dir: 'E' },
  ]);
  const [orbs, setOrbs] = useState<[number, number][]>([
    [1, 1],
    [3, 2],
    [4, 4],
  ]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const initGame = () => {
    setPlayerPos([0, 5]);
    setGuards([
      { id: 1, x: 2, y: 1, dir: 'S' },
      { id: 2, x: 4, y: 3, dir: 'W' },
      { id: 3, x: 1, y: 4, dir: 'E' },
    ]);
    setOrbs([
      [1, 1],
      [3, 2],
      [4, 4],
    ]);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(true);
  };

  const getVisionTiles = (guardList: Guard[]) => {
    const vision = new Set<string>();
    guardList.forEach((g) => {
      const dirOffsets = {
        N: [0, -1],
        E: [1, 0],
        S: [0, 1],
        W: [-1, 0],
      };
      const [dx, dy] = dirOffsets[g.dir];
      for (let step = 1; step <= 2; step++) {
        const vx = g.x + dx * step;
        const vy = g.y + dy * step;
        if (vx >= 0 && vx < GRID_SIZE && vy >= 0 && vy < GRID_SIZE) {
          vision.add(`${vx},${vy}`);
        }
      }
    });
    return vision;
  };

  const movePlayer = (nx: number, ny: number) => {
    if (!gameStarted || gameOver || gameWon) return;

    const [px, py] = playerPos;
    const isAdj = Math.abs(px - nx) + Math.abs(py - ny) === 1;
    if (!isAdj) return;

    const newPlayerPos: [number, number] = [nx, ny];
    setPlayerPos(newPlayerPos);

    // Check Orb collection
    let currentScore = score;
    const remainingOrbs = orbs.filter(([ox, oy]) => {
      if (ox === nx && oy === ny) {
        currentScore += 200;
        setScore(currentScore);
        return false;
      }
      return true;
    });
    setOrbs(remainingOrbs);

    // Check Victory
    if (nx === 5 && ny === 0) {
      const finalScore = currentScore + 1000;
      setScore(finalScore);
      setGameWon(true);
      window.dispatchEvent(
        new CustomEvent('xakteir-game-score', { detail: { score: finalScore } })
      );
      return;
    }

    // Move Guards (rotate direction or step)
    const dirs: ('N' | 'E' | 'S' | 'W')[] = ['N', 'E', 'S', 'W'];
    const updatedGuards = guards.map((g) => {
      // 50% chance rotate, 50% step forward
      if (Math.random() > 0.5) {
        const nextDirIndex = (dirs.indexOf(g.dir) + 1) % 4;
        return { ...g, dir: dirs[nextDirIndex] };
      } else {
        const dirOffsets = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
        const [dx, dy] = dirOffsets[g.dir];
        let gx = g.x + dx;
        let gy = g.y + dy;
        let dir = g.dir;
        if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) {
          // turn back
          dir = dirs[(dirs.indexOf(g.dir) + 2) % 4];
          gx = g.x;
          gy = g.y;
        }
        return { ...g, x: gx, y: gy, dir };
      }
    });

    setGuards(updatedGuards);

    // Check detection by guards or vision
    const vision = getVisionTiles(updatedGuards);
    const inVision = vision.has(`${nx},${ny}`);
    const onGuard = updatedGuards.some((g) => g.x === nx && g.y === ny);

    if (inVision || onGuard) {
      setGameOver(true);
      window.dispatchEvent(
        new CustomEvent('xakteir-game-score', { detail: { score: currentScore } })
      );
    }
  };

  const visionTiles = getVisionTiles(guards);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[380px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-slate-300">SHADOW FORCE</h2>
        <div className="text-sm font-semibold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-purple-400">
          Score: {score}
        </div>
      </div>

      <div className="relative p-3 bg-zinc-900 border-2 border-slate-700 rounded-xl shadow-lg">
        <div className="grid grid-cols-6 gap-1.5 w-[320px] h-[320px]">
          {Array.from({ length: GRID_SIZE }).map((_, y) =>
            Array.from({ length: GRID_SIZE }).map((_, x) => {
              const isPlayer = playerPos[0] === x && playerPos[1] === y;
              const isPortal = x === 5 && y === 0;
              const guard = guards.find((g) => g.x === x && g.y === y);
              const isOrb = orbs.some(([ox, oy]) => ox === x && oy === y);
              const isVision = visionTiles.has(`${x},${y}`);

              return (
                <button
                  key={`${x}-${y}`}
                  onClick={() => movePlayer(x, y)}
                  className={`w-12 h-12 rounded flex items-center justify-center text-lg transition ${
                    isPlayer
                      ? 'bg-purple-600 shadow-lg shadow-purple-500/50'
                      : isPortal
                      ? 'bg-emerald-600 animate-pulse'
                      : isVision
                      ? 'bg-red-950/80 border border-red-500/50'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {isPlayer ? (
                    '🥷'
                  ) : guard ? (
                    '💂'
                  ) : isPortal ? (
                    '🚪'
                  ) : isOrb ? (
                    '🔮'
                  ) : (
                    ''
                  )}
                </button>
              );
            })
          )}
        </div>

        {(!gameStarted || gameOver || gameWon) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">
              {gameWon ? 'MISSION COMPLETE!' : gameOver ? 'SPOTTED & CAUGHT!' : 'SHADOW FORCE'}
            </h3>
            {(gameOver || gameWon) && <p className="text-zinc-300 mb-4">Stealth Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition transform hover:scale-105"
            >
              {gameOver || gameWon ? 'Replay Mission' : 'Start Mission'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Click adjacent tiles to sneak past guards (red vision zones) to reach the exit portal!</p>
    </div>
  );
}
