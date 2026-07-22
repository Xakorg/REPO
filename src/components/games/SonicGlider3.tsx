'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Ring {
  x: number;
  y: number;
  r: number;
  passed: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function SonicGlider3() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    timeLeft: 45,
    gliderY: 240,
    gliderVy: 0,
    rings: [] as Ring[],
    obstacles: [] as Obstacle[],
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      timeLeft: 45,
      gliderY: 240,
      gliderVy: 0,
      rings: [],
      obstacles: [],
      spawnTimer: 0,
    };
    setScore(0);
    setTimeLeft(45);
    setGameState('PLAYING');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    stateRef.current.gliderY = Math.max(30, Math.min(450, y));
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      stateRef.current.timeLeft -= 1;
      setTimeLeft(stateRef.current.timeLeft);

      if (stateRef.current.timeLeft <= 0) {
        stateRef.current.gameState = 'GAMEOVER';
        setGameState('GAMEOVER');
        window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: stateRef.current.score } }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (state.gameState === 'PLAYING') {
        // Spawn rings and obstacles
        state.spawnTimer++;
        if (state.spawnTimer % 35 === 0) {
          if (Math.random() > 0.3) {
            state.rings.push({
              x: 420,
              y: Math.random() * 380 + 50,
              r: 22,
              passed: false,
            });
          } else {
            state.obstacles.push({
              x: 420,
              y: Math.random() * 380 + 50,
              w: 35,
              h: 35,
            });
          }
        }

        // Update rings
        for (let i = state.rings.length - 1; i >= 0; i--) {
          const r = state.rings[i];
          r.x -= 4.5;
          if (r.x < -30) {
            state.rings.splice(i, 1);
            continue;
          }

          // Check pass
          if (!r.passed && Math.hypot(r.x - 70, r.y - state.gliderY) < r.r + 10) {
            r.passed = true;
            state.score += 100;
            setScore(state.score);
          }
        }

        // Update obstacles
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= 4.5;
          if (obs.x < -40) {
            state.obstacles.splice(i, 1);
            continue;
          }

          // Hit obstacle
          if (
            Math.abs(obs.x - 70) < 25 &&
            Math.abs(obs.y - state.gliderY) < 25
          ) {
            state.score = Math.max(0, state.score - 50);
            setScore(state.score);
            state.obstacles.splice(i, 1);
          }
        }
      }

      // Render sky background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 480);
      gradient.addColorStop(0, '#0284c7');
      gradient.addColorStop(1, '#09090b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 480);

      // Clouds background
      ctx.fillStyle = '#ffffff15';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 120 + (state.gameState === 'PLAYING' ? state.spawnTimer * 2 : 0)) % 500) - 50;
        ctx.beginPath();
        ctx.arc(400 - cx, i * 90 + 30, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      if (state.gameState === 'PLAYING') {
        // Draw Rings
        state.rings.forEach((r) => {
          ctx.strokeStyle = r.passed ? '#22c55e' : '#facc15';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Draw Obstacles
        ctx.fillStyle = '#ef4444';
        state.obstacles.forEach((obs) => {
          ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
        });

        // Draw Sonic Glider
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(90, state.gliderY);
        ctx.lineTo(50, state.gliderY - 12);
        ctx.lineTo(60, state.gliderY);
        ctx.lineTo(50, state.gliderY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-[400px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-sky-400">Sonic Glider 3</h2>
          <p className="text-xs text-zinc-400">Slalom through sonic rings</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-sky-300">Score: {score}</div>
          <div className="text-xs text-amber-400">Time Left: {timeLeft}s</div>
        </div>
      </div>

      <div className="relative border border-sky-900/50 rounded-xl overflow-hidden bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={400}
          height={480}
          onMouseMove={handleMouseMove}
          className="cursor-pointer block"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">SONIC GLIDER 3</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Move mouse vertically to glide through golden sonic rings before time runs out! Avoid red hazard obstacles.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Start Flight
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">FLIGHT COMPLETE</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-sky-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Fly Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
