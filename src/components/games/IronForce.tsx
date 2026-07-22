'use client';

import React, { useState } from 'react';

type UnitType = 'tank' | 'mech' | 'scout';

interface Unit {
  id: string;
  type: UnitType;
  r: number;
  c: number;
  hp: number;
  maxHp: number;
  attack: number;
  range: number;
  isEnemy: boolean;
  hasMoved: boolean;
}

const GRID_SIZE = 6;

export default function IronForce() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState(1);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const [units, setUnits] = useState<Unit[]>([]);

  const initGame = () => {
    const initialUnits: Unit[] = [
      // Player Units (Bottom)
      { id: 'p1', type: 'mech', r: 5, c: 1, hp: 120, maxHp: 120, attack: 35, range: 1, isEnemy: false, hasMoved: false },
      { id: 'p2', type: 'tank', r: 5, c: 4, hp: 150, maxHp: 150, attack: 45, range: 2, isEnemy: false, hasMoved: false },
      { id: 'p3', type: 'scout', r: 4, c: 2, hp: 80, maxHp: 80, attack: 25, range: 2, isEnemy: false, hasMoved: false },

      // Enemy Units (Top)
      { id: 'e1', type: 'mech', r: 0, c: 1, hp: 100, maxHp: 100, attack: 30, range: 1, isEnemy: true, hasMoved: false },
      { id: 'e2', type: 'tank', r: 0, c: 4, hp: 130, maxHp: 130, attack: 40, range: 2, isEnemy: true, hasMoved: false },
      { id: 'e3', type: 'scout', r: 1, c: 3, hp: 70, maxHp: 70, attack: 20, range: 2, isEnemy: true, hasMoved: false },
    ];
    setUnits(initialUnits);
    setSelectedUnitId(null);
    setTurn(1);
    setScore(0);
    setGameState('PLAYING');
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const handleTileClick = (r: number, c: number) => {
    if (gameState !== 'PLAYING') return;

    const clickedUnit = units.find(u => u.r === r && u.c === c);

    // If clicking own unit, select it
    if (clickedUnit && !clickedUnit.isEnemy) {
      setSelectedUnitId(clickedUnit.id);
      return;
    }

    // If unit is selected, action attempt (Move or Attack)
    if (selectedUnit && !selectedUnit.hasMoved) {
      // Attack enemy unit
      if (clickedUnit && clickedUnit.isEnemy) {
        const dist = Math.abs(selectedUnit.r - r) + Math.abs(selectedUnit.c - c);
        if (dist <= selectedUnit.range) {
          // Attack enemy
          const enemyHp = clickedUnit.hp - selectedUnit.attack;
          let newScore = score + 50;
          if (enemyHp <= 0) newScore += 150;
          setScore(newScore);

          setUnits(prev =>
            prev
              .map(u => {
                if (u.id === clickedUnit.id) return { ...u, hp: enemyHp };
                if (u.id === selectedUnit.id) return { ...u, hasMoved: true };
                return u;
              })
              .filter(u => u.hp > 0)
          );

          setSelectedUnitId(null);
          checkGameOver();
          return;
        }
      }

      // Move to empty space
      if (!clickedUnit) {
        const dist = Math.abs(selectedUnit.r - r) + Math.abs(selectedUnit.c - c);
        if (dist <= 2) {
          setUnits(prev =>
            prev.map(u => (u.id === selectedUnit.id ? { ...u, r, c, hasMoved: true } : u))
          );
          setSelectedUnitId(null);
          return;
        }
      }
    }
  };

  const endTurn = () => {
    // Enemy AI Move
    let currentUnits = units.map(u => ({ ...u, hasMoved: false }));

    const enemies = currentUnits.filter(u => u.isEnemy);
    const players = currentUnits.filter(u => !u.isEnemy);

    if (players.length === 0) return;

    enemies.forEach(e => {
      // Find closest player unit
      let closestP: Unit | null = null;
      let minDistance = 999;
      players.forEach(p => {
        const d = Math.abs(e.r - p.r) + Math.abs(e.c - p.c);
        if (d < minDistance) {
          minDistance = d;
          closestP = p;
        }
      });

      if (closestP) {
        // Can attack?
        if (minDistance <= e.range) {
          (closestP as Unit).hp -= e.attack;
        } else {
          // Move closer
          const dr = Math.sign((closestP as Unit).r - e.r);
          const dc = Math.sign((closestP as Unit).c - e.c);
          const nr = Math.max(0, Math.min(GRID_SIZE - 1, e.r + dr));
          const nc = Math.max(0, Math.min(GRID_SIZE - 1, e.c + dc));
          if (!currentUnits.some(u => u.r === nr && u.c === nc)) {
            e.r = nr;
            e.c = nc;
          }
        }
      }
    });

    currentUnits = currentUnits.filter(u => u.hp > 0);
    setUnits(currentUnits);
    setTurn(t => t + 1);

    checkGameOver(currentUnits);
  };

  const checkGameOver = (currentUnits = units) => {
    const enemiesAlive = currentUnits.some(u => u.isEnemy && u.hp > 0);
    const playerAlive = currentUnits.some(u => !u.isEnemy && u.hp > 0);

    if (!enemiesAlive || !playerAlive) {
      setGameState('GAMEOVER');
      const finalScore = score + (enemiesAlive ? 0 : 500);
      setScore(finalScore);
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-slate-300">IRON FORCE</h2>

      <div className="relative border-2 border-slate-700/50 rounded-lg bg-zinc-900 w-[360px] sm:w-[420px] p-4 flex flex-col items-center">
        {gameState === 'START' && (
          <div className="py-16 flex flex-col items-center text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">Command your mech squad on grid! Select your units to move or attack enemy mechs within range.</p>
            <button
              onClick={initGame}
              className="px-6 py-2 bg-slate-200 hover:bg-white text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              START BATTLE
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="py-16 flex flex-col items-center text-center">
            <h3 className="text-2xl font-extrabold text-slate-200 mb-2">TACTICAL OPERATION OVER</h3>
            <p className="text-lg text-zinc-300 mb-4">Final Score: <span className="text-slate-300 font-bold">{score}</span></p>
            <button
              onClick={initGame}
              className="px-6 py-2 bg-slate-200 hover:bg-white text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              NEW MISSION
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full flex justify-between items-center text-xs text-zinc-300 px-1 font-semibold">
              <span>Turn: <span className="text-slate-200">{turn}</span></span>
              <span>Score: <span className="text-amber-400">{score}</span></span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-6 gap-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
              {Array.from({ length: GRID_SIZE }).map((_, r) =>
                Array.from({ length: GRID_SIZE }).map((_, c) => {
                  const unit = units.find(u => u.r === r && u.c === c);
                  const isSelected = selectedUnitId === unit?.id;

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleTileClick(r, c)}
                      className={`w-11 h-11 sm:w-13 sm:h-13 rounded-md border flex flex-col items-center justify-center relative transition ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-950/40'
                          : 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700'
                      }`}
                    >
                      {unit && (
                        <div className="flex flex-col items-center w-full px-1">
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-0.5">
                            <div
                              className={unit.isEnemy ? 'bg-red-500 h-full' : 'bg-blue-400 h-full'}
                              style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              unit.isEnemy ? 'text-red-400' : 'text-blue-300'
                            }`}
                          >
                            {unit.type[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="w-full flex justify-between items-center mt-2">
              <span className="text-xs text-zinc-400">
                {selectedUnit
                  ? `${selectedUnit.type.toUpperCase()} selected (Range: ${selectedUnit.range})`
                  : 'Select a blue unit'}
              </span>
              <button
                onClick={endTurn}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-lg text-white transition"
              >
                END TURN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
