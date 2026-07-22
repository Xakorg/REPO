'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function IronSurfer2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;

    let waveOffset = 0;

    const surfer = {
      x: 120,
      y: 200,
      vy: 0,
      rotation: 0,
      isAirborne: false,
    };

    const obstacles: { x: number; y: number; type: 'mine' | 'ring' }[] = [];
    let spawnTimer = 0;

    const getWaveY = (x: number, offset: number) => {
      return 260 + Math.sin((x + offset) * 0.015) * 50 + Math.cos((x + offset) * 0.03) * 20;
    };

    const handleJump = () => {
      if (!surfer.isAirborne) {
        surfer.vy = -12;
        surfer.isAirborne = true;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        handleJump();
      }
    };

    const handleClick = () => {
      handleJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    const update = () => {
      waveOffset += 5;
      currentScore += 2;
      setScore(currentScore);

      const targetWaveY = getWaveY(surfer.x, waveOffset);

      if (surfer.isAirborne) {
        surfer.vy += 0.5; // Gravity
        surfer.y += surfer.vy;
        surfer.rotation += 0.1;

        // Land back on wave
        if (surfer.y >= targetWaveY - 10) {
          surfer.y = targetWaveY - 10;
          surfer.isAirborne = false;
          surfer.vy = 0;
          surfer.rotation = 0;
          currentScore += 150; // Air trick score bonus
          setScore(currentScore);
        }
      } else {
        surfer.y = targetWaveY - 10;
        // Match wave angle
        const nextWaveY = getWaveY(surfer.x + 10, waveOffset);
        surfer.rotation = Math.atan2(nextWaveY - targetWaveY, 10);
      }

      // Spawn items/obstacles
      spawnTimer++;
      if (spawnTimer % 40 === 0) {
        const isMine = Math.random() < 0.5;
        const obsX = canvas.width + 30;
        const obsY = getWaveY(obsX, waveOffset) - (isMine ? 15 : 45);

        obstacles.push({
          x: obsX,
          y: obsY,
          type: isMine ? 'mine' : 'ring',
        });
      }

      // Update Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= 5;

        const dist = Math.hypot(obs.x - surfer.x, obs.y - surfer.y);
        if (dist < 22) {
          if (obs.type === 'mine') {
            setGameState('gameover');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
            return;
          } else {
            currentScore += 300;
            setScore(currentScore);
            obstacles.splice(i, 1);
            continue;
          }
        }

        if (obs.x < -30) obstacles.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Sci-Fi Wave
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 10) {
        ctx.lineTo(x, getWaveY(x, waveOffset));
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Wave foam/crest glow line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 10) {
        ctx.lineTo(x, getWaveY(x, waveOffset));
      }
      ctx.stroke();

      // Obstacles
      obstacles.forEach((obs) => {
        if (obs.type === 'mine') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, 12, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Draw Surfer
      ctx.save();
      ctx.translate(surfer.x, surfer.y);
      ctx.rotate(surfer.rotation);

      // Surfboard
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(0, 8, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Surfer Body
      ctx.fillStyle = '#f87171';
      ctx.fillRect(-6, -18, 12, 22);

      // Head
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -22, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-orange-400 tracking-wider">IRON SURFER 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Click or Space to launch off plasma wave crests, perform flips & collect rings!</p>
      <div className="relative border-2 border-orange-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950 cursor-pointer" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-orange-400 mb-4">Ride the Cybernetic Plasma Wave!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <h2 className="text-3xl font-bold text-red-500 mb-2">WIPEOUT!</h2>
            <p className="text-lg text-zinc-300 mb-4">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 font-mono text-lg text-orange-400">Score: {score}</div>
    </div>
  );
}
