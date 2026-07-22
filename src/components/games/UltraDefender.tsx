'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Turret {
  x: number;
  y: number;
  range: number;
  damage: number;
  lastFired: number;
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

// Path waypoints
const PATH = [
  { x: 0, y: 200 },
  { x: 150, y: 200 },
  { x: 150, y: 80 },
  { x: 350, y: 80 },
  { x: 350, y: 320 },
  { x: 500, y: 320 },
  { x: 500, y: 200 },
  { x: 600, y: 200 },
];

export default function UltraDefender() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [baseHp, setBaseHp] = useState(10);

  const turretsRef = useRef<Turret[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const nextEnemyId = useRef(0);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const energyRef = useRef(energy);
  energyRef.current = energy;
  const baseHpRef = useRef(baseHp);
  baseHpRef.current = baseHp;

  const gameOverHandled = useRef(false);

  const handleGameOver = (finalScore: number) => {
    if (gameOverHandled.current) return;
    gameOverHandled.current = true;
    setGameState('gameover');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  const startGame = () => {
    setScore(0);
    setEnergy(100);
    setBaseHp(10);
    scoreRef.current = 0;
    energyRef.current = 100;
    baseHpRef.current = 10;
    turretsRef.current = [];
    enemiesRef.current = [];
    gameOverHandled.current = false;
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let spawnTimer: NodeJS.Timeout;

    const spawnEnemy = () => {
      if (gameStateRef.current !== 'playing') return;

      const hp = 30 + Math.floor(scoreRef.current / 5);
      enemiesRef.current.push({
        id: nextEnemyId.current++,
        pathIdx: 0,
        x: PATH[0].x,
        y: PATH[0].y,
        hp,
        maxHp: hp,
        speed: 1.2 + Math.random() * 0.5,
      });

      const delay = Math.max(500, 1500 - scoreRef.current * 10);
      spawnTimer = setTimeout(spawnEnemy, delay);
    };

    spawnEnemy();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (!ctx || gameStateRef.current !== 'playing') return;

      // Draw background & path grid
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Path
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y);
      }
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 40;
      ctx.stroke();

      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Update & draw enemies
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        const targetWP = PATH[e.pathIdx + 1];

        if (targetWP) {
          const dx = targetWP.x - e.x;
          const dy = targetWP.y - e.y;
          const dist = Math.hypot(dx, dy);

          if (dist < e.speed) {
            e.pathIdx++;
          } else {
            e.x += (dx / dist) * e.speed;
            e.y += (dy / dist) * e.speed;
          }
        } else {
          // Reached Base!
          enemiesRef.current.splice(i, 1);
          const newBaseHp = baseHpRef.current - 1;
          setBaseHp(newBaseHp);
          baseHpRef.current = newBaseHp;
          if (newBaseHp <= 0) {
            handleGameOver(scoreRef.current);
            return;
          }
          continue;
        }

        // Draw enemy
        ctx.beginPath();
        ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // HP bar
        ctx.fillStyle = '#18181b';
        ctx.fillRect(e.x - 12, e.y - 18, 24, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(e.x - 12, e.y - 18, (e.hp / e.maxHp) * 24, 4);
      }

      // Update & draw turrets
      const now = Date.now();
      turretsRef.current.forEach((t) => {
        // Draw turret
        ctx.beginPath();
        ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Range indicator
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Find nearest enemy in range
        let target: Enemy | null = null;
        let minDist = t.range;
        for (const e of enemiesRef.current) {
          const d = Math.hypot(e.x - t.x, e.y - t.y);
          if (d < minDist) {
            minDist = d;
            target = e;
          }
        }

        if (target && now - t.lastFired > 400) {
          t.lastFired = now;
          target.hp -= t.damage;

          // Draw laser line
          ctx.beginPath();
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 3;
          ctx.stroke();

          if (target.hp <= 0) {
            const idx = enemiesRef.current.indexOf(target);
            if (idx !== -1) enemiesRef.current.splice(idx, 1);
            const newScore = scoreRef.current + 10;
            const newEnergy = energyRef.current + 15;
            setScore(newScore);
            setEnergy(newEnergy);
            scoreRef.current = newScore;
            energyRef.current = newEnergy;
          }
        }
      });

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(spawnTimer);
    };
  }, [gameState]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    if (energy < 40) return; // Turret cost

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check distance to path to prevent placing directly on path
    for (let i = 0; i < PATH.length - 1; i++) {
      const p1 = PATH[i];
      const p2 = PATH[i + 1];
      const distToSegment = Math.hypot(x - (p1.x + p2.x) / 2, y - (p1.y + p2.y) / 2);
      if (distToSegment < 25) return;
    }

    turretsRef.current.push({
      x,
      y,
      range: 100,
      damage: 15,
      lastFired: 0,
    });

    const newEnergy = energy - 40;
    setEnergy(newEnergy);
    energyRef.current = newEnergy;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-indigo-400 mb-2 tracking-wider">ULTRA DEFENDER</h1>

      {gameState === 'playing' && (
        <div className="flex justify-between w-[600px] max-w-full px-4 mb-2 text-lg font-bold">
          <span className="text-indigo-400">Score: {score}</span>
          <span className="text-yellow-400">Energy: ⚡{energy}</span>
          <span className="text-red-400">Base HP: {baseHp}</span>
        </div>
      )}

      <div className="relative border-2 border-indigo-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onClick={handleCanvasClick}
          className="cursor-pointer max-w-full"
        />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-6 max-w-md">
              Click anywhere off the gray path to place defensive laser turrets (Cost: 40 Energy). Stop invading bots from breaching your base!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              DEPLOY DEFENSES
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">BASE OVERRUN!</h2>
            <p className="text-2xl text-indigo-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
