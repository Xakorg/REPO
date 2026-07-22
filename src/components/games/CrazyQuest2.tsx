'use client';

import React, { useState } from 'react';

type TileType = 'chest' | 'monster' | 'potion' | 'trap' | 'boss' | 'empty';

interface Tile {
  type: TileType;
  revealed: boolean;
}

export default function CrazyQuest2() {
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [hp, setHp] = useState(100);
  const [gold, setGold] = useState(0);
  const [score, setScore] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('START');

  const initGame = () => {
    const types: TileType[] = ['chest', 'monster', 'potion', 'trap', 'empty'];
    const newGrid: Tile[][] = [];

    for (let r = 0; r < 5; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < 5; c++) {
        if (r === 4 && c === 4) {
          row.push({ type: 'boss', revealed: false });
        } else if (r === 0 && c === 0) {
          row.push({ type: 'empty', revealed: true });
        } else {
          const randType = types[Math.floor(Math.random() * types.length)];
          row.push({ type: randType, revealed: false });
        }
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setHp(100);
    setGold(0);
    setScore(0);
    setLog(['You enter the dark dungeon of Crazy Quest! Find the Boss at [5,5]']);
    setGameState('PLAYING');
  };

  const handleTileClick = (r: number, c: number) => {
    if (gameState !== 'PLAYING') return;

    const tile = grid[r][c];
    if (tile.revealed) return;

    const nextGrid = grid.map((row) => [...row]);
    nextGrid[r][c].revealed = true;
    setGrid(nextGrid);

    let newHp = hp;
    let newGold = gold;
    let newScore = score;
    let eventText = '';

    switch (tile.type) {
      case 'chest': {
        const reward = Math.floor(30 + Math.random() * 50);
        newGold += reward;
        newScore += reward * 2;
        eventText = `Found a treasure chest! +${reward} Gold (+${reward * 2} Score)`;
        break;
      }
      case 'potion': {
        const heal = 25;
        newHp = Math.min(100, newHp + heal);
        newScore += 20;
        eventText = `Drank a health potion! +${heal} HP.`;
        break;
      }
      case 'monster': {
        const dmg = Math.floor(20 + Math.random() * 15);
        newHp -= dmg;
        newScore += 50;
        eventText = `Fought a dungeon goblin! Took ${dmg} DMG (+50 Score).`;
        break;
      }
      case 'trap': {
        const dmg = 20;
        newHp -= dmg;
        eventText = `Triggered a spike trap! Took ${dmg} DMG.`;
        break;
      }
      case 'boss': {
        const dmg = 45;
        newHp -= dmg;
        if (newHp > 0) {
          newScore += 500;
          setScore(newScore);
          setGameState('VICTORY');
          eventText = `Slayed the Dungeon Boss! VICTORY!`;
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: newScore } })
          );
        } else {
          eventText = `The Boss crushed you...`;
        }
        break;
      }
      case 'empty': {
        eventText = `An empty chamber. All clear.`;
        newScore += 10;
        break;
      }
    }

    setHp(newHp);
    setGold(newGold);
    setScore(newScore);
    setLog((prev) => [eventText, ...prev.slice(0, 4)]);

    if (newHp <= 0 && (gameState as string) !== 'VICTORY') {
      setGameState('GAMEOVER');
      window.dispatchEvent(
        new CustomEvent('xakteir-game-score', { detail: { score: newScore } })
      );
    }
  };

  const getTileSymbol = (tile: Tile) => {
    if (!tile.revealed) return '❓';
    switch (tile.type) {
      case 'chest': return '🏆';
      case 'monster': return '👾';
      case 'potion': return '🧪';
      case 'trap': return '💥';
      case 'boss': return '👹';
      case 'empty': return '⬛';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold tracking-wider text-yellow-500 mb-2">CRAZY QUEST 2</h2>

      <div className="relative w-full bg-zinc-900 border border-yellow-500/30 rounded-lg p-4 flex flex-col items-center justify-between min-h-[380px]">
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-xl font-bold text-yellow-400 mb-2 font-mono">Grid Dungeon Crawler</h3>
            <p className="text-zinc-400 text-sm mb-6">Explore tiles, gather gold, survive traps, and defeat the Boss at the end!</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Enter Dungeon
            </button>
          </div>
        )}

        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className={`text-2xl font-bold mb-2 ${gameState === 'VICTORY' ? 'text-emerald-400' : 'text-rose-500'}`}>
              {gameState === 'VICTORY' ? 'DUNGEON CONQUERED!' : 'YOU DIED IN THE DUNGEON'}
            </h3>
            <p className="text-zinc-300 text-lg mb-1">Final Quest Score:</p>
            <p className="text-3xl font-extrabold text-yellow-400 mb-6">{score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              New Quest
            </button>
          </div>
        )}

        {/* Stats Header */}
        <div className="flex justify-between w-full bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-xs font-bold mb-3">
          <span className="text-red-400">HP: {hp}/100</span>
          <span className="text-yellow-400">GOLD: {gold}</span>
          <span className="text-amber-300">SCORE: {score}</span>
        </div>

        {/* Dungeon Grid */}
        <div className="grid grid-cols-5 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          {grid.map((row, r) =>
            row.map((tile, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleTileClick(r, c)}
                disabled={tile.revealed}
                className={`w-12 h-12 text-2xl flex items-center justify-center rounded-lg border transition-all ${
                  tile.revealed
                    ? 'bg-zinc-800 border-zinc-700'
                    : 'bg-yellow-950/40 border-yellow-500/30 hover:bg-yellow-900/50'
                }`}
              >
                {getTileSymbol(tile)}
              </button>
            ))
          )}
        </div>

        {/* Event Log */}
        <div className="w-full mt-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-[11px] flex flex-col gap-1 min-h-[60px]">
          {log.map((entry, idx) => (
            <div key={idx} className={idx === 0 ? 'text-yellow-300 font-medium' : 'text-zinc-500'}>
              • {entry}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between w-full mt-3 text-sm font-semibold text-zinc-400">
        <span>Goal: Find & Slay the Boss (bottom right)</span>
      </div>
    </div>
  );
}
