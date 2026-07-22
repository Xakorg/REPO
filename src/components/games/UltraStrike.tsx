'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Bullet {
  x: number;
  y: number;
  vy: number;
  isEnemy: boolean;
}

interface EnemyShip {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
}

export default function UltraStrike() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [shields, setShields] = useState<number>(3);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    shields: 3,
    px: 225,
    py: 420,
    bullets: [] as Bullet[],
    enemies: [] as EnemyShip[],
    nextEnemyId: 1,
    spawnTimer: 0,
    shootTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      shields: 3,
      px: 225,
      py: 420,
      bullets: [],
      enemies: [],
      nextEnemyId: 1,
      spawnTimer: 0,
      shootTimer: 0,
    };
    setScore(0);
    setShields(3);
    setGameState('PLAYING');
  };

  useEffect(() => {
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      stateRef.current.px = Math.max(15, Math.min(canvas.width - 15, e.clientX - rect.left));
      stateRef.current.py = Math.max(50, Math.min(canvas.height - 30, e.clientY - rect.top));
    };

    window.addEventListener('mousemove', handleMouseMove);

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space animated stars background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const st = stateRef.current;

      if (st.gameState === 'PLAYING') {
        // Auto-shoot player lasers
        st.shootTimer++;
        if (st.shootTimer > 8) {
          st.shootTimer = 0;
          st.bullets.push({ x: st.px - 10, y: st.py - 15, vy: -10, isEnemy: false });
          st.bullets.push({ x: st.px + 10, y: st.py - 15, vy: -10, isEnemy: false });
        }

        // Spawn Enemies
        st.spawnTimer++;
        if (st.spawnTimer > 35) {
          st.spawnTimer = 0;
          st.enemies.push({
            id: st.nextEnemyId++,
            x: Math.random() * (canvas.width - 40) + 20,
            y: -20,
            vx: (Math.random() - 0.5) * 2,
            vy: 2.5 + Math.random() * 1.5,
            hp: 20,
          });
        }

        // Update Bullets
        for (let i = st.bullets.length - 1; i >= 0; i--) {
          const b = st.bullets[i];
          b.y += b.vy;

          if (b.y < -10 || b.y > canvas.height + 10) {
            st.bullets.splice(i, 1);
            continue;
          }

          // Player bullet hitting enemy
          if (!b.isEnemy) {
            for (let j = st.enemies.length - 1; j >= 0; j--) {
              const enemy = st.enemies[j];
              if (Math.hypot(b.x - enemy.x, b.y - enemy.y) < 20) {
                enemy.hp -= 10;
                st.bullets.splice(i, 1);
                if (enemy.hp <= 0) {
                  st.score += 50;
                  setScore(st.score);
                  st.enemies.splice(j, 1);
                }
                break;
              }
            }
          }
        }

        // Update Enemies
        for (let i = st.enemies.length - 1; i >= 0; i--) {
          const enemy = st.enemies[i];
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Enemy collision with Player
          if (Math.hypot(enemy.x - st.px, enemy.y - st.py) < 24) {
            st.shields -= 1;
            setShields(st.shields);
            st.enemies.splice(i, 1);

            if (st.shields <= 0) {
              st.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
            }
            continue;
          }

          if (enemy.y > canvas.height + 20) {
            st.enemies.splice(i, 1);
          }
        }

        // Draw Player Ship
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(st.px, st.py - 20);
        ctx.lineTo(st.px - 18, st.py + 15);
        ctx.lineTo(st.px + 18, st.py + 15);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Bullets
        st.bullets.forEach((b) => {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        });

        // Draw Enemy Ships
        st.enemies.forEach((enemy) => {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#b91c1c';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y + 15);
          ctx.lineTo(enemy.x - 15, enemy.y - 12);
          ctx.lineTo(enemy.x + 15, enemy.y - 12);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[450px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-red-500">Ultra Strike</h2>
          <p className="text-xs text-zinc-400">Vertical Sci-Fi Arcade Shooter</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-red-400">Score: {score}</div>
          <div className="text-xs text-sky-400">Shield: {'🛡️'.repeat(shields)}</div>
        </div>
      </div>

      <div className="relative border border-red-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={450} height={500} className="block cursor-none" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">ULTRA STRIKE</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Guide your fighter jet with the mouse! Auto-fire handles cannon blasts. Blast alien armadas before they breach your shield!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition shadow-lg shadow-red-600/30"
            >
              Take Off
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">SHIP DESTROYED</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-red-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
