'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Turret {
  x: number;
  y: number;
  type: 'laser' | 'plasma' | 'missile';
  range: number;
  damage: number;
  cooldown: number;
}

interface Creep {
  id: number;
  x: number;
  y: number;
  pathIndex: number;
  hp: number;
  maxHp: number;
  speed: number;
}

const PATH = [
  { x: 30, y: 30 },
  { x: 380, y: 30 },
  { x: 380, y: 200 },
  { x: 70, y: 200 },
  { x: 70, y: 380 },
  { x: 420, y: 380 },
];

export default function RetroForce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(100);
  const [baseHp, setBaseHp] = useState<number>(100);
  const [selectedType, setSelectedType] = useState<'laser' | 'plasma' | 'missile'>('laser');

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    energy: 100,
    baseHp: 100,
    turrets: [] as Turret[],
    creeps: [] as Creep[],
    nextCreepId: 1,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      energy: 100,
      baseHp: 100,
      turrets: [],
      creeps: [],
      nextCreepId: 1,
      spawnTimer: 0,
    };
    setScore(0);
    setEnergy(100);
    setBaseHp(100);
    setGameState('PLAYING');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stateRef.current;
    if (st.gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cost = selectedType === 'laser' ? 40 : selectedType === 'plasma' ? 70 : 100;
    if (st.energy < cost) return;

    // Check if clicked too close to path
    let nearPath = false;
    for (let i = 0; i < PATH.length - 1; i++) {
      const p1 = PATH[i];
      const p2 = PATH[i + 1];
      const dist = Math.abs((p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x) / Math.hypot(p2.y - p1.y, p2.x - p1.x);
      if (dist < 25) nearPath = true;
    }

    if (!nearPath) {
      st.energy -= cost;
      setEnergy(st.energy);

      const range = selectedType === 'laser' ? 90 : selectedType === 'plasma' ? 70 : 120;
      const damage = selectedType === 'laser' ? 12 : selectedType === 'plasma' ? 35 : 55;

      st.turrets.push({ x, y, type: selectedType, range, damage, cooldown: 0 });
    }
  };

  useEffect(() => {
    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Path
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y);
      }
      ctx.stroke();

      const st = stateRef.current;

      if (st.gameState === 'PLAYING') {
        // Spawn Creeps
        st.spawnTimer++;
        if (st.spawnTimer > 45) {
          st.spawnTimer = 0;
          st.creeps.push({
            id: st.nextCreepId++,
            x: PATH[0].x,
            y: PATH[0].y,
            pathIndex: 0,
            hp: 60 + Math.floor(st.score / 5),
            maxHp: 60 + Math.floor(st.score / 5),
            speed: 1.5 + Math.random() * 0.5,
          });
        }

        // Move Creeps
        for (let i = st.creeps.length - 1; i >= 0; i--) {
          const c = st.creeps[i];
          const target = PATH[c.pathIndex + 1];

          if (!target) {
            // Reached base
            st.baseHp -= 15;
            setBaseHp(Math.max(0, st.baseHp));
            if (st.baseHp <= 0) {
              st.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
            }
            st.creeps.splice(i, 1);
            continue;
          }

          const dx = target.x - c.x;
          const dy = target.y - c.y;
          const dist = Math.hypot(dx, dy);

          if (dist < c.speed) {
            c.pathIndex++;
          } else {
            c.x += (dx / dist) * c.speed;
            c.y += (dy / dist) * c.speed;
          }
        }

        // Turrets attack
        st.turrets.forEach((t) => {
          t.cooldown = Math.max(0, t.cooldown - 1);
          if (t.cooldown === 0) {
            // Find target
            const target = st.creeps.find((c) => Math.hypot(c.x - t.x, c.y - t.y) <= t.range);
            if (target) {
              t.cooldown = t.type === 'laser' ? 12 : t.type === 'plasma' ? 25 : 40;
              target.hp -= t.damage;

              // Laser beam line
              ctx.strokeStyle = t.type === 'laser' ? '#38bdf8' : t.type === 'plasma' ? '#a855f7' : '#f97316';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(t.x, t.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();

              if (target.hp <= 0) {
                st.score += 25;
                st.energy += 15;
                setScore(st.score);
                setEnergy(st.energy);
                st.creeps = st.creeps.filter((c) => c.id !== target.id);
              }
            }
          }
        });

        // Draw Creeps
        st.creeps.forEach((c) => {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
          ctx.fill();

          // HP Bar
          ctx.fillStyle = '#15803d';
          ctx.fillRect(c.x - 10, c.y - 16, (c.hp / c.maxHp) * 20, 3);
        });

        // Draw Turrets
        st.turrets.forEach((t) => {
          ctx.fillStyle = t.type === 'laser' ? '#0284c7' : t.type === 'plasma' ? '#7e22ce' : '#c2410c';
          ctx.beginPath();
          ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[450px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Retro Force</h2>
          <p className="text-xs text-zinc-400">Tactical Tower Defense Strategy</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-cyan-300">Score: {score}</div>
          <div className="text-xs text-emerald-400">Energy: {energy} | Base: {baseHp}%</div>
        </div>
      </div>

      <div className="relative border border-cyan-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950 flex flex-col items-center">
        {/* Turret Selection Toolbar */}
        <div className="flex justify-center gap-3 p-2 bg-zinc-900 w-full border-b border-zinc-800 z-10">
          {[
            { id: 'laser', name: '🔫 Laser', cost: 40 },
            { id: 'plasma', name: '💥 Plasma', cost: 70 },
            { id: 'missile', name: '🚀 Missile', cost: 100 },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id as any)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                selectedType === t.id
                  ? 'border-cyan-400 bg-cyan-950 text-cyan-200'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {t.name} ({t.cost} E)
            </button>
          ))}
        </div>

        <canvas ref={canvasRef} width={450} height={420} onClick={handleCanvasClick} className="block cursor-crosshair" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-3xl font-extrabold text-cyan-400 mb-2">RETRO FORCE</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Select turrets at top and click anywhere off the main path to construct defensive towers against alien waves!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition shadow-lg shadow-cyan-600/30"
            >
              Deploy Defense
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">BASE BREACHED</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-cyan-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
