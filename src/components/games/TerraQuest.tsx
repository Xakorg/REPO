'use client';

import React, { useState } from 'react';

type TileType = 'empty' | 'farm' | 'quarry' | 'mine' | 'tower';

interface Tile {
  r: number;
  c: number;
  type: TileType;
  unlocked: boolean;
}

export default function TerraQuest() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [turn, setTurn] = useState<number>(1);
  const [hp, setHp] = useState<number>(100);
  const [wood, setWood] = useState<number>(50);
  const [stone, setStone] = useState<number>(30);
  const [gold, setGold] = useState<number>(20);
  const [score, setScore] = useState<number>(0);

  const [grid, setGrid] = useState<Tile[][]>([]);

  const initGrid = () => {
    let initialGrid: Tile[][] = [];
    for (let r = 0; r < 5; r++) {
      let row: Tile[] = [];
      for (let c = 0; c < 5; c++) {
        // center tile unlocked
        const isCenter = r === 2 && c === 2;
        row.push({
          r,
          c,
          type: isCenter ? 'farm' : 'empty',
          unlocked: isCenter || (Math.abs(r - 2) + Math.abs(c - 2) <= 1),
        });
      }
      initialGrid.push(row);
    }
    setGrid(initialGrid);
  };

  const startGame = () => {
    setTurn(1);
    setHp(100);
    setWood(50);
    setStone(30);
    setGold(20);
    setScore(0);
    initGrid();
    setGameState('PLAYING');
  };

  const nextTurn = (addedWood = 0, addedStone = 0, addedGold = 0) => {
    // Generate income from buildings
    let totalFarm = 0;
    let totalQuarry = 0;
    let totalMine = 0;
    let totalTower = 0;

    grid.forEach((row) =>
      row.forEach((t) => {
        if (!t.unlocked) return;
        if (t.type === 'farm') totalFarm++;
        if (t.type === 'quarry') totalQuarry++;
        if (t.type === 'mine') totalMine++;
        if (t.type === 'tower') totalTower++;
      })
    );

    const newWood = wood + addedWood + totalFarm * 15;
    const newStone = stone + addedStone + totalQuarry * 10;
    const newGold = gold + addedGold + totalMine * 8;

    setWood(newWood);
    setStone(newStone);
    setGold(newGold);

    // Monster invasion every 4 turns
    let newHp = hp;
    if (turn % 4 === 0) {
      const attackPower = 20 + turn * 5;
      const defensePower = totalTower * 25;
      const damage = Math.max(0, attackPower - defensePower);
      newHp = hp - damage;
      setHp(newHp);

      if (newHp <= 0) {
        endGame(score + turn * 50);
        return;
      }
    }

    const nextTurnNum = turn + 1;
    setTurn(nextTurnNum);
    const newScore = nextTurnNum * 30 + (totalFarm + totalQuarry + totalMine + totalTower) * 50;
    setScore(newScore);
  };

  const buildOnTile = (r: number, c: number, buildType: TileType) => {
    if (gameState !== 'PLAYING') return;

    let woodCost = 0;
    let stoneCost = 0;
    let goldCost = 0;

    if (buildType === 'farm') { woodCost = 20; }
    if (buildType === 'quarry') { woodCost = 15; stoneCost = 10; }
    if (buildType === 'mine') { woodCost = 20; stoneCost = 20; goldCost = 10; }
    if (buildType === 'tower') { woodCost = 30; stoneCost = 30; }

    if (wood < woodCost || stone < stoneCost || gold < goldCost) return;

    setWood(wood - woodCost);
    setStone(stone - stoneCost);
    setGold(gold - goldCost);

    let newGrid = grid.map((row) => [...row]);
    newGrid[r][c].type = buildType;
    setGrid(newGrid);

    nextTurn();
  };

  const unlockTile = (r: number, c: number) => {
    if (gold < 25) return;
    setGold(gold - 25);

    let newGrid = grid.map((row) => [...row]);
    newGrid[r][c].unlocked = true;
    setGrid(newGrid);

    nextTurn();
  };

  const endGame = (finalScore: number) => {
    window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    setGameState('GAMEOVER');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-400">Terra Quest</h2>
          <p className="text-xs text-zinc-400">Turn: {turn} | Realm Defense HP: {hp}%</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-emerald-300">Score: {score}</div>
          <div className="text-xs text-zinc-300">
            🪵 {wood} | 🪨 {stone} | 🪙 {gold}
          </div>
        </div>
      </div>

      <div className="relative border border-emerald-900/50 rounded-xl p-4 bg-zinc-900 w-[500px] h-[450px] flex flex-col justify-between">
        {/* Grid */}
        <div className="grid grid-cols-5 gap-2 w-full h-[320px]">
          {grid.map((row, r) =>
            row.map((tile, c) => {
              if (!tile.unlocked) {
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => unlockTile(r, c)}
                    className="flex flex-col items-center justify-center bg-zinc-950/90 border border-dashed border-zinc-700 rounded-lg hover:border-emerald-500 transition text-zinc-500 hover:text-emerald-400 text-xs p-1"
                  >
                    <span>🔒 Lock</span>
                    <span>🪙 25</span>
                  </button>
                );
              }

              let icon = '🌱';
              if (tile.type === 'farm') icon = '🌾';
              if (tile.type === 'quarry') icon = '⛏️';
              if (tile.type === 'mine') icon = '🪙';
              if (tile.type === 'tower') icon = '🏰';

              return (
                <div
                  key={`${r}-${c}`}
                  className="flex flex-col items-center justify-center bg-zinc-800 border border-emerald-800/40 rounded-lg text-2xl relative group"
                >
                  <span>{icon}</span>
                  <span className="text-[10px] uppercase text-emerald-400 font-semibold">{tile.type}</span>

                  {/* Build Menu Hover */}
                  {tile.type === 'empty' && (
                    <div className="absolute inset-0 bg-zinc-950/95 rounded-lg opacity-0 group-hover:opacity-100 flex flex-col justify-around p-1 text-[9px] z-10 transition">
                      <button onClick={() => buildOnTile(r, c, 'farm')} className="bg-emerald-900 hover:bg-emerald-800 text-white rounded px-1">🌾 Farm</button>
                      <button onClick={() => buildOnTile(r, c, 'quarry')} className="bg-slate-700 hover:bg-slate-600 text-white rounded px-1">⛏️ Quarry</button>
                      <button onClick={() => buildOnTile(r, c, 'mine')} className="bg-amber-900 hover:bg-amber-800 text-white rounded px-1">🪙 Mine</button>
                      <button onClick={() => buildOnTile(r, c, 'tower')} className="bg-indigo-900 hover:bg-indigo-800 text-white rounded px-1">🏰 Tower</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg border border-zinc-800">
          <span className="text-xs text-zinc-400">Build structures to survive incoming invasions!</span>
          <button
            onClick={() => nextTurn()}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 font-bold rounded text-xs text-white"
          >
            End Turn ➔
          </button>
        </div>

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl z-20">
            <h3 className="text-3xl font-extrabold text-emerald-400 mb-2">TERRA QUEST</h3>
            <p className="text-zinc-400 mb-6 max-w-xs">Build farms, quarries, mines and towers to develop your realm and survive periodic monster raids!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
            >
              Begin Quest
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl z-20">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">REALM FALLEN</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-emerald-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
            >
              Rebuild Realm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
