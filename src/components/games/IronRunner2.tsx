'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function IronRunner2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    playerY: 260,
    playerVY: 0,
    isGrounded: true,
    isSliding: false,
    slideTimer: 0,
    obstacles: [] as { x: number; y: number; w: number; h: number; type: 'low' | 'high' }[],
    batteries: [] as { x: number; y: number; collected: boolean }[],
    frameCount: 0,
  });

  const jump = () => {
    const state = stateRef.current;
    if (state.gameState === 'PLAYING' && state.isGrounded) {
      state.playerVY = -11;
      state.isGrounded = false;
    }
  };

  const slide = () => {
    const state = stateRef.current;
    if (state.gameState === 'PLAYING' && state.isGrounded) {
      state.isSliding = true;
      state.slideTimer = 25;
    }
  };

  const initGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      playerY: 260,
      playerVY: 0,
      isGrounded: true,
      isSliding: false,
      slideTimer: 0,
      obstacles: [],
      batteries: [],
      frameCount: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') {
        jump();
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        slide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const groundY = 280;

    const loop = () => {
      const state = stateRef.current;

      if (state.gameState === 'PLAYING') {
        state.frameCount++;
        state.score += 1; // distance score
        setScore(Math.floor(state.score / 5));

        // Player physics
        state.playerVY += 0.65;
        state.playerY += state.playerVY;

        if (state.playerY >= groundY - 24) {
          state.playerY = groundY - 24;
          state.playerVY = 0;
          state.isGrounded = true;
        }

        // Slide timer
        if (state.isSliding) {
          state.slideTimer--;
          if (state.slideTimer <= 0) {
            state.isSliding = false;
          }
        }

        // Spawn obstacles
        if (state.frameCount % 80 === 0) {
          const type = Math.random() > 0.5 ? 'low' : 'high';
          if (type === 'low') {
            state.obstacles.push({ x: canvas.width, y: groundY - 30, w: 25, h: 30, type: 'low' });
          } else {
            state.obstacles.push({ x: canvas.width, y: groundY - 75, w: 30, h: 35, type: 'high' });
          }

          // Spawn battery item above/below
          state.batteries.push({
            x: canvas.width + 10,
            y: type === 'low' ? groundY - 65 : groundY - 20,
            collected: false,
          });
        }

        // Move Obstacles & Batteries
        state.obstacles.forEach((obs) => {
          obs.x -= 4.5;
        });
        state.batteries.forEach((bat) => {
          bat.x -= 4.5;

          // Battery collision
          if (!bat.collected && Math.hypot(bat.x - 70, bat.y - state.playerY) < 25) {
            bat.collected = true;
            state.score += 100;
          }
        });

        // Filter offscreen
        state.obstacles = state.obstacles.filter((o) => o.x > -40);
        state.batteries = state.batteries.filter((b) => b.x > -40);

        // Player Collision box
        const px = 70;
        const py = state.isSliding ? state.playerY + 12 : state.playerY;
        const pw = 20;
        const ph = state.isSliding ? 14 : 24;

        state.obstacles.forEach((obs) => {
          if (
            px + pw > obs.x &&
            px - pw < obs.x + obs.w &&
            py + ph > obs.y &&
            py - ph < obs.y + obs.h
          ) {
            state.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            window.dispatchEvent(
              new CustomEvent('xakteir-game-score', { detail: { score: Math.floor(state.score / 5) } })
            );
          }
        });
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Rooftop Ground
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.fillStyle = '#e4e4e7';
      ctx.fillRect(0, groundY, canvas.width, 3);

      if (state.gameState === 'PLAYING') {
        // Draw Batteries
        ctx.fillStyle = '#eab308';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 10;
        state.batteries.forEach((bat) => {
          if (bat.collected) return;
          ctx.fillRect(bat.x - 5, bat.y - 5, 10, 10);
        });
        ctx.shadowBlur = 0;

        // Draw Obstacles
        state.obstacles.forEach((obs) => {
          ctx.fillStyle = obs.type === 'low' ? '#ef4444' : '#a855f7';
          ctx.shadowColor = obs.type === 'low' ? '#f87171' : '#c084fc';
          ctx.shadowBlur = 10;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.shadowBlur = 0;
        });

        // Draw Iron Runner Robot
        const px = 70;
        const py = state.playerY;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 12;

        if (state.isSliding) {
          ctx.fillRect(px - 15, py + 8, 30, 12);
        } else {
          ctx.fillRect(px - 10, py - 12, 20, 24);
          // Visor line
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 2, py - 8, 6, 4);
        }
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold tracking-wider text-slate-300 mb-2">IRON RUNNER 2</h2>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={340}
          className="bg-zinc-900 border border-slate-500/30 rounded-lg touch-none"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-xl font-bold text-slate-200 mb-2 font-mono">Cybernetic Rooftop Sprint</h3>
            <p className="text-zinc-400 text-sm mb-6">Jump over barriers and slide under high laser grids!</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-slate-200 hover:bg-white text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Start Sprint
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-2xl font-bold text-red-500 mb-2">SYSTEM COLLISION</h3>
            <p className="text-zinc-300 text-lg mb-1">Sprint Distance Score:</p>
            <p className="text-3xl font-extrabold text-slate-300 mb-6">{score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-slate-200 hover:bg-white text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Sprint Again
            </button>
          </div>
        )}
      </div>

      {/* Touch / Click Controls */}
      <div className="grid grid-cols-2 gap-3 w-[400px] mt-3">
        <button
          onClick={jump}
          disabled={gameState !== 'PLAYING'}
          className="py-3 bg-sky-950/60 border border-sky-500/40 hover:bg-sky-900/60 text-sky-300 font-bold text-xs rounded-lg transition-all disabled:opacity-50"
        >
          JUMP (UP / SPACE)
        </button>
        <button
          onClick={slide}
          disabled={gameState !== 'PLAYING'}
          className="py-3 bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/60 text-purple-300 font-bold text-xs rounded-lg transition-all disabled:opacity-50"
        >
          SLIDE (DOWN / S)
        </button>
      </div>

      <div className="flex justify-between w-[400px] mt-3 text-sm font-semibold text-zinc-400">
        <span>Score: <span className="text-slate-300">{score}</span></span>
        <span>Keyboard or Screen Buttons</span>
      </div>
    </div>
  );
}
