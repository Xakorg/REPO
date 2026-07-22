'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Drop {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  level: number; // 1 to 5
}

const BUBBLE_SIZES = [12, 18, 25, 34, 45];
const BUBBLE_COLORS = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985'];

export default function AquaDrop2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    drops: [] as Drop[],
    nextId: 1,
    dropX: 200,
    canDrop: true,
    currentLevel: 1,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      drops: [],
      nextId: 1,
      dropX: 200,
      canDrop: true,
      currentLevel: Math.floor(Math.random() * 2) + 1,
    };
    setScore(0);
    setCurrentLevel(stateRef.current.currentLevel);
    setGameState('PLAYING');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    stateRef.current.dropX = Math.max(30, Math.min(370, x));
  };

  const handleCanvasClick = () => {
    const state = stateRef.current;
    if (state.gameState !== 'PLAYING' || !state.canDrop) return;

    state.drops.push({
      id: state.nextId++,
      x: state.dropX,
      y: 40,
      vx: 0,
      vy: 1,
      level: state.currentLevel,
    });

    state.currentLevel = Math.floor(Math.random() * 2) + 1;
    setCurrentLevel(state.currentLevel);

    state.canDrop = false;
    setTimeout(() => {
      state.canDrop = true;
    }, 400);
  };

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (state.gameState === 'PLAYING') {
        const gravity = 0.25;
        const friction = 0.98;

        // Update physics
        for (let i = 0; i < state.drops.length; i++) {
          const d = state.drops[i];
          d.vy += gravity;
          d.x += d.vx;
          d.y += d.vy;
          d.vx *= friction;
          d.vy *= friction;

          const r = BUBBLE_SIZES[d.level - 1];

          // Wall collision
          if (d.x - r < 10) {
            d.x = 10 + r;
            d.vx = -d.vx * 0.5;
          }
          if (d.x + r > 390) {
            d.x = 390 - r;
            d.vx = -d.vx * 0.5;
          }
          if (d.y + r > 470) {
            d.y = 470 - r;
            d.vy = -d.vy * 0.3;
          }
        }

        // Handle bubble collisions and merging
        for (let i = 0; i < state.drops.length; i++) {
          for (let j = i + 1; j < state.drops.length; j++) {
            const d1 = state.drops[i];
            const d2 = state.drops[j];
            const r1 = BUBBLE_SIZES[d1.level - 1];
            const r2 = BUBBLE_SIZES[d2.level - 1];

            const dx = d2.x - d1.x;
            const dy = d2.y - d1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = r1 + r2;

            if (dist < minDist && dist > 0) {
              // Same level -> MERGE!
              if (d1.level === d2.level && d1.level < 5) {
                const newLevel = d1.level + 1;
                state.drops.splice(j, 1);
                state.drops.splice(i, 1);

                state.drops.push({
                  id: state.nextId++,
                  x: (d1.x + d2.x) / 2,
                  y: (d1.y + d2.y) / 2,
                  vx: 0,
                  vy: -1,
                  level: newLevel,
                });

                state.score += newLevel * 40;
                setScore(state.score);
                break;
              } else {
                // Elastic collision resolve
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                d1.x -= nx * overlap * 0.5;
                d1.y -= ny * overlap * 0.5;
                d2.x += nx * overlap * 0.5;
                d2.y += ny * overlap * 0.5;
              }
            }
          }
        }

        // Check overflow gameover condition
        const overflow = state.drops.some((d) => d.y < 80 && Math.abs(d.vy) < 0.2);
        if (overflow && state.drops.length > 5) {
          state.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: state.score } }));
        }
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 480);

      // Container boundary
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 60, 380, 410);

      // Overflow line
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(10, 90);
      ctx.lineTo(390, 90);
      ctx.stroke();
      ctx.setLineDash([]);

      if (state.gameState === 'PLAYING') {
        // Aim drop line & ready bubble
        ctx.strokeStyle = '#0284c744';
        ctx.beginPath();
        ctx.moveTo(state.dropX, 40);
        ctx.lineTo(state.dropX, 470);
        ctx.stroke();

        const previewR = BUBBLE_SIZES[state.currentLevel - 1];
        ctx.beginPath();
        ctx.arc(state.dropX, 40, previewR, 0, Math.PI * 2);
        ctx.fillStyle = BUBBLE_COLORS[state.currentLevel - 1];
        ctx.fill();

        // Draw dropped bubbles
        state.drops.forEach((d) => {
          const r = BUBBLE_SIZES[d.level - 1];
          ctx.beginPath();
          ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
          ctx.fillStyle = BUBBLE_COLORS[d.level - 1];
          ctx.shadowBlur = 8;
          ctx.shadowColor = BUBBLE_COLORS[d.level - 1];
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = '#ffffffaa';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
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
          <h2 className="text-xl font-bold text-cyan-400">Aqua Drop 2</h2>
          <p className="text-xs text-zinc-400">Merge matching water drops</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-cyan-300">Score: {score}</div>
          <div className="text-xs text-zinc-400">Next Drop Lv: {currentLevel}</div>
        </div>
      </div>

      <div className="relative border border-cyan-900/50 rounded-xl overflow-hidden bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={400}
          height={480}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          className="cursor-crosshair block"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-cyan-400 mb-2">AQUA DROP 2</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Click to drop water bubbles. Connect 2 bubbles of the same size to merge them into a bigger drop!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-rose-500 mb-2">CONTAINER OVERFLOW</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-cyan-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
