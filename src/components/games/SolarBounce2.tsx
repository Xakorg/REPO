'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SolarBounce2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    paddleX: 160,
    paddleWidth: 80,
    ballX: 200,
    ballY: 250,
    ballVX: 3,
    ballVY: -4,
    blocks: [] as { x: number; y: number; w: number; h: number; active: boolean; color: string }[],
  });

  const initGame = () => {
    const blocks = [];
    const rows = 4;
    const cols = 6;
    const w = 55;
    const h = 18;
    const colors = ['#f97316', '#eab308', '#ef4444', '#f59e0b'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        blocks.push({
          x: 15 + c * (w + 8),
          y: 40 + r * (h + 8),
          w,
          h,
          active: true,
          color: colors[r % colors.length],
        });
      }
    }

    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      paddleX: 160,
      paddleWidth: 80,
      ballX: 200,
      ballY: 280,
      ballVX: (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random()),
      ballVY: -4,
      blocks,
    };

    setScore(0);
    setGameState('PLAYING');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - stateRef.current.paddleWidth / 2;
    stateRef.current.paddleX = Math.max(0, Math.min(canvas.width - stateRef.current.paddleWidth, x));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left - stateRef.current.paddleWidth / 2;
    stateRef.current.paddleX = Math.max(0, Math.min(canvas.width - stateRef.current.paddleWidth, x));
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
        // Update ball position
        state.ballX += state.ballVX;
        state.ballY += state.ballVY;

        // Bounce walls
        if (state.ballX <= 8 || state.ballX >= canvas.width - 8) {
          state.ballVX *= -1;
        }
        if (state.ballY <= 8) {
          state.ballVY *= -1;
        }

        // Paddle collision
        const paddleY = canvas.height - 25;
        if (
          state.ballY + 8 >= paddleY &&
          state.ballY - 8 <= paddleY + 12 &&
          state.ballX >= state.paddleX &&
          state.ballX <= state.paddleX + state.paddleWidth
        ) {
          state.ballVY = -Math.abs(state.ballVY);
          const hitSpot = (state.ballX - (state.paddleX + state.paddleWidth / 2)) / (state.paddleWidth / 2);
          state.ballVX = hitSpot * 5;
        }

        // Block collision
        let remainingBlocks = 0;
        state.blocks.forEach((b) => {
          if (!b.active) return;
          remainingBlocks++;
          if (
            state.ballX + 8 >= b.x &&
            state.ballX - 8 <= b.x + b.w &&
            state.ballY + 8 >= b.y &&
            state.ballY - 8 <= b.y + b.h
          ) {
            b.active = false;
            state.ballVY *= -1;
            state.score += 50;
            setScore(state.score);
          }
        });

        // Respawn blocks if all destroyed
        if (remainingBlocks === 0) {
          state.blocks.forEach((b) => (b.active = true));
          state.ballVY = (Math.abs(state.ballVY) + 0.5) * -1;
        }

        // Game Over
        if (state.ballY > canvas.height) {
          state.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: state.score } })
          );
        }
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (state.gameState === 'PLAYING') {
        // Draw blocks
        state.blocks.forEach((b) => {
          if (!b.active) return;
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.shadowBlur = 0;
        });

        // Draw paddle
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
        ctx.fillRect(state.paddleX, canvas.height - 25, state.paddleWidth, 12);
        ctx.shadowBlur = 0;

        // Draw solar ball
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(state.ballX, state.ballY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h2 className="text-2xl font-bold tracking-wider text-amber-500 mb-2">SOLAR BOUNCE 2</h2>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="bg-zinc-900 border border-amber-500/30 rounded-lg cursor-none touch-none"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center rounded-lg">
            <h3 className="text-xl font-bold text-amber-400 mb-2">Solar Flare Energy Harvest</h3>
            <p className="text-zinc-400 text-sm mb-6">Bounce the solar orb to charge energy nodes.</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg">
            <h3 className="text-2xl font-bold text-red-500 mb-2">SOLAR CRITICAL ERROR</h3>
            <p className="text-zinc-300 text-lg mb-1">Final Energy Collected:</p>
            <p className="text-3xl font-extrabold text-amber-400 mb-6">{score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition-all shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between w-[400px] mt-3 text-sm font-semibold text-zinc-400">
        <span>Score: <span className="text-amber-400">{score}</span></span>
        <span>Controls: Move Mouse / Touch</span>
      </div>
    </div>
  );
}
