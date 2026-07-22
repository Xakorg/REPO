'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Orb {
  id: number;
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

const ORB_CONFIGS = [
  { level: 1, radius: 14, color: '#9ca3af', pts: 10, label: '🌑' },
  { level: 2, radius: 20, color: '#ef4444', pts: 25, label: '🔴' },
  { level: 3, radius: 28, color: '#3b82f6', pts: 60, label: '🌍' },
  { level: 4, radius: 36, color: '#eab308', pts: 150, label: '🪐' },
  { level: 5, radius: 46, color: '#f97316', pts: 400, label: '☀️' },
];

export default function CosmicDrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [nextOrbLevel, setNextOrbLevel] = useState(1);

  const stateRef = useRef({
    orbs: [] as Orb[],
    dropperX: 200,
    currentLevel: 1,
    score: 0,
    started: false,
    gameOver: false,
    nextId: 1,
  });

  const initGame = () => {
    stateRef.current = {
      orbs: [],
      dropperX: 200,
      currentLevel: Math.floor(Math.random() * 2) + 1,
      score: 0,
      started: true,
      gameOver: false,
      nextId: 1,
    };
    setScore(0);
    setNextOrbLevel(stateRef.current.currentLevel);
    setGameOver(false);
    setGameStarted(true);
  };

  const dropOrb = () => {
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;

    const cfg = ORB_CONFIGS[s.currentLevel - 1];
    s.orbs.push({
      id: s.nextId++,
      level: s.currentLevel,
      x: s.dropperX,
      y: 40,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 2,
      radius: cfg.radius,
      color: cfg.color,
    });

    s.currentLevel = Math.floor(Math.random() * 2) + 1;
    setNextOrbLevel(s.currentLevel);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const rx = e.clientX - rect.left;
      stateRef.current.dropperX = Math.max(30, Math.min(canvas.width - 30, rx));
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw danger limit line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 60);
      ctx.lineTo(canvas.width, 60);
      ctx.stroke();
      ctx.setLineDash([]);

      if (s.started && !s.gameOver) {
        // Update physics & gravity
        const gravity = 0.3;
        const friction = 0.96;

        s.orbs.forEach((orb) => {
          orb.vy += gravity;
          orb.x += orb.vx;
          orb.y += orb.vy;

          // Wall collision
          if (orb.x - orb.radius < 0) {
            orb.x = orb.radius;
            orb.vx = -orb.vx * 0.5;
          }
          if (orb.x + orb.radius > canvas.width) {
            orb.x = canvas.width - orb.radius;
            orb.vx = -orb.vx * 0.5;
          }
          // Floor collision
          if (orb.y + orb.radius > canvas.height) {
            orb.y = canvas.height - orb.radius;
            orb.vy = -orb.vy * 0.2;
            orb.vx *= friction;
          }
        });

        // Circle - Circle collisions & merging
        for (let i = 0; i < s.orbs.length; i++) {
          for (let j = i + 1; j < s.orbs.length; j++) {
            const o1 = s.orbs[i];
            const o2 = s.orbs[j];
            if (!o1 || !o2) continue;

            const dx = o2.x - o1.x;
            const dy = o2.y - o1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = o1.radius + o2.radius;

            if (dist < minDist) {
              // Check merge
              if (o1.level === o2.level && o1.level < 5) {
                // Merge!
                const newLevel = o1.level + 1;
                const cfg = ORB_CONFIGS[newLevel - 1];
                s.score += cfg.pts;
                setScore(s.score);

                // Create merged orb at midpoint
                const mx = (o1.x + o2.x) / 2;
                const my = (o1.y + o2.y) / 2;

                s.orbs.splice(j, 1);
                s.orbs.splice(i, 1);

                s.orbs.push({
                  id: s.nextId++,
                  level: newLevel,
                  x: mx,
                  y: my,
                  vx: 0,
                  vy: -1,
                  radius: cfg.radius,
                  color: cfg.color,
                });
                break;
              } else {
                // Separate
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                o1.x -= nx * overlap * 0.5;
                o1.y -= ny * overlap * 0.5;
                o2.x += nx * overlap * 0.5;
                o2.y += ny * overlap * 0.5;
              }
            }
          }
        }

        // Check overflow Game Over
        const overflowing = s.orbs.some((orb) => orb.y - orb.radius < 60 && Math.abs(orb.vy) < 0.5);
        if (overflowing) {
          s.gameOver = true;
          setGameOver(true);
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: s.score } })
          );
        }
      }

      // Draw dropper indicator
      if (s.started && !s.gameOver) {
        ctx.strokeStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(s.dropperX, 0);
        ctx.lineTo(s.dropperX, 40);
        ctx.stroke();

        const cfg = ORB_CONFIGS[s.currentLevel - 1];
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.arc(s.dropperX, 40, cfg.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Orbs
      s.orbs.forEach((orb) => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = orb.color;
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[380px] flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-amber-400">COSMIC DROP</h2>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-zinc-300">
            Next: {ORB_CONFIGS[nextOrbLevel - 1]?.label}
          </span>
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-amber-400">
            Score: {score}
          </span>
        </div>
      </div>

      <div
        onClick={dropOrb}
        className="relative border-2 border-amber-500/40 rounded-lg overflow-hidden shadow-lg shadow-amber-500/10 cursor-pointer"
      >
        <canvas ref={canvasRef} width={360} height={400} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-amber-400">{gameOver ? 'COSMIC OVERFLOW' : 'COSMIC DROP'}</h3>
            {gameOver && <p className="text-zinc-300 mb-4">Total Score: {score}</p>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Dropping'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Move mouse to position dropper, click to drop and merge matching planets!</p>
    </div>
  );
}
