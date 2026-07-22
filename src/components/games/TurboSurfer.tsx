'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function TurboSurfer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    playerY: 200,
    playerVy: 0,
    targetY: 200,
    obstacles: [] as Array<{ x: number; y: number; size: number; type: 'mine' | 'ring' }>,
    speed: 6,
    frameCount: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      playerY: 200,
      playerVy: 0,
      targetY: 200,
      obstacles: [],
      speed: 6,
      frameCount: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  const gameOver = () => {
    const finalScore = Math.floor(stateRef.current.score);
    setGameState('GAMEOVER');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  const moveUp = () => {
    const s = stateRef.current;
    if (s.gameState === 'PLAYING') {
      s.targetY = Math.max(80, s.targetY - 80);
    }
  };

  const moveDown = () => {
    const s = stateRef.current;
    if (s.gameState === 'PLAYING') {
      s.targetY = Math.min(320, s.targetY + 80);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        moveUp();
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        moveDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      if (s.gameState === 'PLAYING') {
        s.frameCount++;
        s.score += 0.15;
        setScore(Math.floor(s.score));
        s.speed = 6 + Math.floor(s.score / 80) * 0.5;

        // Smooth player Y transition
        s.playerY += (s.targetY - s.playerY) * 0.15;

        // Spawn items/mines
        if (s.frameCount % 35 === 0) {
          const lanes = [80, 160, 240, 320];
          const spawnY = lanes[Math.floor(Math.random() * lanes.length)];
          const type = Math.random() > 0.4 ? 'ring' : 'mine';
          s.obstacles.push({
            x: canvas.width + 30,
            y: spawnY,
            size: type === 'ring' ? 20 : 25,
            type,
          });
        }

        // Update obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Collision check
          const dist = Math.hypot(100 - obs.x, s.playerY - obs.y);
          if (dist < obs.size + 15) {
            if (obs.type === 'ring') {
              s.score += 40;
              s.obstacles.splice(i, 1);
            } else {
              gameOver();
              break;
            }
          } else if (obs.x < -40) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // RENDER SYNTHWAVE / CYBER WAVE
      ctx.fillStyle = '#090514';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Waves lines
      const waveOffset = (s.frameCount * s.speed) % 50;
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
      ctx.lineWidth = 2;
      for (let y = 60; y <= 340; y += 80) {
        ctx.beginPath();
        for (let x = -waveOffset; x <= canvas.width; x += 10) {
          const sinY = Math.sin((x + s.frameCount * 4) * 0.02) * 8;
          ctx.lineTo(x, y + sinY);
        }
        ctx.stroke();
      }

      // Draw obstacles & rings
      s.obstacles.forEach((obs) => {
        if (obs.type === 'ring') {
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Player Surfer
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 18;

      // Surfboard
      ctx.beginPath();
      ctx.ellipse(100, s.playerY + 12, 30, 8, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Surfer character
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(100, s.playerY - 10, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100, s.playerY - 2);
      ctx.lineTo(100, s.playerY + 10);
      ctx.stroke();

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
          TURBO SURFER
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>SCORE: <strong className="text-yellow-400">{score}</strong></span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          className="bg-zinc-950 border-2 border-pink-500/30 rounded-lg shadow-inner"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h3 className="text-2xl font-bold text-pink-500 mb-2">
              {gameState === 'START' ? 'SYNTHWAVE SURF' : 'WIPEOUT!'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 text-center max-w-xs">
              {gameState === 'START'
                ? 'Ride cyber waves! Switch lanes with Up/Down arrows. Collect blue energy rings & dodge red mines!'
                : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-pink-500 hover:bg-pink-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)]"
            >
              {gameState === 'START' ? 'CATCH THE WAVE' : 'SURF AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-zinc-400">
        <span>[UP / W] Switch Lane Up</span>
        <span>[DOWN / S] Switch Lane Down</span>
      </div>

      <div className="mt-2 flex gap-4">
        <button
          onClick={moveUp}
          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-pink-400 rounded-lg font-bold border border-pink-500/20 active:scale-95"
        >
          ▲ LANE UP
        </button>
        <button
          onClick={moveDown}
          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-pink-400 rounded-lg font-bold border border-pink-500/20 active:scale-95"
        >
          ▼ LANE DOWN
        </button>
      </div>
    </div>
  );
}
