'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Obstacle {
  lane: number;
  z: number;
  type: 'meteor' | 'star';
  id: number;
}

export default function AstroDash() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    lane: 1, // 0: Left, 1: Center, 2: Right
    isJumping: false,
    jumpY: 0,
    speed: 6,
    obstacles: [] as Obstacle[],
    nextId: 1,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      lane: 1,
      isJumping: false,
      jumpY: 0,
      speed: 6,
      obstacles: [],
      nextId: 1,
      spawnTimer: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (st.gameState !== 'PLAYING') return;

      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && st.lane > 0) {
        st.lane -= 1;
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && st.lane < 2) {
        st.lane += 1;
      } else if ((e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') && !st.isJumping) {
        st.isJumping = true;
        st.jumpY = 80;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space grid background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const st = stateRef.current;

      if (st.gameState === 'PLAYING') {
        st.speed += 0.002;
        st.score += Math.floor(st.speed / 4);
        setScore(st.score);

        // Jump physics
        if (st.isJumping) {
          st.jumpY -= 4;
          if (st.jumpY <= 0) {
            st.jumpY = 0;
            st.isJumping = false;
          }
        }

        // Spawn obstacles
        st.spawnTimer++;
        if (st.spawnTimer > Math.max(20, 60 - Math.floor(st.speed * 3))) {
          st.spawnTimer = 0;
          const lane = Math.floor(Math.random() * 3);
          const type = Math.random() > 0.3 ? 'meteor' : 'star';
          st.obstacles.push({ lane, z: 500, type, id: st.nextId++ });
        }

        // Move obstacles
        for (let i = st.obstacles.length - 1; i >= 0; i--) {
          const obs = st.obstacles[i];
          obs.z -= st.speed * 4;

          // Collision check
          if (obs.z <= 40 && obs.z >= -20) {
            if (obs.lane === st.lane) {
              if (obs.type === 'meteor' && st.jumpY < 40) {
                st.gameState = 'GAMEOVER';
                setGameState('GAMEOVER');
                window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
              } else if (obs.type === 'star') {
                st.score += 250;
                setScore(st.score);
                st.obstacles.splice(i, 1);
                continue;
              }
            }
          }

          if (obs.z < -50) {
            st.obstacles.splice(i, 1);
          }
        }

        // Draw 3D Perspective Corridor
        const laneX = [120, 250, 380];
        const horizonY = 120;
        const bottomY = 480;

        // Draw Lanes
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        [60, 190, 310, 440].forEach((x) => {
          ctx.beginPath();
          ctx.moveTo(250 + (x - 250) * 0.2, horizonY);
          ctx.lineTo(x, bottomY);
          ctx.stroke();
        });

        // Draw Obstacles
        st.obstacles.sort((a, b) => b.z - a.z);
        st.obstacles.forEach((obs) => {
          const scale = 1 - obs.z / 500;
          if (scale <= 0) return;

          const cx = 250 + (laneX[obs.lane] - 250) * scale;
          const cy = horizonY + (bottomY - horizonY) * scale;
          const size = 35 * scale;

          if (obs.type === 'meteor') {
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#f87171';
            ctx.shadowBlur = 10 * scale;
            ctx.beginPath();
            ctx.arc(cx, cy - size / 2, Math.max(4, size / 2), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#fef08a';
            ctx.shadowBlur = 12 * scale;
            ctx.beginPath();
            ctx.arc(cx, cy - size / 2, Math.max(4, size / 2), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // Draw Player Astronaut
        const pX = laneX[st.lane];
        const pY = bottomY - 30 - st.jumpY;

        ctx.fillStyle = '#0284c7';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        // Body
        ctx.beginPath();
        ctx.roundRect(pX - 18, pY - 35, 36, 40, 8);
        ctx.fill();
        // Helmet Visor
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(pX, pY - 22, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-sky-400">Astro Dash</h2>
          <p className="text-xs text-zinc-400">Dash through cosmic lanes & jump meteors!</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-cyan-400">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-sky-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={500} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">ASTRO DASH</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Use Left/Right arrows or A/D to switch lanes. Press UP arrow or Space to jump over meteors! Collect yellow star power cores.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition shadow-lg shadow-sky-600/30"
            >
              Start Dash
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">COLLISION DETECTED</h3>
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
