'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Invader {
  id: number;
  x: number;
  y: number;
  type: 'alien' | 'asteroid';
  hp: number;
  speedY: number;
  size: number;
}

interface Bullet {
  x: number;
  y: number;
}

export default function PixelBlaster() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    lives: 3,
    playerX: 250,
    bullets: [] as Bullet[],
    invaders: [] as Invader[],
    spawnTimer: 0,
    shootTimer: 0,
    keys: { left: false, right: false, space: false },
    nextId: 1,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      lives: 3,
      playerX: 250,
      bullets: [],
      invaders: [],
      spawnTimer: 0,
      shootTimer: 0,
      keys: { left: false, right: false, space: false },
      nextId: 1,
    };
    setScore(0);
    setLives(3);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.space = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const st = stateRef.current;

      // Dark space background with stars
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (st.gameState === 'PLAYING') {
        // Player movement
        if (st.keys.left && st.playerX > 25) st.playerX -= 6;
        if (st.keys.right && st.playerX < canvas.width - 25) st.playerX += 6;

        // Auto/Manual Shooting
        st.shootTimer++;
        if ((st.keys.space || st.shootTimer % 15 === 0) && st.shootTimer > 8) {
          st.bullets.push({ x: st.playerX, y: 440 });
        }

        // Move Bullets
        for (let i = st.bullets.length - 1; i >= 0; i--) {
          st.bullets[i].y -= 9;
          if (st.bullets[i].y < -10) st.bullets.splice(i, 1);
        }

        // Spawn invaders
        st.spawnTimer++;
        if (st.spawnTimer > Math.max(18, 50 - Math.floor(st.score / 100))) {
          st.spawnTimer = 0;
          const isAsteroid = Math.random() > 0.6;
          st.invaders.push({
            id: st.nextId++,
            x: 30 + Math.random() * (canvas.width - 60),
            y: -30,
            type: isAsteroid ? 'asteroid' : 'alien',
            hp: isAsteroid ? 2 : 1,
            speedY: isAsteroid ? 1.5 + Math.random() : 2.5 + Math.random() * 1.5,
            size: isAsteroid ? 24 : 18,
          });
        }

        // Move Invaders & Handle Collisions
        for (let i = st.invaders.length - 1; i >= 0; i--) {
          const inv = st.invaders[i];
          inv.y += inv.speedY;

          // Bullet hits invader
          for (let j = st.bullets.length - 1; j >= 0; j--) {
            const b = st.bullets[j];
            if (Math.abs(b.x - inv.x) < inv.size && Math.abs(b.y - inv.y) < inv.size) {
              inv.hp -= 1;
              st.bullets.splice(j, 1);
              if (inv.hp <= 0) {
                st.score += inv.type === 'asteroid' ? 50 : 30;
                setScore(st.score);
                st.invaders.splice(i, 1);
                break;
              }
            }
          }

          // Invader reaches bottom or hits player
          if (inv.y >= 430 && Math.abs(inv.x - st.playerX) < 30) {
            st.lives -= 1;
            setLives(st.lives);
            st.invaders.splice(i, 1);
            if (st.lives <= 0) {
              st.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
            }
          } else if (inv.y > canvas.height + 40) {
            st.invaders.splice(i, 1);
          }
        }

        // Draw Bullets
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        st.bullets.forEach((b) => {
          ctx.fillRect(b.x - 3, b.y - 8, 6, 12);
        });
        ctx.shadowBlur = 0;

        // Draw Invaders
        st.invaders.forEach((inv) => {
          if (inv.type === 'alien') {
            ctx.fillStyle = '#a855f7';
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 10;
            ctx.fillRect(inv.x - 12, inv.y - 12, 24, 24);
            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(inv.x - 7, inv.y - 5, 4, 4);
            ctx.fillRect(inv.x + 3, inv.y - 5, 4, 4);
          } else {
            ctx.fillStyle = '#f97316';
            ctx.shadowColor = '#fb923c';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(inv.x, inv.y, inv.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        });

        // Draw Player Ship
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(st.playerX, 420);
        ctx.lineTo(st.playerX - 22, 460);
        ctx.lineTo(st.playerX + 22, 460);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-emerald-400">Pixel Blaster</h2>
          <p className="text-xs text-zinc-400">Blast incoming retro aliens & pixel asteroids!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-red-400">Lives: {'❤️'.repeat(lives)}</div>
          <div className="text-lg font-semibold text-emerald-400">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-emerald-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={480} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-emerald-400 mb-2">PIXEL BLASTER</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Use Left/Right arrow keys or A/D to steer your ship. Press Space to fire retro plasma blasts!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-lg shadow-emerald-600/30"
            >
              Launch Ship
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">SHIP DESTROYED</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-emerald-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
