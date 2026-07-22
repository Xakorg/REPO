'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Obstacle {
  x: number;
  y: number;
  type: 'shark' | 'star';
  radius: number;
}

export default function MegaSurfer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  const surferYRef = useRef(200);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const obstaclesRef = useRef<Obstacle[]>([]);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const gameOverHandled = useRef(false);

  const handleGameOver = (finalScore: number) => {
    if (gameOverHandled.current) return;
    gameOverHandled.current = true;
    setGameState('gameover');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  const moveUp = () => {
    surferYRef.current = Math.max(40, surferYRef.current - 35);
  };

  const moveDown = () => {
    surferYRef.current = Math.min(360, surferYRef.current + 35);
  };

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    surferYRef.current = 200;
    obstaclesRef.current = [];
    gameOverHandled.current = false;
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
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
    let waveTime = 0;

    const spawnObstacle = () => {
      if (gameStateRef.current !== 'playing') return;

      const type = Math.random() < 0.6 ? 'star' : 'shark';
      obstaclesRef.current.push({
        x: 630,
        y: 50 + Math.random() * 300,
        type,
        radius: type === 'star' ? 14 : 20,
      });

      spawnTimer = setTimeout(spawnObstacle, Math.max(500, 1200 - scoreRef.current * 10));
    };

    spawnObstacle();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (!ctx || gameStateRef.current !== 'playing') return;

      waveTime += 0.05;

      // Handle key inputs
      if (keysRef.current['w'] || keysRef.current['arrowup']) {
        surferYRef.current = Math.max(30, surferYRef.current - 4);
      }
      if (keysRef.current['s'] || keysRef.current['arrowdown']) {
        surferYRef.current = Math.min(370, surferYRef.current + 4);
      }

      // Draw ocean wave background
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated wave lines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
          const y = 80 * i + Math.sin(x * 0.02 + waveTime + i) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Update & draw obstacles
      const speed = 4 + Math.min(scoreRef.current / 50, 4);
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= speed;

        if (obs.type === 'star') {
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#facc15';
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Shark fin
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.moveTo(obs.x - 15, obs.y + 15);
          ctx.lineTo(obs.x, obs.y - 15);
          ctx.lineTo(obs.x + 15, obs.y + 15);
          ctx.closePath();
          ctx.fill();
        }

        // Collision check with Surfer
        const surferX = 100;
        const dist = Math.hypot(obs.x - surferX, obs.y - surferYRef.current);

        if (dist < obs.radius + 18) {
          if (obs.type === 'star') {
            obstaclesRef.current.splice(i, 1);
            const newScore = scoreRef.current + 25;
            setScore(newScore);
            scoreRef.current = newScore;
          } else {
            handleGameOver(scoreRef.current);
            return;
          }
        } else if (obs.x < -30) {
          obstaclesRef.current.splice(i, 1);
          if (obs.type === 'shark') {
            const newScore = scoreRef.current + 10;
            setScore(newScore);
            scoreRef.current = newScore;
          }
        }
      }

      // Draw Surfer & Surfboard
      const sx = 100;
      const sy = surferYRef.current;

      // Surfboard
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.1);

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(0, 10, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Surfer character
      ctx.fillStyle = '#fde047'; // Hair / body
      ctx.fillRect(-6, -18, 12, 22);

      ctx.restore();

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(spawnTimer);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-sky-400 mb-2 tracking-wider">MEGA SURFER</h1>

      {gameState === 'playing' && (
        <div className="text-xl font-bold text-sky-400 mb-2">Score: {score}</div>
      )}

      <div className="relative border-2 border-sky-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={600} height={400} className="max-w-full" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-6 max-w-md">
              Ride the mega waves! Use W/S or UP/DOWN arrows to steer your surfboard. Catch glowing yellow star rings and dodge shark fins!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              SURF NOW
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">WIPEOUT!</h2>
            <p className="text-2xl text-sky-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              RIDE AGAIN
            </button>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={moveUp}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 font-black rounded-lg border border-sky-500/40 text-sky-300 text-lg transition active:scale-95"
          >
            ▲ WAVE UP
          </button>
          <button
            onClick={moveDown}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 font-black rounded-lg border border-sky-500/40 text-sky-300 text-lg transition active:scale-95"
          >
            ▼ WAVE DOWN
          </button>
        </div>
      )}
    </div>
  );
}
