'use client';

import React, { useState, useEffect } from 'react';

type TileType = 'straight' | 'corner' | 'cross' | 't-shape';

interface Tile {
  type: TileType;
  rotation: number; // 0, 90, 180, 270
}

const GRID_SIZE = 5;

// Connections relative to tile rotation (top, right, bottom, left)
const BASE_CONNECTIONS: Record<TileType, boolean[]> = {
  'straight': [true, false, true, false],
  'corner': [true, true, false, false],
  'cross': [true, true, true, true],
  't-shape': [true, true, true, false],
};

function getConnections(type: TileType, rotation: number): boolean[] {
  const base = BASE_CONNECTIONS[type];
  const shifts = (rotation / 90) % 4;
  return [
    base[(4 - shifts) % 4],
    base[(5 - shifts) % 4],
    base[(6 - shifts) % 4],
    base[(7 - shifts) % 4],
  ];
}

export default function AstroLink() {
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [level, setLevel] = useState(1);
  const [connectedNodes, setConnectedNodes] = useState<boolean[][]>([]);

  const generateGrid = () => {
    const types: TileType[] = ['straight', 'corner', 'cross', 't-shape'];
    const newGrid: Tile[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push({
          type: types[Math.floor(Math.random() * types.length)],
          rotation: Math.floor(Math.random() * 4) * 90,
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  };

  const checkConnections = (currentGrid: Tile[][]) => {
    const connected: boolean[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false));
    const queue: [number, number][] = [[0, 0]];
    connected[0][0] = true;

    const dirs = [[-1, 0, 0, 2], [0, 1, 1, 3], [1, 0, 2, 0], [0, -1, 3, 1]]; // dr, dc, mySide, oppSide

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const tileConns = getConnections(currentGrid[r][c].type, currentGrid[r][c].rotation);

      for (const [dr, dc, mySide, oppSide] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !connected[nr][nc]) {
          if (tileConns[mySide]) {
            const nextConns = getConnections(currentGrid[nr][nc].type, currentGrid[nr][nc].rotation);
            if (nextConns[oppSide]) {
              connected[nr][nc] = true;
              queue.push([nr, nc]);
            }
          }
        }
      }
    }

    setConnectedNodes(connected);

    // Check win for level
    if (connected[GRID_SIZE - 1][GRID_SIZE - 1]) {
      const bonus = level * 100 + timeLeft * 5;
      const newScore = score + bonus;
      setScore(newScore);
      setLevel(l => l + 1);
      setTimeLeft(t => Math.min(60, t + 15));
      generateGrid();
    }
  };

  const rotateTile = (r: number, c: number) => {
    if (gameState !== 'PLAYING') return;
    const newGrid = grid.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri === r && ci === c) {
          return { ...cell, rotation: (cell.rotation + 90) % 360 };
        }
        return cell;
      })
    );
    setGrid(newGrid);
    checkConnections(newGrid);
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    generateGrid();
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (grid.length > 0 && gameState === 'PLAYING') {
      checkConnections(grid);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setGameState('GAMEOVER');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score } }));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, score]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-cyan-400">ASTRO LINK</h2>

      <div className="relative border-2 border-cyan-500/30 rounded-lg p-4 bg-zinc-900 flex flex-col items-center w-[360px] sm:w-[400px]">
        {gameState === 'PLAYING' && (
          <div className="w-full flex justify-between items-center mb-4 px-2">
            <span className="text-sm font-semibold text-zinc-300">Level: <span className="text-cyan-400">{level}</span></span>
            <span className="text-sm font-semibold text-zinc-300">Time: <span className="text-amber-400">{timeLeft}s</span></span>
            <span className="text-sm font-semibold text-zinc-300">Score: <span className="text-emerald-400">{score}</span></span>
          </div>
        )}

        {gameState === 'START' && (
          <div className="py-12 flex flex-col items-center text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">Rotate the power grid tiles to connect the top-left energy source to the bottom-right receiver!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              START PUZZLE
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="py-12 flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-red-400 mb-2">POWER DRAINED</h3>
            <p className="text-zinc-300 mb-4">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="grid grid-cols-5 gap-2 p-2 bg-zinc-950/80 rounded-xl border border-zinc-800">
            {grid.map((row, r) =>
              row.map((tile, c) => {
                const isConn = connectedNodes[r]?.[c];
                const isStart = r === 0 && c === 0;
                const isEnd = r === GRID_SIZE - 1 && c === GRID_SIZE - 1;

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => rotateTile(r, c)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border flex items-center justify-center transition-all duration-200 relative ${
                      isConn
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-500'
                    }`}
                  >
                    {isStart && <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-emerald-400">IN</span>}
                    {isEnd && <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-amber-400">OUT</span>}

                    <div
                      className="transition-transform duration-200"
                      style={{ transform: `rotate(${tile.rotation}deg)` }}
                    >
                      <TileIcon type={tile.type} isConnected={isConn} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TileIcon({ type, isConnected }: { type: TileType; isConnected: boolean }) {
  const stroke = isConnected ? '#38bdf8' : '#64748b';

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round">
      {type === 'straight' && <line x1="12" y1="2" x2="12" y2="22" />}
      {type === 'corner' && <path d="M12 2v10h10" />}
      {type === 'cross' && (
        <>
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </>
      )}
      {type === 't-shape' && (
        <>
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="12" y1="12" x2="22" y2="12" />
        </>
      )}
    </svg>
  );
}
