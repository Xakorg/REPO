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

const PLANETS = [
  { level: 1, radius: 14, color: '#9ca3af', pts: 10, icon: '🌑' },
  { level: 2, radius: 20, color: '#38bdf8', pts: 25, icon: '🌙' },
  { level: 3, radius: 28, color: '#ef4444', pts: 60, icon: '🔴' },
  { level: 4, radius: 36, color: '#3b82f6', pts: 140, icon: '🌍' },
  { level: 5, radius: 46, color: '#f59e0b', pts: 350, icon: '🪐' },
  { level: 6, radius: 58, color: '#e11d48', pts: 800, icon: '☀️' },
];

export default function CosmicDrop2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [nextLevel, setNextLevel] = useState(1);

  const stateRef = useRef({
    orbs: [] as Orb[],
    dropperX: 180,
    currentLevel: 1,
    score: 0,
    started: false,
    gameOver: false,
    nextId: 1,
    canDrop: true,
  });

  const initGame = () => {
    stateRef.current = {
      orbs: [],
      dropperX: 180,
      currentLevel: Math.floor(Math.random() * 2) + 1,
      score: 0,
      started: true,
      gameOver: false,
      nextId: 1,
      canDrop: true,
    };
    setScore(0);
    setNextLevel(stateRef.current.currentLevel);
    setGameOver(false);
    setGameStarted(true);
  };

  const dropOrb = () => {
    const s = stateRef.current;
    if (!s.started || s.gameOver || !s.canDrop) return;

    const p = PLANETS[s.currentLevel - 1];
    s.orbs.push({
      id: s.nextId++,
      level: s.currentLevel,
      x: s.dropperX,
      y: 40,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 1.5,
      radius: p.radius,
      color: p.color,
    });

    s.canDrop = false;
    setTimeout(() => {
      s.canDrop = true;
    }, 400);

    s.currentLevel = Math.floor(Math.random() * 3) + 1;
    setNextLevel(s.currentLevel);
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
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.lineTo(canvas.width, 70);
      ctx.stroke();
      ctx.setLineDash([]);

      if (s.started && !s.gameOver) {
        // Physics update
        const gravity = 0.35;
        const friction = 0.97;

        for (let i = 0; i < s.orbs.length; i++) {
          const o1 = s.orbs[i];
          o1.vy += gravity;
          o1.x += o1.vx;
          o1.y += o1.vy;

          // Wall bounces
          if (o1.x - o1.radius < 0) {
            o1.x = o1.radius;
            o1.vx *= -0.6;
          }
          if (o1.x + o1.radius > canvas.width) {
            o1.x = canvas.width - o1.radius;
            o1.vx *= -0.6;
          }
          if (o1.y + o1.radius > canvas.height) {
            o1.y = canvas.height - o1.radius;
            o1.vy *= -0.3;
            o1.vx *= friction;
          }

          // Orb to orb collisions & merges
          for (let j = i + 1; j < s.orbs.length; j++) {
            const o2 = s.orbs[j];
            const dx = o2.x - o1.x;
            const dy = o2.y - o1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = o1.radius + o2.radius;

            if (dist < minDist) {
              // Merge if same level
              if (o1.level === o2.level && o1.level < PLANETS.length) {
                const nextLvl = o1.level + 1;
                const p = PLANETS[nextLvl - 1];

                // Remove both and add merged
                s.orbs.splice(j, 1);
                s.orbs.splice(i, 1);

                s.orbs.push({
                  id: s.nextId++,
                  level: nextLvl,
                  x: (o1.x + o2.x) / 2,
                  y: (o1.y + o2.y) / 2,
                  vx: (o1.vx + o2.vx) * 0.5,
                  vy: (o1.vy + o2.vy) * 0.5,
                  radius: p.radius,
                  color: p.color,
                });

                s.score += p.pts;
                setScore(s.score);
                i--;
                break;
              } else {
                // Elastic bump separation
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                o1.x -= nx * overlap * 0.5;
                o1.y -= ny * overlap * 0.5;
                o2.x += nx * overlap * 0.5;
                o2.y += ny * overlap * 0.5;

                const k = o1.vx * nx + o1.vy * ny - (o2.vx * nx + o2.vy * ny);
                o1.vx -= k * nx * 0.5;
                o1.vy -= k * ny * 0.5;
                o2.vx += k * nx * 0.5;
                o2.vy += k * ny * 0.5;
              }
            }
          }

          // Check overflow game over condition
          if (o1.y - o1.radius < 70 && Math.abs(o1.vy) < 0.5 && o1.y > 60) {
            s.gameOver = true;
            setGameOver(true);
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: s.score } }));
          }
        }
      }

      // Draw dropper preview line & current planet
      if (s.started && !s.gameOver) {
        ctx.strokeStyle = '#f59e0b55';
        ctx.beginPath();
        ctx.moveTo(s.dropperX, 0);
        ctx.lineTo(s.dropperX, canvas.height);
        ctx.stroke();

        const p = PLANETS[s.currentLevel - 1];
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(s.dropperX, 40, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw celestial orbs
      s.orbs.forEach((o) => {
        ctx.fillStyle = o.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = o.color;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
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
      <div className="w-full max-w-[360px] flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-amber-400">COSMIC DROP 2</h2>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-zinc-300">
            Next: {PLANETS[nextLevel - 1]?.icon}
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
        <canvas ref={canvasRef} width={360} height={420} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-amber-400">{gameOver ? 'COSMIC OVERFLOW' : 'COSMIC DROP 2'}</h3>
            {gameOver && <p className="text-zinc-300 mb-4 font-semibold">Total Score: {score}</p>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Merging'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Move cursor to aim, click to drop & merge planets into supernovas!</p>
    </div>
  );
}
