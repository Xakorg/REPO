'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Obstacle {
  lane: number;
  y: number;
  type: 'spike' | 'orb';
  id: number;
}

export default function NeonRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    lane: 1, // 0: Left, 1: Center, 2: Right
    isJumping: false,
    jumpY: 0,
    speed: 5,
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
      speed: 5,
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
        st.jumpY = 60;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const st = stateRef.current;

      // Clear & Background
      ctx.fillStyle = '#05050d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      if (st.gameState === 'PLAYING') {
        st.speed += 0.002;
        st.score += 1;
        setScore(st.score);

        // Jump animation
        if (st.isJumping) {
          st.jumpY -= 3;
          if (st.jumpY <= 0) {
            st.jumpY = 0;
            st.isJumping = false;
          }
        }

        // Spawn items
        st.spawnTimer++;
        if (st.spawnTimer > Math.max(25, 60 - Math.floor(st.speed * 2))) {
          st.spawnTimer = 0;
          const lane = Math.floor(Math.random() * 3);
          const type = Math.random() > 0.35 ? 'spike' : 'orb';
          st.obstacles.push({ lane, y: -40, type, id: st.nextId++ });
        }

        // Lanes position X
        const laneX = [100, 250, 400];
        const playerY = 400 - st.jumpY;

        // Move obstacles
        for (let i = st.obstacles.length - 1; i >= 0; i--) {
          const obs = st.obstacles[i];
          obs.y += st.speed;

          // Check hit
          if (obs.y >= 370 && obs.y <= 430 && obs.lane === st.lane) {
            if (obs.type === 'spike' && st.jumpY < 30) {
              st.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
            } else if (obs.type === 'orb') {
              st.score += 150;
              setScore(st.score);
              st.obstacles.splice(i, 1);
              continue;
            }
          }

          if (obs.y > canvas.height + 50) {
            st.obstacles.splice(i, 1);
          }
        }

        // Draw Lanes divider
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        [175, 325].forEach((x) => {
          ctx.beginPath();
          ctx.setLineDash([10, 10]);
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // Draw Obstacles
        st.obstacles.forEach((obs) => {
          const ox = laneX[obs.lane];
          if (obs.type === 'spike') {
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#f87171';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(ox, obs.y - 15);
            ctx.lineTo(ox - 18, obs.y + 15);
            ctx.lineTo(ox + 18, obs.y + 15);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#67e8f9';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(ox, obs.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // Draw Player
        const px = laneX[st.lane];
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(px - 20, playerY - 20, 40, 40, 8);
        ctx.fill();
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, playerY, 8, 0, Math.PI * 2);
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
          <h2 className="text-xl font-bold text-pink-500">Neon Runner</h2>
          <p className="text-xs text-zinc-400">Dodge pink spikes & grab blue energy orbs!</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-pink-400">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-pink-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={500} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-pink-500 mb-2">NEON RUNNER</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Use Left/Right arrows or A/D to change lanes. Press UP arrow or Space to jump over obstacles!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition shadow-lg shadow-pink-600/30"
            >
              Start Run
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">SYSTEM CRASH</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-pink-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
