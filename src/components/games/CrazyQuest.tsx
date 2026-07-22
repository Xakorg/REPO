'use client';

import React, { useState } from 'react';

interface Tile {
  id: number;
  type: 'monster' | 'treasure' | 'potion' | 'trap' | 'portal';
  revealed: boolean;
  val: number;
}

export default function CrazyQuest() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [hp, setHp] = useState<number>(100);
  const [maxHp] = useState<number>(100);
  const [floor, setFloor] = useState<number>(1);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [log, setLog] = useState<string>('Welcome hero! Click tiles to explore the dungeon.');

  const generateFloor = (floorNum: number): Tile[] => {
    let newTiles: Tile[] = [];
    const types: ('monster' | 'treasure' | 'potion' | 'trap')[] = ['monster', 'monster', 'treasure', 'potion', 'trap'];

    for (let i = 0; i < 15; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const val = type === 'monster' ? 15 + floorNum * 5 : type === 'treasure' ? 100 + floorNum * 50 : 20;
      newTiles.push({ id: i, type, revealed: false, val });
    }
    // 1 Portal tile per floor
    newTiles.push({ id: 15, type: 'portal', revealed: false, val: 0 });

    // Shuffle tiles
    return newTiles.sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    setHp(100);
    setScore(0);
    setFloor(1);
    setTiles(generateFloor(1));
    setLog('Exploration started! Choose tiles wisely.');
    setGameState('PLAYING');
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'PLAYING') return;

    const tile = tiles[index];
    if (tile.revealed) return;

    const nextTiles = [...tiles];
    nextTiles[index] = { ...tile, revealed: true };
    setTiles(nextTiles);

    if (tile.type === 'monster') {
      const dmg = tile.val;
      const points = tile.val * 5;
      setHp((currentHp) => {
        const nextHp = currentHp - dmg;
        if (nextHp <= 0) {
          setGameState('GAMEOVER');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: score + points } }));
          setLog(`Defeated by a Dungeon Beast! Received ${dmg} damage.`);
          return 0;
        }
        setLog(`Fought a Dungeon Beast! Took ${dmg} damage, earned ${points} XP!`);
        return nextHp;
      });
      setScore((s) => s + points);
    } else if (tile.type === 'treasure') {
      const bonus = tile.val;
      setScore((s) => s + bonus);
      setLog(`Found a chest of shiny gold! +${bonus} Score!`);
    } else if (tile.type === 'potion') {
      const heal = tile.val;
      setHp((h) => Math.min(maxHp, h + heal));
      setLog(`Drank a Health Potion! Restored +${heal} HP.`);
    } else if (tile.type === 'trap') {
      const dmg = 15;
      setHp((currentHp) => {
        const nextHp = currentHp - dmg;
        if (nextHp <= 0) {
          setGameState('GAMEOVER');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: score } }));
          setLog(`Triggered a deadly spike trap! Take ${dmg} damage.`);
          return 0;
        }
        setLog(`Triggered a spike trap! Took ${dmg} damage.`);
        return nextHp;
      });
    } else if (tile.type === 'portal') {
      const nextFloor = floor + 1;
      const floorBonus = 200 * floor;
      setFloor(nextFloor);
      setScore((s) => s + floorBonus);
      setTiles(generateFloor(nextFloor));
      setLog(`Descended to Floor ${nextFloor}! +${floorBonus} Floor Clear Bonus!`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[440px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-rose-400">Crazy Quest</h2>
          <p className="text-xs text-zinc-400">Floor {floor} Dungeon Crawl</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-rose-300">Score: {score}</div>
          <div className="text-xs text-emerald-400">Hero HP: {hp}/{maxHp}</div>
        </div>
      </div>

      <div className="relative border border-rose-900/50 rounded-xl p-4 bg-zinc-900 w-full max-w-[440px] flex flex-col gap-3">
        {/* HP Bar */}
        <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-rose-950">
          <div
            className="bg-rose-500 h-full transition-all"
            style={{ width: `${(hp / maxHp) * 100}%` }}
          />
        </div>

        {/* Quest Log */}
        <div className="text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 h-10 flex items-center justify-center text-center">
          {log}
        </div>

        {/* Dungeon 4x4 Grid */}
        <div className="grid grid-cols-4 gap-2 h-[340px] w-full">
          {tiles.map((tile, i) => (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              className={`rounded-lg border-2 flex items-center justify-center text-3xl transition duration-200 transform active:scale-95 ${
                tile.revealed
                  ? 'border-zinc-800 bg-zinc-950 cursor-default'
                  : 'border-rose-900/60 bg-zinc-800 hover:bg-rose-950/40 hover:border-rose-500'
              }`}
            >
              {tile.revealed ? (
                tile.type === 'monster' ? '👹' : tile.type === 'treasure' ? '👑' : tile.type === 'potion' ? '🧪' : tile.type === 'trap' ? '💥' : '🌀'
              ) : (
                '❓'
              )}
            </button>
          ))}
        </div>

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10 rounded-xl">
            <h3 className="text-3xl font-extrabold text-rose-400 mb-2">CRAZY QUEST</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Explore hidden dungeon tiles. Fight monsters, gather treasures, drink potions, and find the portal 🌀 to descend to deeper floors!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition shadow-lg shadow-rose-600/30"
            >
              Enter Dungeon
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10 rounded-xl">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">HERO FALLEN</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-rose-400 font-bold">{score}</span> (Reached Floor {floor})
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
