'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Turret {
  x: number;
  y: number;
  type: 'flame' | 'fireball' | 'plasma';
  range: number;
  damage: number;
  cooldown: number;
  timer: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  pathIdx: number;
}

const PATH = [
  { x: 0, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 300 },
  { x: 100, y: 300 },
  { x: 100, y: 480 },
];

export default function PyroForce2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(120);
  const [lives, setLives] = useState(10);
  const [selectedTurretType, setSelectedTurretType] = useState<'flame' | 'fireball' | 'plasma'>('flame');

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    crystals: 120,
    lives: 10,
    turrets: [] as Turret[],
    enemies: [] as Enemy[],
    nextId: 1,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      crystals: 120,
      lives: 10,
      turrets: [],
      enemies: [],
      nextId: 1,
      spawnTimer: 0,
    };
    setScore(0);
    setCrystals(120);
    setLives(10);
    setGameState('PLAYING');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = stateRef.current;
    if (state.gameState !== 'PLAYING' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const costs = { flame: 50, fireball: 75, plasma: 100 };
    const cost = costs[selectedTurretType];

    if (state.crystals < cost) return;

    // Check distance from path to avoid building directly on path
    const isTooCloseToPath = PATH.some((pt) => Math.hypot(pt.x - x, pt.y - y) < 35);
    if (isTooCloseToPath) return;

    // Check distance from existing turrets
    const isTooCloseToTurret = state.turrets.some((t) => Math.hypot(t.x - x, t.y - y) < 40);
    if (isTooCloseToTurret) return;

    state.crystals -= cost;
    setCrystals(state.crystals);

    const props = {
      flame: { range: 80, damage: 1.5, cooldown: 8 },
      fireball: { range: 140, damage: 15, cooldown: 35 },
      plasma: { range: 100, damage: 8, cooldown: 20 },
    }[selectedTurretType];

    state.turrets.push({
      x,
      y,
      type: selectedTurretType,
      range: props.range,
      damage: props.damage,
      cooldown: props.cooldown,
      timer: 0,
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
        // Spawn frost enemies
        state.spawnTimer++;
        if (state.spawnTimer > 70) {
          state.spawnTimer = 0;
          const hpBoost = 1 + Math.floor(state.score / 250) * 0.25;
          state.enemies.push({
            id: state.nextId++,
            x: PATH[0].x,
            y: PATH[0].y,
            hp: Math.floor(30 * hpBoost),
            maxHp: Math.floor(30 * hpBoost),
            speed: 1.2,
            pathIdx: 0,
          });
        }

        // Move enemies along path
        for (let i = state.enemies.length - 1; i >= 0; i--) {
          const e = state.enemies[i];
          const target = PATH[e.pathIdx + 1];

          if (target) {
            const dx = target.x - e.x;
            const dy = target.y - e.y;
            const dist = Math.hypot(dx, dy);

            if (dist < e.speed) {
              e.x = target.x;
              e.y = target.y;
              e.pathIdx++;
            } else {
              e.x += (dx / dist) * e.speed;
              e.y += (dy / dist) * e.speed;
            }
          } else {
            // Reached base
            state.lives -= 1;
            setLives(state.lives);
            state.enemies.splice(i, 1);

            if (state.lives <= 0) {
              state.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: state.score } }));
            }
          }
        }

        // Turret attacks
        state.turrets.forEach((t) => {
          t.timer++;
          if (t.timer >= t.cooldown) {
            // Find target enemy in range
            const target = state.enemies.find((e) => Math.hypot(e.x - t.x, e.y - t.y) <= t.range);
            if (target) {
              t.timer = 0;
              target.hp -= t.damage;
              if (target.hp <= 0) {
                state.score += 25;
                state.crystals += 15;
                setScore(state.score);
                setCrystals(state.crystals);
                state.enemies = state.enemies.filter((e) => e.id !== target.id);
              }
            }
          }
        });
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 480);

      // Draw Path
      ctx.strokeStyle = '#38bdf844';
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y);
      }
      ctx.stroke();

      if (state.gameState === 'PLAYING') {
        // Draw Turrets
        state.turrets.forEach((t) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
          ctx.fillStyle = '#f9731611';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
          ctx.fillStyle = t.type === 'flame' ? '#f97316' : t.type === 'fireball' ? '#ef4444' : '#eab308';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#f97316';
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw Frost Enemies
        state.enemies.forEach((e) => {
          ctx.beginPath();
          ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();

          // HP bar
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(e.x - 10, e.y - 16, (e.hp / e.maxHp) * 20, 3);
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-[400px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-orange-400">Pyro Force 2</h2>
          <p className="text-xs text-zinc-400">Flame turrets defense against frost</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-orange-300">Score: {score}</div>
          <div className="text-xs text-amber-400">Crystals: 🔥 {crystals}</div>
          <div className="text-xs text-rose-400">Lives: {'❤️'.repeat(Math.max(0, lives))}</div>
        </div>
      </div>

      <div className="relative border border-orange-900/50 rounded-xl overflow-hidden bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={400}
          height={480}
          onClick={handleCanvasClick}
          className="cursor-crosshair block"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-orange-400 mb-2">PYRO FORCE 2</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Select a flame turret type below, then click on the map to place turrets and stop the icy invasion!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition"
            >
              Start Defense
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-rose-500 mb-2">BASE FROZEN</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Defense Score: <span className="text-orange-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {gameState === 'PLAYING' && (
        <div className="flex gap-2 mt-3 w-[400px]">
          <button
            onClick={() => setSelectedTurretType('flame')}
            className={`flex-1 py-2 px-1 text-xs rounded-lg border font-bold ${
              selectedTurretType === 'flame'
                ? 'bg-orange-900 border-orange-400 text-orange-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            🔥 Flame Jet (50)
          </button>
          <button
            onClick={() => setSelectedTurretType('fireball')}
            className={`flex-1 py-2 px-1 text-xs rounded-lg border font-bold ${
              selectedTurretType === 'fireball'
                ? 'bg-rose-900 border-rose-400 text-rose-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            💥 Fireball (75)
          </button>
          <button
            onClick={() => setSelectedTurretType('plasma')}
            className={`flex-1 py-2 px-1 text-xs rounded-lg border font-bold ${
              selectedTurretType === 'plasma'
                ? 'bg-amber-900 border-amber-400 text-amber-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            ⚡ Plasma Cannon (100)
          </button>
        </div>
      )}
    </div>
  );
}
