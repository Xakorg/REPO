'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Barrier {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

interface Orb {
  x: number;
  y: number;
  r: number;
}

export default function VoidDash2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    playerX: 175,
    playerW: 50,
    playerH: 30,
    barriers: [] as Barrier[],
    orbs: [] as Orb[],
    speed: 5,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      playerX: 175,
      playerW: 50,
      playerH: 30,
      barriers: [],
      orbs: [],
      speed: 5,
      spawnTimer: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        stateRef.current.playerX = Math.max(20, stateRef.current.playerX - 60);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        stateRef.current.playerX = Math.min(330, stateRef.current.playerX + 60);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (state.gameState === 'PLAYING') {
        state.score += 1;
        setScore(Math.floor(state.score / 5));
        state.speed = 5 + Math.floor(state.score / 200) * 0.5;

        // Spawn obstacles
        state.spawnTimer++;
        if (state.spawnTimer % 35 === 0) {
          const lanes = [40, 175, 310];
          const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
          if (Math.random() > 0.3) {
            state.barriers.push({
              x: chosenLane - 25,
              y: -40,
              w: 70,
              h: 20,
              speed: state.speed,
            });
          } else {
            state.orbs.push({
              x: chosenLane + 10,
              y: -30,
              r: 12,
            });
          }
        }

        // Update barriers
        for (let i = state.barriers.length - 1; i >= 0; i--) {
          const b = state.barriers[i];
          b.y += b.speed;
          if (b.y > 500) {
            state.barriers.splice(i, 1);
            continue;
          }

          // Check collision
          const pY = 420;
          if (
            state.playerX < b.x + b.w &&
            state.playerX + state.playerW > b.x &&
            pY < b.y + b.h &&
            pY + state.playerH > b.y
          ) {
            state.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            const finalScore = Math.floor(state.score / 5);
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
          }
        }

        // Update orbs
        for (let i = state.orbs.length - 1; i >= 0; i--) {
          const orb = state.orbs[i];
          orb.y += state.speed;
          if (orb.y > 500) {
            state.orbs.splice(i, 1);
            continue;
          }

          // Check orb pickup
          const pY = 420;
          if (
            state.playerX < orb.x + orb.r * 2 &&
            state.playerX + state.playerW > orb.x - orb.r &&
            pY < orb.y + orb.r * 2 &&
            pY + state.playerH > orb.y - orb.r
          ) {
            state.score += 250;
            state.orbs.splice(i, 1);
          }
        }
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 500);

      // Starfield effect
      ctx.fillStyle = '#a1a1aa';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 37) % 400;
        const sy = (i * 73 + (state.gameState === 'PLAYING' ? state.score * 3 : 0)) % 500;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Lanes
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.beginPath();
      ctx.moveTo(133, 0);
      ctx.lineTo(133, 500);
      ctx.moveTo(266, 0);
      ctx.lineTo(266, 500);
      ctx.stroke();
      ctx.setLineDash([]);

      if (state.gameState === 'PLAYING') {
        // Player Ship
        ctx.fillStyle = '#a855f7';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#c084fc';
        ctx.beginPath();
        ctx.moveTo(state.playerX + state.playerW / 2, 420);
        ctx.lineTo(state.playerX + state.playerW, 450);
        ctx.lineTo(state.playerX, 450);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Barriers
        ctx.fillStyle = '#ef4444';
        state.barriers.forEach((b) => {
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = '#fca5a5';
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        });

        // Orbs
        state.orbs.forEach((o) => {
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#38bdf8';
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const moveLane = (dir: 'left' | 'right') => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    if (dir === 'left') {
      stateRef.current.playerX = Math.max(20, stateRef.current.playerX - 60);
    } else {
      stateRef.current.playerX = Math.min(330, stateRef.current.playerX + 60);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-[400px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Void Dash 2</h2>
          <p className="text-xs text-zinc-400">Dodge void rifts & absorb energy</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-purple-300">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-purple-900/50 rounded-xl overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={400} height={500} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-purple-400 mb-2">VOID DASH 2</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Use Left/Right arrow keys or buttons to shift lanes. Avoid red barriers and collect blue energy!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-rose-500 mb-2">CRASHED IN VOID</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-purple-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {gameState === 'PLAYING' && (
        <div className="flex gap-4 mt-4 w-[400px]">
          <button
            onClick={() => moveLane('left')}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-purple-600 font-bold rounded-lg transition"
          >
            ← LEFT
          </button>
          <button
            onClick={() => moveLane('right')}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-purple-600 font-bold rounded-lg transition"
          >
            RIGHT →
          </button>
        </div>
      )}
    </div>
  );
}
