'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Orb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isBomb: boolean;
  sliced: boolean;
}

export default function SolarNinja() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const livesRef = useRef(lives);
  livesRef.current = lives;

  const orbsRef = useRef<Orb[]>([]);
  const trailRef = useRef<{ x: number; y: number; life: number }[]>([]);
  const nextId = useRef(0);

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
    setLives(3);
    scoreRef.current = 0;
    livesRef.current = 3;
    orbsRef.current = [];
    trailRef.current = [];
    gameOverHandled.current = false;
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let spawnTimer: NodeJS.Timeout;

    const spawnOrb = () => {
      if (gameStateRef.current !== 'playing') return;
      const isBomb = Math.random() < 0.2;
      const radius = isBomb ? 24 : 26 + Math.random() * 10;
      const x = 50 + Math.random() * 500;
      const y = 420;
      const vx = (Math.random() - 0.5) * 6;
      const vy = -(12 + Math.random() * 5);
      const colors = ['#fbbf24', '#f97316', '#ef4444', '#eab308'];
      const color = isBomb ? '#475569' : colors[Math.floor(Math.random() * colors.length)];

      orbsRef.current.push({
        id: nextId.current++,
        x,
        y,
        vx,
        vy,
        radius,
        color,
        isBomb,
        sliced: false,
      });

      const nextDelay = 800 + Math.random() * 800;
      spawnTimer = setTimeout(spawnOrb, nextDelay);
    };

    spawnOrb();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (!ctx || gameStateRef.current !== 'playing') return;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw trail
      trailRef.current.forEach((pt, idx) => {
        pt.life -= 0.05;
        if (pt.life > 0) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4 * pt.life, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 191, 36, ${pt.life})`;
          ctx.fill();
        }
      });
      trailRef.current = trailRef.current.filter((pt) => pt.life > 0);

      // Update & draw orbs
      for (let i = orbsRef.current.length - 1; i >= 0; i--) {
        const orb = orbsRef.current[i];
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.vy += 0.35; // gravity

        if (orb.y > canvas.height + 40) {
          if (!orb.sliced && !orb.isBomb) {
            const newLives = livesRef.current - 1;
            setLives(newLives);
            livesRef.current = newLives;
            if (newLives <= 0) {
              handleGameOver(scoreRef.current);
              return;
            }
          }
          orbsRef.current.splice(i, 1);
          continue;
        }

        // Draw orb
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.shadowBlur = orb.isBomb ? 5 : 15;
        ctx.shadowColor = orb.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (orb.isBomb) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💣', orb.x, orb.y + 5);
        }
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(spawnTimer);
    };
  }, [gameState]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    trailRef.current.push({ x, y, life: 1.0 });

    // Check collision with orbs
    orbsRef.current.forEach((orb) => {
      if (orb.sliced) return;
      const dx = orb.x - x;
      const dy = orb.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < orb.radius + 10) {
        orb.sliced = true;
        if (orb.isBomb) {
          handleGameOver(scoreRef.current);
        } else {
          const newScore = scoreRef.current + 10;
          setScore(newScore);
          scoreRef.current = newScore;
          orb.radius = 0; // vanish
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-amber-400 mb-2 tracking-wider">SOLAR NINJA</h1>

      {gameState === 'playing' && (
        <div className="flex justify-between w-[600px] max-w-full px-4 mb-2 text-lg font-bold">
          <span className="text-amber-400">Score: {score}</span>
          <span className="text-red-400">Lives: {'❤️'.repeat(lives)}</span>
        </div>
      )}

      <div className="relative border-2 border-amber-500/30 rounded-lg overflow-hidden bg-zinc-900">
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
              Slice the solar energy spheres before they drop! Avoid dark anti-matter bombs. Swipe or drag your mouse across targets.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              START SLICING
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">GAME OVER</h2>
            <p className="text-2xl text-amber-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
