'use client';

import React, { useEffect, useState } from 'react';

type UnitType = 'knight' | 'archer' | 'mage';

interface Unit {
  id: string;
  type: UnitType;
  lane: number; // 0, 1, 2
  y: number; // 0 to 100
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  isEnemy: boolean;
}

const UNIT_DATA: Record<UnitType, { cost: number; hp: number; damage: number; speed: number; color: string; label: string }> = {
  knight: { cost: 3, hp: 100, damage: 15, speed: 0.6, color: '#3b82f6', label: 'Knight (3 Mana)' },
  archer: { cost: 4, hp: 60, damage: 25, speed: 0.8, color: '#10b981', label: 'Archer (4 Mana)' },
  mage: { cost: 5, hp: 45, damage: 40, speed: 0.5, color: '#a855f7', label: 'Mage (5 Mana)' },
};

export default function EpicClash() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [mana, setMana] = useState(5);
  const [score, setScore] = useState(0);
  const [playerBaseHp, setPlayerBaseHp] = useState(300);
  const [enemyBaseHp, setEnemyBaseHp] = useState(300);
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('knight');
  const [units, setUnits] = useState<Unit[]>([]);

  const startGame = () => {
    setGameState('PLAYING');
    setMana(5);
    setScore(0);
    setPlayerBaseHp(300);
    setEnemyBaseHp(300);
    setUnits([]);
  };

  const spawnPlayerUnit = (lane: number) => {
    const data = UNIT_DATA[selectedUnit];
    if (mana < data.cost || gameState !== 'PLAYING') return;

    setMana(m => m - data.cost);
    setUnits(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type: selectedUnit,
        lane,
        y: 85,
        hp: data.hp,
        maxHp: data.hp,
        damage: data.damage,
        speed: data.speed,
        isEnemy: false,
      },
    ]);
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // Mana Regeneration & Enemy Spawn loop
    const manaInterval = setInterval(() => {
      setMana(m => Math.min(10, m + 1));
    }, 1500);

    const enemySpawnInterval = setInterval(() => {
      const types: UnitType[] = ['knight', 'archer', 'mage'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomLane = Math.floor(Math.random() * 3);
      const data = UNIT_DATA[randomType];

      setUnits(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: randomType,
          lane: randomLane,
          y: 15,
          hp: data.hp,
          maxHp: data.hp,
          damage: data.damage,
          speed: data.speed,
          isEnemy: true,
        },
      ]);
    }, 3500);

    // Main Simulation Tick (30 FPS)
    const tickInterval = setInterval(() => {
      setUnits(prevUnits => {
        let updated = prevUnits.map(u => ({ ...u }));
        let pDamage = 0;
        let eDamage = 0;

        for (let i = 0; i < updated.length; i++) {
          const u1 = updated[i];
          if (u1.hp <= 0) continue;

          // Check if blocked by opposing unit in same lane
          let blocked = false;
          for (let j = 0; j < updated.length; j++) {
            if (i === j) continue;
            const u2 = updated[j];
            if (u2.hp <= 0 || u1.lane !== u2.lane || u1.isEnemy === u2.isEnemy) continue;

            // Collision range check
            if (Math.abs(u1.y - u2.y) < 6) {
              blocked = true;
              // Fight!
              u2.hp -= u1.damage * 0.05;
              break;
            }
          }

          if (!blocked) {
            // Move unit towards target base
            if (!u1.isEnemy) {
              u1.y -= u1.speed;
              if (u1.y <= 10) {
                eDamage += u1.damage;
                u1.hp = 0;
              }
            } else {
              u1.y += u1.speed;
              if (u1.y >= 90) {
                pDamage += u1.damage;
                u1.hp = 0;
              }
            }
          }
        }

        // Apply base damage
        if (eDamage > 0) {
          setEnemyBaseHp(hp => {
            const next = Math.max(0, hp - Math.floor(eDamage));
            setScore(s => s + Math.floor(eDamage * 10));
            if (next <= 0) {
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: score + 1000 } }));
            }
            return next;
          });
        }

        if (pDamage > 0) {
          setPlayerBaseHp(hp => {
            const next = Math.max(0, hp - Math.floor(pDamage));
            if (next <= 0) {
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score } }));
            }
            return next;
          });
        }

        return updated.filter(u => u.hp > 0);
      });
    }, 50);

    return () => {
      clearInterval(manaInterval);
      clearInterval(enemySpawnInterval);
      clearInterval(tickInterval);
    };
  }, [gameState, score]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-indigo-400">EPIC CLASH</h2>

      <div className="relative border-2 border-indigo-500/30 rounded-lg bg-zinc-900 w-[360px] sm:w-[420px] overflow-hidden p-3">
        {gameState === 'START' && (
          <div className="py-16 flex flex-col items-center text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">Select your unit card, then tap any of the 3 lanes to deploy them! Destroy the enemy base before they destroy yours.</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              DEPLOY FORCES
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="py-16 flex flex-col items-center text-center">
            <h3 className="text-2xl font-extrabold text-indigo-400 mb-2">BATTLE ENDED</h3>
            <p className="text-lg text-zinc-300 mb-4">Final Score: <span className="text-indigo-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              REMATCH
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="flex flex-col gap-3">
            {/* Top Bar: Enemy Castle HP */}
            <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-md border border-red-500/30">
              <span className="text-xs font-bold text-red-400">ENEMY BASE</span>
              <div className="w-48 bg-zinc-800 h-3 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all" style={{ width: `${(enemyBaseHp / 300) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold text-zinc-300">{enemyBaseHp} HP</span>
            </div>

            {/* Battlefield Lanes */}
            <div className="relative h-64 bg-zinc-950 border border-zinc-800 rounded-lg flex divide-x divide-zinc-800/60 overflow-hidden">
              {[0, 1, 2].map(lane => (
                <div
                  key={lane}
                  onClick={() => spawnPlayerUnit(lane)}
                  className="flex-1 relative cursor-pointer hover:bg-indigo-950/20 transition group"
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-indigo-400 pointer-events-none">
                    SPAWN HERE
                  </div>

                  {/* Units in lane */}
                  {units.filter(u => u.lane === lane).map(u => (
                    <div
                      key={u.id}
                      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-75"
                      style={{ top: `${u.y}%` }}
                    >
                      <div className="w-8 h-1 bg-zinc-800 rounded-full overflow-hidden mb-0.5">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${(u.hp / u.maxHp) * 100}%` }}
                        />
                      </div>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md"
                        style={{
                          backgroundColor: u.isEnemy ? '#ef4444' : UNIT_DATA[u.type].color,
                        }}
                      >
                        {u.type[0].toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Player Castle HP & Mana */}
            <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-md border border-indigo-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400">YOUR BASE</span>
                <span className="text-xs font-semibold text-zinc-300">{playerBaseHp} HP</span>
              </div>
              <div className="flex items-center gap-1 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-500/40">
                <span className="text-xs font-bold text-blue-300">MANA: {mana}/10</span>
              </div>
            </div>

            {/* Cards selector */}
            <div className="flex gap-2">
              {(Object.keys(UNIT_DATA) as UnitType[]).map(type => {
                const data = UNIT_DATA[type];
                const isSelected = selectedUnit === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedUnit(type)}
                    className={`flex-1 p-2 rounded-lg border text-xs font-semibold flex flex-col items-center transition ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-950/60 text-white shadow-md'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="capitalize">{type}</span>
                    <span className="text-[10px] text-blue-400">{data.cost} Mana</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
