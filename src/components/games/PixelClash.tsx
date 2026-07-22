'use client';

import React, { useEffect, useRef, useState } from 'react';

type UnitType = 'knight' | 'archer' | 'wizard';

interface Unit {
  id: number;
  type: UnitType;
  side: 'player' | 'enemy';
  lane: number;
  x: number;
  hp: number;
  maxHp: number;
  attack: number;
  range: number;
  speed: number;
  attackCooldown: number;
}

export default function PixelClash() {
  const [mana, setMana] = useState(10);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedLane, setSelectedLane] = useState(1);

  const gameState = useRef({
    mana: 10,
    playerHp: 100,
    enemyHp: 100,
    score: 0,
    units: [] as Unit[],
    nextId: 1,
    spawnTimer: 0,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    gameState.current = {
      mana: 10,
      playerHp: 100,
      enemyHp: 100,
      score: 0,
      units: [],
      nextId: 1,
      spawnTimer: 0,
      started: true,
      gameOver: false,
    };
    setMana(10);
    setPlayerHp(100);
    setEnemyHp(100);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const spawnUnit = (type: UnitType) => {
    const s = gameState.current;
    if (!s.started || s.gameOver) return;

    const costs = { knight: 3, archer: 2, wizard: 4 };
    if (s.mana < costs[type]) return;

    s.mana -= costs[type];
    setMana(s.mana);

    const stats = {
      knight: { hp: 120, attack: 15, range: 20, speed: 1.2 },
      archer: { hp: 60, attack: 22, range: 100, speed: 1.5 },
      wizard: { hp: 80, attack: 35, range: 80, speed: 0.9 },
    }[type];

    s.units.push({
      id: s.nextId++,
      type,
      side: 'player',
      lane: selectedLane,
      x: 50,
      hp: stats.hp,
      maxHp: stats.hp,
      attack: stats.attack,
      range: stats.range,
      speed: stats.speed,
      attackCooldown: 0,
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const s = gameState.current;
      if (!s.started || s.gameOver) return;

      // Mana regen
      if (s.mana < 10) {
        s.mana = Math.min(10, s.mana + 1);
        setMana(s.mana);
      }

      // Enemy spawn logic
      s.spawnTimer++;
      if (s.spawnTimer >= 3) {
        s.spawnTimer = 0;
        const lane = Math.floor(Math.random() * 3);
        const types: UnitType[] = ['knight', 'archer', 'wizard'];
        const type = types[Math.floor(Math.random() * types.length)];
        const stats = {
          knight: { hp: 100, attack: 12, range: 20, speed: 1.0 },
          archer: { hp: 50, attack: 18, range: 90, speed: 1.3 },
          wizard: { hp: 70, attack: 30, range: 75, speed: 0.8 },
        }[type];

        s.units.push({
          id: s.nextId++,
          type,
          side: 'enemy',
          lane,
          x: 350,
          hp: stats.hp,
          maxHp: stats.hp,
          attack: stats.attack,
          range: stats.range,
          speed: stats.speed,
          attackCooldown: 0,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      const s = gameState.current;
      if (s.started && !s.gameOver) {
        // Update units
        for (let i = 0; i < s.units.length; i++) {
          const u = s.units[i];
          if (u.attackCooldown > 0) u.attackCooldown -= 1;

          // Find targets in same lane
          const target = s.units.find(
            (other) =>
              other.side !== u.side &&
              other.lane === u.lane &&
              Math.abs(other.x - u.x) <= u.range
          );

          if (target) {
            // Combat
            if (u.attackCooldown <= 0) {
              target.hp -= u.attack;
              u.attackCooldown = 30; // attack delay frames
              if (target.hp <= 0) {
                if (u.side === 'player') {
                  s.score += 50;
                  setScore(s.score);
                }
              }
            }
          } else {
            // Move unit
            if (u.side === 'player') {
              if (u.x < 350) {
                u.x += u.speed;
              } else {
                // Damage enemy base
                s.enemyHp = Math.max(0, s.enemyHp - 2);
                setEnemyHp(s.enemyHp);
              }
            } else {
              if (u.x > 50) {
                u.x -= u.speed;
              } else {
                // Damage player base
                s.playerHp = Math.max(0, s.playerHp - 2);
                setPlayerHp(s.playerHp);
              }
            }
          }
        }

        // Clean dead units
        s.units = s.units.filter((u) => u.hp > 0);

        // Check end condition
        if (s.playerHp <= 0 || s.enemyHp <= 0) {
          s.gameOver = true;
          if (s.enemyHp <= 0) {
            s.score += 1000;
            setScore(s.score);
          }
          setGameOver(true);
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: s.score } })
          );
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[420px] flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-indigo-400">PIXEL CLASH</h2>
        <div className="flex gap-3 text-xs font-semibold">
          <span className="bg-blue-950 text-blue-400 px-2 py-1 rounded border border-blue-800">
            Player: {playerHp} HP
          </span>
          <span className="bg-red-950 text-red-400 px-2 py-1 rounded border border-red-800">
            Enemy: {enemyHp} HP
          </span>
          <span className="bg-amber-950 text-amber-400 px-2 py-1 rounded border border-amber-800">
            Score: {score}
          </span>
        </div>
      </div>

      <div className="relative w-[400px] h-[280px] bg-zinc-900 border-2 border-indigo-500/40 rounded-lg overflow-hidden flex flex-col justify-around p-2">
        {[0, 1, 2].map((laneIndex) => (
          <div
            key={laneIndex}
            onClick={() => setSelectedLane(laneIndex)}
            className={`relative h-20 border-b border-zinc-800 flex items-center cursor-pointer transition ${
              selectedLane === laneIndex ? 'bg-indigo-950/40 ring-1 ring-indigo-500' : 'hover:bg-zinc-800/40'
            }`}
          >
            <span className="absolute left-1 text-[10px] text-zinc-500 font-mono">LANE {laneIndex + 1}</span>

            {/* Left Base indicator */}
            <div className="absolute left-2 w-4 h-12 bg-blue-600 rounded-sm shadow-md shadow-blue-500/50" />

            {/* Right Base indicator */}
            <div className="absolute right-2 w-4 h-12 bg-red-600 rounded-sm shadow-md shadow-red-500/50" />

            {/* Render Units */}
            {gameState.current.units
              .filter((u) => u.lane === laneIndex)
              .map((u) => (
                <div
                  key={u.id}
                  style={{ left: `${u.x}px` }}
                  className="absolute transform -translate-x-1/2 flex flex-col items-center"
                >
                  <div className="w-6 h-1 bg-zinc-950 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full ${u.side === 'player' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${(u.hp / u.maxHp) * 100}%` }}
                    />
                  </div>
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shadow ${
                      u.side === 'player'
                        ? 'bg-blue-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {u.type === 'knight' ? '🛡️' : u.type === 'archer' ? '🏹' : '🔮'}
                  </div>
                </div>
              ))}
          </div>
        ))}

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-1 text-indigo-400">
              {gameOver ? (playerHp > 0 ? 'VICTORY!' : 'DEFEAT!') : 'PIXEL CLASH'}
            </h3>
            {gameOver && <p className="text-zinc-300 text-sm mb-4">Total Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Battle'}
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-[400px] flex justify-between items-center mt-3">
        <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
          <span className="text-xs text-amber-400 font-bold">MANA: {mana}/10</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => spawnUnit('archer')}
            disabled={mana < 2}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs rounded border border-zinc-700 flex items-center gap-1 font-semibold"
          >
            🏹 Archer (2M)
          </button>
          <button
            onClick={() => spawnUnit('knight')}
            disabled={mana < 3}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs rounded border border-zinc-700 flex items-center gap-1 font-semibold"
          >
            🛡️ Knight (3M)
          </button>
          <button
            onClick={() => spawnUnit('wizard')}
            disabled={mana < 4}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs rounded border border-zinc-700 flex items-center gap-1 font-semibold"
          >
            🔮 Wizard (4M)
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500 mt-2">Select a lane by clicking it, then summon units to destroy enemy portal!</p>
    </div>
  );
}
