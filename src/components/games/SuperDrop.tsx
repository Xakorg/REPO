'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  level: number; // 1 to 6
  radius: number;
  id: number;
}

const ORB_CONFIGS = [
  { level: 1, radius: 14, color: '#ef4444', name: 'Ruby', points: 10 },
  { level: 2, radius: 20, color: '#22c55e', name: 'Emerald', points: 20 },
  { level: 3, radius: 26, color: '#3b82f6', name: 'Sapphire', points: 40 },
  { level: 4, radius: 32, color: '#eab308', name: 'Topaz', points: 80 },
  { level: 5, radius: 40, color: '#a855f7', name: 'Amethyst', points: 160 },
  { level: 6, radius: 50, color: '#ec4899', name: 'Diamond', points: 320 },
];

export default function SuperDrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [nextOrbLevel, setNextOrbLevel] = useState<number>(1);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    orbs: [] as Orb[],
    nextOrbLevel: 1,
    dropX: 200,
    canDrop: true,
    nextId: 1,
  });

  const startGame = () => {
    const nextLvl = Math.floor(Math.random() * 3) + 1;
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      orbs: [],
      nextOrbLevel: nextLvl,
      dropX: 200,
      canDrop: true,
      nextId: 1,
    };
    setNextOrbLevel(nextLvl);
    setScore(0);
    setGameState('PLAYING');
  };

  const handleDrop = () => {
    const st = stateRef.current;
    if (st.gameState !== 'PLAYING' || !st.canDrop) return;

    const config = ORB_CONFIGS[st.nextOrbLevel - 1];
    st.orbs.push({
      x: st.dropX,
      y: 50,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 2,
      level: st.nextOrbLevel,
      radius: config.radius,
      id: st.nextId++,
    });

    st.canDrop = false;
    setTimeout(() => {
      st.canDrop = true;
    }, 400);

    const newNext = Math.floor(Math.random() * 3) + 1;
    st.nextOrbLevel = newNext;
    setNextOrbLevel(newNext);
  };

  useEffect(() => {
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      stateRef.current.dropX = Math.max(30, Math.min(canvas.width - 30, mouseX));
    };

    window.addEventListener('mousemove', handleMouseMove);

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Jar container
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 80, canvas.width - 20, canvas.height - 90);

      // Red limit line
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(10, 110);
      ctx.lineTo(canvas.width - 10, 110);
      ctx.stroke();
      ctx.setLineDash([]);

      const st = stateRef.current;

      if (st.gameState === 'PLAYING') {
        // Draw drop preview
        const cfg = ORB_CONFIGS[st.nextOrbLevel - 1];
        ctx.fillStyle = cfg.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(st.dropX, 40, cfg.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Physics & Collisions
        const gravity = 0.35;
        const friction = 0.98;

        for (let i = 0; i < st.orbs.length; i++) {
          const o1 = st.orbs[i];
          o1.vy += gravity;
          o1.vx *= friction;
          o1.vy *= friction;

          o1.x += o1.vx;
          o1.y += o1.vy;

          // Wall limits
          if (o1.x - o1.radius < 12) {
            o1.x = 12 + o1.radius;
            o1.vx = -o1.vx * 0.4;
          }
          if (o1.x + o1.radius > canvas.width - 12) {
            o1.x = canvas.width - 12 - o1.radius;
            o1.vx = -o1.vx * 0.4;
          }
          if (o1.y + o1.radius > canvas.height - 12) {
            o1.y = canvas.height - 12 - o1.radius;
            o1.vy = -o1.vy * 0.2;
          }

          // Check overflow game over condition
          if (o1.y - o1.radius < 100 && Math.abs(o1.vy) < 0.2) {
            st.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
          }

          // Orb to Orb collisions & merging
          for (let j = i + 1; j < st.orbs.length; j++) {
            const o2 = st.orbs[j];
            const dx = o2.x - o1.x;
            const dy = o2.y - o1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = o1.radius + o2.radius;

            if (dist < minDist) {
              // Merge if same level
              if (o1.level === o2.level && o1.level < 6) {
                const newLevel = o1.level + 1;
                const newConfig = ORB_CONFIGS[newLevel - 1];
                st.score += newConfig.points;
                setScore(st.score);

                st.orbs.splice(j, 1);
                st.orbs.splice(i, 1);

                st.orbs.push({
                  x: (o1.x + o2.x) / 2,
                  y: (o1.y + o2.y) / 2,
                  vx: (o1.vx + o2.vx) * 0.5,
                  vy: (o1.vy + o2.vy) * 0.5,
                  level: newLevel,
                  radius: newConfig.radius,
                  id: st.nextId++,
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

        // Draw Orbs
        st.orbs.forEach((orb) => {
          const config = ORB_CONFIGS[orb.level - 1];
          ctx.fillStyle = config.color;
          ctx.shadowColor = config.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Shiny highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(orb.x - orb.radius * 0.3, orb.y - orb.radius * 0.3, orb.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
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
      <div className="flex justify-between items-center w-full max-w-[420px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-emerald-400">Super Drop</h2>
          <p className="text-xs text-zinc-400">Drop and merge glowing energy orbs!</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-emerald-300">Score: {score}</div>
          <div className="text-xs text-zinc-400">Next: Level {nextOrbLevel}</div>
        </div>
      </div>

      <div
        onClick={handleDrop}
        className="relative border border-emerald-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950 cursor-pointer"
      >
        <canvas ref={canvasRef} width={420} height={500} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-emerald-400 mb-2">SUPER DROP</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Move your mouse to align the orb drop, click to release! Merge matching color orbs to form larger crystals and score big!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-lg shadow-emerald-600/30"
            >
              Start Dropping
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">JAR OVERFLOW</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-emerald-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
