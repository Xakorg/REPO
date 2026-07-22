'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Ring {
  id: number;
  x: number;
  y: number;
  radius: number;
  passed: boolean;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  height: number;
}

export default function ShadowGlider() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [altitude, setAltitude] = useState<number>(500);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    gliderY: 250,
    gliderVy: 0,
    rings: [] as Ring[],
    obstacles: [] as Obstacle[],
    spawnTimer: 0,
    speed: 4,
    nextId: 1,
    keys: { up: false, down: false },
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      gliderY: 250,
      gliderVy: 0,
      rings: [],
      obstacles: [],
      spawnTimer: 0,
      speed: 4,
      nextId: 1,
      keys: { up: false, down: false },
    };
    setScore(0);
    setAltitude(500);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const st = stateRef.current;
      if (st.gameState === 'PLAYING') {
        const mouseY = e.clientY - rect.top;
        st.gliderVy = (mouseY - st.gliderY) * 0.08;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const st = stateRef.current;

      // Dark shadow sky background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (st.gameState === 'PLAYING') {
        st.speed += 0.001;
        st.score += 1;
        setScore(st.score);

        // Control input
        if (st.keys.up) st.gliderVy -= 0.5;
        if (st.keys.down) st.gliderVy += 0.5;

        // Apply physics
        st.gliderVy *= 0.92;
        st.gliderY += st.gliderVy;

        const gliderX = 100;
        setAltitude(Math.floor(500 - st.gliderY));

        // Boundary crash
        if (st.gliderY < 20 || st.gliderY > canvas.height - 20) {
          st.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
        }

        // Spawn items
        st.spawnTimer++;
        if (st.spawnTimer > Math.max(30, 70 - Math.floor(st.speed * 3))) {
          st.spawnTimer = 0;
          const isRing = Math.random() > 0.4;
          const ry = 80 + Math.random() * (canvas.height - 160);

          if (isRing) {
            st.rings.push({
              id: st.nextId++,
              x: canvas.width + 30,
              y: ry,
              radius: 28,
              passed: false,
            });
          } else {
            st.obstacles.push({
              id: st.nextId++,
              x: canvas.width + 30,
              y: ry,
              height: 120,
            });
          }
        }

        // Move & Check Rings
        for (let i = st.rings.length - 1; i >= 0; i--) {
          const ring = st.rings[i];
          ring.x -= st.speed;

          if (!ring.passed && Math.abs(ring.x - gliderX) < 15) {
            if (Math.abs(ring.y - st.gliderY) < ring.radius) {
              ring.passed = true;
              st.score += 200;
              setScore(st.score);
            }
          }

          if (ring.x < -40) st.rings.splice(i, 1);
        }

        // Move & Check Obstacles
        for (let i = st.obstacles.length - 1; i >= 0; i--) {
          const obs = st.obstacles[i];
          obs.x -= st.speed;

          if (Math.abs(obs.x - gliderX) < 18 && Math.abs(obs.y - st.gliderY) < obs.height / 2) {
            st.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
          }

          if (obs.x < -40) st.obstacles.splice(i, 1);
        }

        // Draw Rings
        st.rings.forEach((ring) => {
          ctx.strokeStyle = ring.passed ? '#22c55e' : '#38bdf8';
          ctx.shadowColor = ring.passed ? '#4ade80' : '#0284c7';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // Draw Obstacles (Pillars)
        st.obstacles.forEach((obs) => {
          ctx.fillStyle = '#64748b';
          ctx.shadowColor = '#94a3b8';
          ctx.shadowBlur = 10;
          ctx.fillRect(obs.x - 12, obs.y - obs.height / 2, 24, obs.height);
          ctx.shadowBlur = 0;
        });

        // Draw Shadow Glider
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(gliderX + 25, st.gliderY);
        ctx.lineTo(gliderX - 15, st.gliderY - 14);
        ctx.lineTo(gliderX - 5, st.gliderY);
        ctx.lineTo(gliderX - 15, st.gliderY + 14);
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
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-sky-400">Shadow Glider</h2>
          <p className="text-xs text-zinc-400">Soar through neon shadow rings & avoid obsidian pillars!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-cyan-400">Altitude: {altitude}m</div>
          <div className="text-lg font-semibold text-sky-400">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-sky-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={450} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">SHADOW GLIDER</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Use your mouse or Up/Down arrow keys to steer your glider height. Pass through cyan rings for bonus score!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition shadow-lg shadow-sky-600/30"
            >
              Take Flight
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">GLIDER CRASH</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-sky-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
