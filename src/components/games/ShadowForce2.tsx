'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Sentinel {
  x: number;
  y: number;
  type: 'blade' | 'shuriken' | 'phantom';
  range: number;
  damage: number;
  cooldown: number;
  maxCooldown: number;
}

interface Enemy {
  id: number;
  pathIdx: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
}

const PATH = [
  { x: 0, y: 80 },
  { x: 140, y: 80 },
  { x: 140, y: 220 },
  { x: 280, y: 220 },
  { x: 280, y: 120 },
  { x: 420, y: 120 },
  { x: 420, y: 320 },
];

export default function ShadowForce2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shadowEnergy, setShadowEnergy] = useState(150);
  const [lives, setLives] = useState(15);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedType, setSelectedType] = useState<'blade' | 'shuriken' | 'phantom'>('blade');
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    shadowEnergy: 150,
    lives: 15,
    wave: 1,
    score: 0,
    sentinels: [] as Sentinel[],
    enemies: [] as Enemy[],
    nextEnemyId: 1,
    spawnTimer: 0,
    enemiesToSpawn: 10,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    stateRef.current = {
      shadowEnergy: 150,
      lives: 15,
      wave: 1,
      score: 0,
      sentinels: [],
      enemies: [],
      nextEnemyId: 1,
      spawnTimer: 0,
      enemiesToSpawn: 10,
      started: true,
      gameOver: false,
    };
    setShadowEnergy(150);
    setLives(15);
    setWave(1);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const costs = { blade: 60, shuriken: 90, phantom: 120 };
    const cost = costs[selectedType];

    if (s.shadowEnergy >= cost) {
      s.shadowEnergy -= cost;
      setShadowEnergy(s.shadowEnergy);

      const configs = {
        blade: { range: 65, damage: 18, maxCooldown: 20 },
        shuriken: { range: 110, damage: 12, maxCooldown: 30 },
        phantom: { range: 85, damage: 8, maxCooldown: 15 },
      }[selectedType];

      s.sentinels.push({
        x: cx,
        y: cy,
        type: selectedType,
        range: configs.range,
        damage: configs.damage,
        cooldown: 0,
        maxCooldown: configs.maxCooldown,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Path
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      if (s.started && !s.gameOver) {
        // Spawn Enemies
        if (s.enemiesToSpawn > 0) {
          s.spawnTimer++;
          if (s.spawnTimer > 40) {
            s.spawnTimer = 0;
            s.enemiesToSpawn--;
            const hpBase = 40 + s.wave * 20;
            s.enemies.push({
              id: s.nextEnemyId++,
              pathIdx: 0,
              x: PATH[0].x,
              y: PATH[0].y,
              hp: hpBase,
              maxHp: hpBase,
              speed: 1.2 + s.wave * 0.1,
            });
          }
        } else if (s.enemies.length === 0) {
          // Next wave
          s.wave++;
          setWave(s.wave);
          s.enemiesToSpawn = 8 + s.wave * 3;
          s.shadowEnergy += 75;
          setShadowEnergy(s.shadowEnergy);
        }

        // Move Enemies
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          const target = PATH[e.pathIdx + 1];

          if (target) {
            const dx = target.x - e.x;
            const dy = target.y - e.y;
            const dist = Math.hypot(dx, dy);

            if (dist < e.speed) {
              e.pathIdx++;
              if (e.pathIdx >= PATH.length - 1) {
                // Reached sanctuary
                s.lives--;
                setLives(s.lives);
                s.enemies.splice(i, 1);
                if (s.lives <= 0) {
                  s.gameOver = true;
                  setGameOver(true);
                  window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: s.score } }));
                }
                continue;
              }
            } else {
              e.x += (dx / dist) * e.speed;
              e.y += (dy / dist) * e.speed;
            }
          }
        }

        // Sentinels attack
        s.sentinels.forEach((sen) => {
          if (sen.cooldown > 0) sen.cooldown--;
          else {
            // Find target
            const target = s.enemies.find((e) => Math.hypot(e.x - sen.x, e.y - sen.y) <= sen.range);
            if (target) {
              target.hp -= sen.damage;
              sen.cooldown = sen.maxCooldown;

              // Laser beam effect
              ctx.strokeStyle = sen.type === 'blade' ? '#a855f7' : sen.type === 'shuriken' ? '#38bdf8' : '#e11d48';
              ctx.beginPath();
              ctx.moveTo(sen.x, sen.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();

              if (target.hp <= 0) {
                s.shadowEnergy += 15;
                setShadowEnergy(s.shadowEnergy);
                s.score += 30;
                setScore(s.score);
              }
            }
          }
        });

        // Filter dead enemies
        s.enemies = s.enemies.filter((e) => e.hp > 0);
      }

      // Draw Sentinels
      s.sentinels.forEach((sen) => {
        ctx.fillStyle = sen.type === 'blade' ? '#a855f7' : sen.type === 'shuriken' ? '#38bdf8' : '#e11d48';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(sen.x, sen.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Enemies
      s.enemies.forEach((e) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = '#27272a';
        ctx.fillRect(e.x - 10, e.y - 14, 20, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(e.x - 10, e.y - 14, (20 * e.hp) / e.maxHp, 3);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[440px] flex justify-between items-center mb-2 text-xs font-semibold">
        <span className="text-purple-400 font-bold">Wave {wave}</span>
        <span className="text-rose-400">Sanctuary Lives: {lives}</span>
        <span className="text-amber-400">Score: {score}</span>
      </div>

      <div className="relative border-2 border-purple-500/40 rounded-lg overflow-hidden shadow-lg shadow-purple-500/10 cursor-pointer">
        <canvas ref={canvasRef} width={440} height={350} onClick={handleCanvasClick} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">
              {gameOver ? 'SANCTUARY OVERRUN' : 'SHADOW FORCE 2'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4 font-semibold">Final Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Defend Sanctuary'}
            </button>
          </div>
        )}
      </div>

      {/* Sentinel selection */}
      <div className="w-full max-w-[440px] mt-3 flex justify-between items-center bg-zinc-900 p-2 rounded-lg border border-zinc-800 text-xs">
        <div className="font-bold text-purple-400">Energy: ⚡{shadowEnergy}</div>
        <div className="flex gap-2">
          {(['blade', 'shuriken', 'phantom'] as const).map((t) => {
            const costs = { blade: 60, shuriken: 90, phantom: 120 };
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded font-bold capitalize transition border ${
                  selectedType === t
                    ? 'bg-purple-600/40 border-purple-400 text-purple-300'
                    : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {t} ({costs[t]}E)
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
