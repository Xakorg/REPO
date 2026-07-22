'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function AstroDash2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    playerY: 180,
    playerVY: 0,
    gravity: 0.45,
    jumpPower: -7.5,
    obstacles: [] as { x: number; y: number; w: number; h: number; passed: boolean }[],
    stars: [] as { x: number; y: number; collected: boolean }[],
    frameCount: 0,
  });

  const jump = () => {
    if (stateRef.current.gameState === 'PLAYING') {
      stateRef.current.playerVY = stateRef.current.jumpPower;
    }
  };

  const initGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      playerY: 180,
      playerVY: -3,
      gravity: 0.45,
      jumpPower: -7.5,
      obstacles: [],
      stars: [],
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

        // Update physics
        state.playerVY += state.gravity;
        state.playerY += state.playerVY;

        // Spawn obstacles
        if (state.frameCount % 90 === 0) {
          const gapY = 60 + Math.random() * 200;
          const gapHeight = 110;
          state.obstacles.push({ x: canvas.width, y: 0, w: 35, h: gapY, passed: false });
          state.obstacles.push({
            x: canvas.width,
            y: gapY + gapHeight,
            w: 35,
            h: canvas.height - (gapY + gapHeight),
            passed: false,
          });

          // Star crystal in center of gap
          state.stars.push({
            x: canvas.width + 17,
            y: gapY + gapHeight / 2,
            collected: false,
          });
        }

        // Move obstacles
        state.obstacles.forEach((obs) => {
          obs.x -= 3;
          if (!obs.passed && obs.x < 50) {
            obs.passed = true;
            state.score += 10;
            setScore(state.score);
          }
        });

        // Move stars
        state.stars.forEach((star) => {
          star.x -= 3;
          // Collision with player
          if (
            !star.collected &&
            Math.hypot(star.x - 60, star.y - state.playerY) < 22
          ) {
            star.collected = true;
            state.score += 50;
            setScore(state.score);
          }
        });

        // Filter offscreen
        state.obstacles = state.obstacles.filter((obs) => obs.x > -50);
        state.stars = state.stars.filter((s) => s.x > -50);

        // Collision detection
        const px = 60;
        const py = state.playerY;
        const pr = 12;

        let hit = false;
        if (py - pr < 0 || py + pr > canvas.height) {
          hit = true;
        }

        state.obstacles.forEach((obs) => {
          if (
            px + pr > obs.x &&
            px - pr < obs.x + obs.w &&
            py + pr > obs.y &&
            py - pr < obs.y + obs.h
          ) {
            hit = true;
          }
        });

        if (hit) {
          state.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: state.score } })
          );
        }
      }

      // Draw background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars in bg
      ctx.fillStyle = '#3f3f46';
      for (let i = 0; i < 20; i++) {
        const sx = (i * 37 + state.frameCount) % canvas.width;
        const sy = (i * 73) % canvas.height;
        ctx.fillRect(canvas.width - sx, sy, 2, 2);
      }

      if (state.gameState === 'PLAYING') {
        // Obstacles
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        state.obstacles.forEach((obs) => {
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        });
        ctx.shadowBlur = 0;

        // Crystals
        state.stars.forEach((star) => {
          if (star.collected) return;
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(star.x, star.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Player (Astronaut)
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(60, state.playerY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Visor
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(65, state.playerY - 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h2 className="text-2xl font-bold tracking-wider text-cyan-400 mb-2">ASTRO DASH 2</h2>
      <div className="relative cursor-pointer select-none" onClick={jump}>
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="bg-zinc-900 border border-cyan-500/30 rounded-lg touch-none"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center rounded-lg">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">Hyperspace Obstacle Course</h3>
            <p className="text-zinc-400 text-sm mb-6">Tap or Click to jetpack thrust and dodge space gates.</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Start Flight
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg">
            <h3 className="text-2xl font-bold text-rose-500 mb-2">CRASH LANDING</h3>
            <p className="text-zinc-300 text-lg mb-1">Flight Score:</p>
            <p className="text-3xl font-extrabold text-cyan-400 mb-6">{score}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Relaunch
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between w-[400px] mt-3 text-sm font-semibold text-zinc-400">
        <span>Score: <span className="text-cyan-400">{score}</span></span>
        <span>Controls: Click / Tap to Thrust</span>
      </div>
    </div>
  );
}
