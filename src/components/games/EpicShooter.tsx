'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  radius: number;
}

export default function EpicShooter() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(100);

  const playerPos = useRef({ x: 300, y: 200 });
  const mousePos = useRef({ x: 300, y: 200 });
  const keys = useRef<{ [key: string]: boolean }>({});
  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const nextEnemyId = useRef(0);
  const lastShot = useRef(0);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const hpRef = useRef(hp);
  hpRef.current = hp;

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
    setHp(100);
    scoreRef.current = 0;
    hpRef.current = 100;
    playerPos.current = { x: 300, y: 200 };
    bullets.current = [];
    enemies.current = [];
    gameOverHandled.current = false;
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let spawnTimer: NodeJS.Timeout;

    const spawnEnemy = () => {
      if (gameStateRef.current !== 'playing') return;

      const side = Math.floor(Math.random() * 4);
      let x = 0,
        y = 0;
      if (side === 0) {
        x = Math.random() * 600;
        y = -20;
      } else if (side === 1) {
        x = 620;
        y = Math.random() * 400;
      } else if (side === 2) {
        x = Math.random() * 600;
        y = 420;
      } else {
        x = -20;
        y = Math.random() * 400;
      }

      enemies.current.push({
        id: nextEnemyId.current++,
        x,
        y,
        hp: 1,
        radius: 14,
      });

      const delay = Math.max(300, 1000 - scoreRef.current * 10);
      spawnTimer = setTimeout(spawnEnemy, delay);
    };

    spawnEnemy();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (!ctx || gameStateRef.current !== 'playing') return;

      // Player movement
      const speed = 4;
      if (keys.current['w'] || keys.current['arrowup']) playerPos.current.y = Math.max(15, playerPos.current.y - speed);
      if (keys.current['s'] || keys.current['arrowdown']) playerPos.current.y = Math.min(385, playerPos.current.y + speed);
      if (keys.current['a'] || keys.current['arrowleft']) playerPos.current.x = Math.max(15, playerPos.current.x - speed);
      if (keys.current['d'] || keys.current['arrowright']) playerPos.current.x = Math.min(585, playerPos.current.x + speed);

      // Auto shooting towards mouse
      const now = Date.now();
      if (now - lastShot.current > 150) {
        lastShot.current = now;
        const dx = mousePos.current.x - playerPos.current.x;
        const dy = mousePos.current.y - playerPos.current.y;
        const len = Math.hypot(dx, dy) || 1;
        const bSpeed = 10;
        bullets.current.push({
          x: playerPos.current.x,
          y: playerPos.current.y,
          vx: (dx / len) * bSpeed,
          vy: (dy / len) * bSpeed,
        });
      }

      // Draw background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update & draw bullets
      for (let i = bullets.current.length - 1; i >= 0; i--) {
        const b = bullets.current[i];
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          bullets.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#60a5fa';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & draw enemies
      for (let i = enemies.current.length - 1; i >= 0; i--) {
        const e = enemies.current[i];
        const dx = playerPos.current.x - e.x;
        const dy = playerPos.current.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const eSpeed = 1.8;

        e.x += (dx / dist) * eSpeed;
        e.y += (dy / dist) * eSpeed;

        // Check player hit
        if (dist < e.radius + 12) {
          const newHp = hpRef.current - 20;
          setHp(newHp);
          hpRef.current = newHp;
          enemies.current.splice(i, 1);

          if (newHp <= 0) {
            handleGameOver(scoreRef.current);
            return;
          }
          continue;
        }

        // Check bullet hit
        for (let j = bullets.current.length - 1; j >= 0; j--) {
          const b = bullets.current[j];
          const bDist = Math.hypot(b.x - e.x, b.y - e.y);
          if (bDist < e.radius + 4) {
            bullets.current.splice(j, 1);
            enemies.current.splice(i, 1);
            const newScore = scoreRef.current + 10;
            setScore(newScore);
            scoreRef.current = newScore;
            break;
          }
        }

        if (enemies.current[i]) {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ef4444';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw player
      ctx.save();
      ctx.translate(playerPos.current.x, playerPos.current.y);
      const angle = Math.atan2(mousePos.current.y - playerPos.current.y, mousePos.current.x - playerPos.current.x);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fillStyle = '#3b82f6';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#3b82f6';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(spawnTimer);
    };
  }, [gameState]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePos.current = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-blue-400 mb-2 tracking-wider">EPIC SHOOTER</h1>

      {gameState === 'playing' && (
        <div className="flex justify-between w-[600px] max-w-full px-4 mb-2 text-lg font-bold">
          <span className="text-blue-400">Score: {score}</span>
          <span className="text-red-400">HP: {hp}%</span>
        </div>
      )}

      <div className="relative border-2 border-blue-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onPointerMove={handlePointerMove}
          className="cursor-crosshair touch-none max-w-full"
        />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-6 max-w-md">
              Use WASD / Arrow keys to navigate your hero. Aim with your mouse to blast invading alien swarms!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              START BATTLE
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">DESTROYED</h2>
            <p className="text-2xl text-blue-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              RESPAWN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
