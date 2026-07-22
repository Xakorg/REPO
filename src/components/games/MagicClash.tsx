'use client';

import React, { useEffect, useState } from 'react';

interface Enemy {
  id: number;
  lane: number;
  x: number; // 0 to 100%
  hp: number;
  maxHp: number;
  type: 'goblin' | 'orc' | 'dragon';
  speed: number;
  frozen: number; // freeze timer in ticks
}

export default function MagicClash() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [mana, setMana] = useState<number>(50);
  const [nexusHp, setNexusHp] = useState<number>(100);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [wave, setWave] = useState<number>(1);
  const [selectedSpell, setSelectedSpell] = useState<'fireball' | 'frost' | 'lightning' | 'heal'>('fireball');

  const spells = [
    { id: 'fireball', name: '🔥 Fireball', cost: 20, desc: 'Damage all monsters in lane' },
    { id: 'frost', name: '❄️ Frost Nova', cost: 25, desc: 'Freeze all enemies on screen' },
    { id: 'lightning', name: '⚡ Lightning', cost: 35, desc: 'Heavy damage to frontmost enemy' },
    { id: 'heal', name: '💚 Heal Nexus', cost: 40, desc: 'Restore 25 Nexus HP' },
  ];

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setMana(50);
    setNexusHp(100);
    setEnemies([]);
    setWave(1);
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let nextEnemyId = 1;
    let spawnCounter = 0;

    const interval = setInterval(() => {
      // Mana regeneration
      setMana((m) => Math.min(100, m + 2));

      // Enemy spawn logic
      spawnCounter++;
      if (spawnCounter % 5 === 0) {
        const lane = Math.floor(Math.random() * 3);
        const randType = Math.random();
        let type: 'goblin' | 'orc' | 'dragon' = 'goblin';
        let hp = 30;
        let speed = 2.5;

        if (randType > 0.7) {
          type = 'dragon';
          hp = 80;
          speed = 1.2;
        } else if (randType > 0.4) {
          type = 'orc';
          hp = 50;
          speed = 1.8;
        }

        setEnemies((prev) => [
          ...prev,
          {
            id: nextEnemyId++,
            lane,
            x: 0,
            hp,
            maxHp: hp,
            type,
            speed,
            frozen: 0,
          },
        ]);
      }

      // Move enemies
      setEnemies((prev) => {
        let reachedNexusDamage = 0;
        let scoreGain = 0;

        const updated = prev
          .map((enemy) => {
            let nextFrozen = Math.max(0, enemy.frozen - 1);
            let nextX = enemy.x;
            if (nextFrozen === 0) {
              nextX += enemy.speed;
            }

            if (nextX >= 90) {
              reachedNexusDamage += enemy.type === 'dragon' ? 25 : enemy.type === 'orc' ? 15 : 10;
              return null; // reached nexus
            }

            return { ...enemy, x: nextX, frozen: nextFrozen };
          })
          .filter(Boolean) as Enemy[];

        if (reachedNexusDamage > 0) {
          setNexusHp((hp) => {
            const nextHp = Math.max(0, hp - reachedNexusDamage);
            if (nextHp <= 0) {
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: score } }));
            }
            return nextHp;
          });
        }

        return updated;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [gameState, score]);

  const castSpellOnLane = (laneIndex: number) => {
    if (gameState !== 'PLAYING') return;

    const spellCost = spells.find((s) => s.id === selectedSpell)?.cost || 0;
    if (mana < spellCost) return;

    setMana((m) => m - spellCost);

    if (selectedSpell === 'fireball') {
      // Fireball damages all in target lane
      setEnemies((prev) => {
        let killedScore = 0;
        const next = prev
          .map((e) => {
            if (e.lane === laneIndex) {
              const newHp = e.hp - 35;
              if (newHp <= 0) {
                killedScore += e.type === 'dragon' ? 100 : e.type === 'orc' ? 50 : 25;
                return null;
              }
              return { ...e, hp: newHp };
            }
            return e;
          })
          .filter(Boolean) as Enemy[];

        if (killedScore > 0) setScore((s) => s + killedScore);
        return next;
      });
    } else if (selectedSpell === 'frost') {
      // Freeze all
      setEnemies((prev) => prev.map((e) => ({ ...e, frozen: 10 })));
    } else if (selectedSpell === 'lightning') {
      // Single heavy hit to frontmost enemy anywhere or in lane
      setEnemies((prev) => {
        const laneEnemies = prev.filter((e) => e.lane === laneIndex);
        if (laneEnemies.length === 0) return prev;
        const frontmost = laneEnemies.reduce((max, e) => (e.x > max.x ? e : max), laneEnemies[0]);
        let killedScore = 0;
        const next = prev
          .map((e) => {
            if (e.id === frontmost.id) {
              const newHp = e.hp - 90;
              if (newHp <= 0) {
                killedScore += e.type === 'dragon' ? 100 : e.type === 'orc' ? 50 : 25;
                return null;
              }
              return { ...e, hp: newHp };
            }
            return e;
          })
          .filter(Boolean) as Enemy[];

        if (killedScore > 0) setScore((s) => s + killedScore);
        return next;
      });
    } else if (selectedSpell === 'heal') {
      setNexusHp((hp) => Math.min(100, hp + 25));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[550px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Magic Clash</h2>
          <p className="text-xs text-zinc-400">Defend your Nexus with elemental magic spells!</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-purple-300">Score: {score}</div>
          <div className="text-xs text-emerald-400">Nexus HP: {nexusHp}%</div>
        </div>
      </div>

      <div className="relative border border-purple-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-900 w-full max-w-[550px] p-4 flex flex-col gap-3">
        {/* Spell Bar */}
        <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg border border-purple-950">
          <div className="flex items-center gap-2">
            <span className="text-xs text-cyan-400 font-bold">MANA: {mana}/100</span>
            <div className="w-24 bg-zinc-800 rounded-full h-3 overflow-hidden border border-cyan-900">
              <div className="bg-cyan-500 h-full transition-all" style={{ width: `${mana}%` }} />
            </div>
          </div>
          <div className="flex gap-2">
            {spells.map((sp) => (
              <button
                key={sp.id}
                onClick={() => setSelectedSpell(sp.id as any)}
                className={`px-2 py-1 text-xs font-bold rounded-lg border transition ${
                  selectedSpell === sp.id
                    ? 'border-purple-400 bg-purple-950 text-purple-200'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {sp.name} ({sp.cost})
              </button>
            ))}
          </div>
        </div>

        {/* Lanes */}
        <div className="flex flex-col gap-3 relative min-h-[300px]">
          {[0, 1, 2].map((laneIndex) => (
            <div
              key={laneIndex}
              onClick={() => castSpellOnLane(laneIndex)}
              className="relative h-20 bg-zinc-950/80 border border-purple-900/30 rounded-lg flex items-center px-4 cursor-pointer hover:border-purple-500 transition group"
            >
              <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 transition rounded-lg" />
              <div className="text-xs text-purple-400 font-semibold absolute left-2 top-1">Lane {laneIndex + 1}</div>

              {/* Enemies in Lane */}
              {enemies
                .filter((e) => e.lane === laneIndex)
                .map((enemy) => (
                  <div
                    key={enemy.id}
                    className="absolute flex flex-col items-center transition-all duration-300"
                    style={{ left: `${enemy.x}%` }}
                  >
                    {/* HP Bar */}
                    <div className="w-8 bg-zinc-800 h-1 rounded overflow-hidden mb-1">
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                      />
                    </div>
                    <span className={`text-2xl ${enemy.frozen > 0 ? 'brightness-150 animate-pulse' : ''}`}>
                      {enemy.type === 'dragon' ? '🐲' : enemy.type === 'orc' ? '👹' : '👺'}
                    </span>
                  </div>
                ))}

              {/* Crystal Nexus on Right */}
              <div className="absolute right-3 text-3xl animate-bounce">🔮</div>
            </div>
          ))}
        </div>

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-purple-400 mb-2">MAGIC CLASH</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Select a spell at the top, then click on a lane to unleash magical damage upon invading waves of dark creatures!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition shadow-lg shadow-purple-600/30"
            >
              Begin Defense
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">NEXUS DESTROYED</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-purple-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
            >
              Rebuild Nexus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
