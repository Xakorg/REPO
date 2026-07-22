'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Unit {
  id: number;
  type: 'past' | 'present' | 'future';
  lane: number;
  x: number;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  speed: number;
  attackCooldown: number;
}

interface Enemy {
  id: number;
  lane: number;
  x: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
}

export default function ChronoClash2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [energy, setEnergy] = useState(100);
  const [baseHp, setBaseHp] = useState(100);
  const [score, setScore] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<'past' | 'present' | 'future'>('present');

  const stateRef = useRef({
    gameState: 'START',
    energy: 100,
    baseHp: 100,
    score: 0,
    units: [] as Unit[],
    enemies: [] as Enemy[],
    nextId: 1,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      energy: 100,
      baseHp: 100,
      score: 0,
      units: [],
      enemies: [],
      nextId: 1,
      spawnTimer: 0,
    };
    setEnergy(100);
    setBaseHp(100);
    setScore(0);
    setGameState('PLAYING');
  };

  const spawnUnit = (lane: number) => {
    const state = stateRef.current;
    if (state.gameState !== 'PLAYING') return;

    const unitCosts = { past: 40, present: 30, future: 50 };
    const cost = unitCosts[selectedUnit];

    if (state.energy < cost) return;

    state.energy -= cost;
    setEnergy(Math.floor(state.energy));

    const unitProps = {
      past: { hp: 120, damage: 1, range: 20, speed: 0.5 },
      present: { hp: 50, damage: 4, range: 40, speed: 1.2 },
      future: { hp: 35, damage: 8, range: 180, speed: 0.8 },
    };

    const props = unitProps[selectedUnit];
    state.units.push({
      id: state.nextId++,
      type: selectedUnit,
      lane,
      x: 40,
      hp: props.hp,
      maxHp: props.hp,
      damage: props.damage,
      range: props.range,
      speed: props.speed,
      attackCooldown: 0,
    });
  };

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (state.gameState === 'PLAYING') {
        // Energy regen
        if (state.energy < 100) {
          state.energy = Math.min(100, state.energy + 0.15);
          setEnergy(Math.floor(state.energy));
        }

        // Enemy spawn logic
        state.spawnTimer++;
        if (state.spawnTimer > 120) {
          state.spawnTimer = 0;
          const lane = Math.floor(Math.random() * 4);
          const hpMultiplier = 1 + Math.floor(state.score / 200) * 0.2;
          state.enemies.push({
            id: state.nextId++,
            lane,
            x: 390,
            hp: Math.floor(40 * hpMultiplier),
            maxHp: Math.floor(40 * hpMultiplier),
            damage: 10,
            speed: 0.6,
          });
        }

        // Update units
        state.units.forEach((u) => {
          // Find targets in lane
          const enemiesInLane = state.enemies.filter((e) => e.lane === u.lane && e.x > u.x);
          const target = enemiesInLane.find((e) => e.x - u.x <= u.range);

          if (target) {
            u.attackCooldown++;
            if (u.attackCooldown > 30) {
              u.attackCooldown = 0;
              target.hp -= u.damage;
              if (target.hp <= 0) {
                state.score += 20;
                setScore(state.score);
              }
            }
          } else {
            u.x = Math.min(360, u.x + u.speed);
          }
        });

        // Update enemies
        for (let i = state.enemies.length - 1; i >= 0; i--) {
          const e = state.enemies[i];
          if (e.hp <= 0) {
            state.enemies.splice(i, 1);
            continue;
          }

          const unitInFront = state.units.find((u) => u.lane === e.lane && Math.abs(u.x - e.x) < 20);

          if (unitInFront) {
            unitInFront.hp -= 0.5;
            if (unitInFront.hp <= 0) {
              state.units = state.units.filter((u) => u.id !== unitInFront.id);
            }
          } else {
            e.x -= e.speed;
            if (e.x <= 20) {
              state.baseHp -= e.damage;
              setBaseHp(Math.max(0, state.baseHp));
              state.enemies.splice(i, 1);

              if (state.baseHp <= 0) {
                state.gameState = 'GAMEOVER';
                setGameState('GAMEOVER');
                window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: state.score } }));
              }
            }
          }
        }
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 400);

      // Draw 4 Lanes
      const laneH = 100;
      for (let l = 0; l < 4; l++) {
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, l * laneH, 400, laneH);

        // Base line
        ctx.fillStyle = '#ef444433';
        ctx.fillRect(0, l * laneH, 25, laneH);
      }

      if (state.gameState === 'PLAYING') {
        // Draw Units
        state.units.forEach((u) => {
          const y = u.lane * laneH + laneH / 2;
          ctx.beginPath();
          ctx.arc(u.x, y, 14, 0, Math.PI * 2);

          ctx.fillStyle = u.type === 'past' ? '#38bdf8' : u.type === 'present' ? '#fbbf24' : '#a855f7';
          ctx.fill();

          // HP bar
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(u.x - 12, y - 22, (u.hp / u.maxHp) * 24, 4);
        });

        // Draw Enemies
        state.enemies.forEach((e) => {
          const y = e.lane * laneH + laneH / 2;
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(e.x - 12, y - 12, 24, 24);

          // HP bar
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(e.x - 12, y - 20, (e.hp / e.maxHp) * 24, 4);
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[580px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-[400px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-amber-400">Chrono Clash 2</h2>
          <p className="text-xs text-zinc-400">Deploy time defenders to hold base</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-amber-300">Score: {score}</div>
          <div className="text-xs text-rose-400">Base HP: {baseHp}%</div>
          <div className="text-xs text-emerald-400">Chrono Energy: {energy}</div>
        </div>
      </div>

      <div className="relative border border-amber-900/50 rounded-xl overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={400} height={400} className="block cursor-pointer" />

        {/* Lane click overlay to deploy */}
        {gameState === 'PLAYING' && (
          <div className="absolute inset-0 grid grid-rows-4">
            {[0, 1, 2, 3].map((lane) => (
              <button
                key={lane}
                onClick={() => spawnUnit(lane)}
                className="w-full h-full hover:bg-white/5 transition border-b border-zinc-800/30 text-left pl-2 text-[10px] text-zinc-500 hover:text-amber-300"
              >
                + Deploy Lane {lane + 1}
              </button>
            ))}
          </div>
        )}

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-amber-400 mb-2">CHRONO CLASH 2</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Select a time unit below, then click a lane to deploy. Stop temporal invaders from reaching your base!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
            >
              Start Battle
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-rose-500 mb-2">TIMELINE COLLAPSED</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-amber-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Deploy selector */}
      {gameState === 'PLAYING' && (
        <div className="flex gap-2 mt-3 w-[400px]">
          <button
            onClick={() => setSelectedUnit('past')}
            className={`flex-1 py-2 px-1 text-xs rounded-lg border font-bold ${
              selectedUnit === 'past'
                ? 'bg-sky-900 border-sky-400 text-sky-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            🛡️ Past Guard (40)
          </button>
          <button
            onClick={() => setSelectedUnit('present')}
            className={`flex-1 py-2 px-1 text-xs rounded-lg border font-bold ${
              selectedUnit === 'present'
                ? 'bg-amber-900 border-amber-400 text-amber-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            ⚔️ Present Striker (30)
          </button>
          <button
            onClick={() => setSelectedUnit('future')}
            className={`flex-1 py-2 px-1 text-xs rounded-lg border font-bold ${
              selectedUnit === 'future'
                ? 'bg-purple-900 border-purple-400 text-purple-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            ⚡ Future Beam (50)
          </button>
        </div>
      )}
    </div>
  );
}
