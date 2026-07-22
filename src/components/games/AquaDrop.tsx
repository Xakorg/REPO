'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  level: number;
  radius: number;
  color: string;
}

const DROPLET_TYPES = [
  { level: 1, radius: 14, color: '#38bdf8' },
  { level: 2, radius: 20, color: '#06b6d4' },
  { level: 3, radius: 28, color: '#10b981' },
  { level: 4, radius: 38, color: '#eab308' },
  { level: 5, radius: 50, color: '#ec4899' },
];

export default function AquaDrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const scoreRef = useRef<number>(0);

  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const dropXRef = useRef<number>(200);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setCurrentLevel(1);
    dropXRef.current = 200;
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let droplets: Droplet[] = [];
    let canDrop = true;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      dropXRef.current = Math.max(30, Math.min(canvas.width - 30, e.clientX - rect.left));
    };

    const handleClick = () => {
      if (!canDrop) return;
      canDrop = false;

      const type = DROPLET_TYPES[currentLevel - 1];
      droplets.push({
        x: dropXRef.current,
        y: 40,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 1,
        level: type.level,
        radius: type.radius,
        color: type.color,
      });

      setTimeout(() => {
        setCurrentLevel(Math.floor(Math.random() * 3) + 1);
        canDrop = true;
      }, 500);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const gameLoop = () => {
      // Physics step
      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        d.vy += 0.3; // Gravity
        d.x += d.vx;
        d.y += d.vy;

        // Floor collision
        if (d.y + d.radius > canvas.height - 10) {
          d.y = canvas.height - 10 - d.radius;
          d.vy = -d.vy * 0.2;
          d.vx *= 0.8;
        }

        // Wall collision
        if (d.x - d.radius < 10) {
          d.x = 10 + d.radius;
          d.vx = -d.vx * 0.5;
        }
        if (d.x + d.radius > canvas.width - 10) {
          d.x = canvas.width - 10 - d.radius;
          d.vx = -d.vx * 0.5;
        }

        // Check overflow for game over
        if (d.y - d.radius < 60 && Math.abs(d.vy) < 0.5) {
          const finalScore = scoreRef.current;
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
          setGameState('GAMEOVER');
          return;
        }
      }

      // Droplet collisions & Merging
      for (let i = 0; i < droplets.length; i++) {
        for (let j = i + 1; j < droplets.length; j++) {
          const d1 = droplets[i];
          const d2 = droplets[j];
          const dx = d2.x - d1.x;
          const dy = d2.y - d1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = d1.radius + d2.radius;

          if (dist < minDist && dist > 0) {
            // Push apart
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            d1.x -= nx * overlap;
            d1.y -= ny * overlap;
            d2.x += nx * overlap;
            d2.y += ny * overlap;

            // Merge if same level
            if (d1.level === d2.level && d1.level < DROPLET_TYPES.length) {
              const newLevel = d1.level + 1;
              const nextType = DROPLET_TYPES[newLevel - 1];

              droplets.splice(j, 1);
              droplets.splice(i, 1);

              droplets.push({
                x: (d1.x + d2.x) / 2,
                y: (d1.y + d2.y) / 2,
                vx: 0,
                vy: -1,
                level: newLevel,
                radius: nextType.radius,
                color: nextType.color,
              });

              setScore((s) => s + newLevel * 40);
              break;
            }
          }
        }
      }

      // Draw
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw danger line
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(10, 60);
      ctx.lineTo(canvas.width - 10, 60);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw current preview droplet at top
      if (canDrop) {
        const previewType = DROPLET_TYPES[currentLevel - 1];
        ctx.fillStyle = previewType.color + '88';
        ctx.beginPath();
        ctx.arc(dropXRef.current, 35, previewType.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = previewType.color;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(dropXRef.current, 35);
        ctx.lineTo(dropXRef.current, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw droplets
      droplets.forEach((d) => {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff66';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState, currentLevel]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[400px] mb-4">
        <h2 className="text-xl font-bold text-teal-400">Aqua Drop</h2>
        <div className="text-lg font-semibold text-teal-300">Score: {score}</div>
      </div>

      <div className="relative border border-teal-900/50 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={400} height={520} className="bg-zinc-950 block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-teal-400 mb-2">AQUA DROP</h3>
            <p className="text-zinc-400 mb-6 max-w-xs">Drop water droplets. Match identical droplets to merge into larger ones. Don't let them overflow the line!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">CONTAINER OVERFLOWED</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-teal-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
