'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function MegaGlider2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    gliderY: 180,
    gliderVY: 0,
    rings: [] as { x: number; y: number; radius: number; passed: boolean }[],
    thermals: [] as { x: number; y: number; w: number; h: number }[],
    frameCount: 0,
  });

  const handlePointerDown = () => {
    if (stateRef.current.gameState === 'PLAYING') {
      stateRef.current.gliderVY = -4.5;
    }
  };

  const initGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      gliderY: 150,
      gliderVY: -2,
      rings: [],
      thermals: [],
      frameCount: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const state = stateRef.current;

      if (state.gameState === 'PLAYING') {
        state.frameCount++;

        // Glider physics: gravity & lift decay
        state.gliderVY += 0.22;
        state.gliderY += state.gliderVY;

        // Spawn Target Rings
        if (state.frameCount % 75 === 0) {
          state.rings.push({
            x: canvas.width + 20,
            y: 50 + Math.random() * 250,
            radius: 24,
            passed: false,
          });
        }

        // Move Rings
        state.rings.forEach((r) => {
          r.x -= 3;
          // Check glider passing through ring
          if (!r.passed && Math.abs(r.x - 70) < 15) {
            if (Math.abs(r.y - state.gliderY) < r.radius) {
              r.passed = true;
              state.gliderVY = -3.5; // boost lift!
              state.score += 100;
              setScore(state.score);
            }
          }
        });

        // Filter offscreen rings
        state.rings = state.rings.filter((r) => r.x > -40);

        // Ground / Ceiling crash
        if (state.gliderY >= canvas.height - 15 || state.gliderY <= 10) {
          state.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: state.score } })
          );
        }
      }

      // Render sky background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (state.gameState === 'PLAYING') {
        // Draw Rings
        state.rings.forEach((r) => {
          ctx.lineWidth = 4;
          ctx.strokeStyle = r.passed ? '#4ade80' : '#facc15';
          ctx.shadowColor = r.passed ? '#4ade80' : '#facc15';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // Draw Glider Wings
        const gx = 70;
        const gy = state.gliderY;
        const angle = Math.min(Math.max(state.gliderVY * 0.08, -0.6), 0.6);

        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(angle);

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 10;

        // Wing shape
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-14, -10);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-14, 10);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold tracking-wider text-sky-400 mb-2">MEGA GLIDER 2</h2>

      <div
        className="relative cursor-pointer select-none"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={380}
          className="bg-zinc-900 border border-sky-500/30 rounded-lg touch-none"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-xl font-bold text-sky-400 mb-2 font-mono">Aerial Ring Flight</h3>
            <p className="text-zinc-400 text-sm mb-6">Click or tap to pitch up and catch sky rings for altitude boosts!</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Take Off
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-2xl font-bold text-red-500 mb-2">FLIGHT TERMINATED</h3>
            <p className="text-zinc-300 text-lg mb-1">Flight Distance Score:</p>
            <p className="text-3xl font-extrabold text-sky-400 mb-6">{score}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Fly Again
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between w-[400px] mt-3 text-sm font-semibold text-zinc-400">
        <span>Score: <span className="text-sky-400">{score}</span></span>
        <span>Controls: Click / Tap to Lift</span>
      </div>
    </div>
  );
}
