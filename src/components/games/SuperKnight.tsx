'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Obstacle {
  x: number;
  type: 'spike' | 'goblin';
  width: number;
  height: number;
}

export default function SuperKnight() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  const yRef = useRef(280);
  const vyRef = useRef(0);
  const isJumpingRef = useRef(false);
  const isSlashingRef = useRef(false);
  const slashTimerRef = useRef(0);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const nextSpawnRef = useRef(0);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const gameOverHandled = useRef(false);

  const handleGameOver = (finalScore: number) => {
    if (gameOverHandled.current) return;
    gameOverHandled.current = true;
    setGameState('gameover');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  const jump = () => {
    if (!isJumpingRef.current && gameStateRef.current === 'playing') {
      vyRef.current = -12;
      isJumpingRef.current = true;
    }
  };

  const slash = () => {
    if (!isSlashingRef.current && gameStateRef.current === 'playing') {
      isSlashingRef.current = true;
      slashTimerRef.current = 15;
    }
  };

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    yRef.current = 280;
    vyRef.current = 0;
    isJumpingRef.current = false;
    isSlashingRef.current = false;
    obstaclesRef.current = [];
    nextSpawnRef.current = 0;
    gameOverHandled.current = false;
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        jump();
      }
      if (e.key === 'f' || e.key === 'F' || e.key === 'ArrowDown' || e.key === 's') {
        slash();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    const groundY = 280;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (!ctx || gameStateRef.current !== 'playing') return;

      // Physics
      yRef.current += vyRef.current;
      vyRef.current += 0.6; // gravity

      if (yRef.current >= groundY) {
        yRef.current = groundY;
        vyRef.current = 0;
        isJumpingRef.current = false;
      }

      // Slashing timer
      if (isSlashingRef.current) {
        slashTimerRef.current--;
        if (slashTimerRef.current <= 0) {
          isSlashingRef.current = false;
        }
      }

      // Spawn obstacles
      nextSpawnRef.current--;
      if (nextSpawnRef.current <= 0) {
        const type = Math.random() < 0.5 ? 'spike' : 'goblin';
        obstaclesRef.current.push({
          x: 620,
          type,
          width: type === 'spike' ? 24 : 32,
          height: type === 'spike' ? 30 : 40,
        });
        nextSpawnRef.current = Math.floor(70 + Math.random() * 60 - Math.min(scoreRef.current / 10, 30));
      }

      // Background draw
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, 320, canvas.width, 80);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 320, canvas.width, 4);

      // Obstacles update & draw
      const speed = 5 + Math.min(scoreRef.current / 50, 4);
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= speed;

        const obsY = obs.type === 'spike' ? 320 - obs.height : 320 - obs.height;

        if (obs.type === 'spike') {
          // Draw spike
          ctx.beginPath();
          ctx.moveTo(obs.x, 320);
          ctx.lineTo(obs.x + obs.width / 2, obsY);
          ctx.lineTo(obs.x + obs.width, 320);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        } else {
          // Draw Goblin
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(obs.x, obsY, obs.width, obs.height);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(obs.x + 4, obsY + 8, 6, 6); // eyes
        }

        // Collision detection
        const knightBox = { x: 80, y: yRef.current, w: 30, h: 40 };
        const obsBox = { x: obs.x, y: obsY, w: obs.width, h: obs.height };

        if (
          knightBox.x < obsBox.x + obsBox.w &&
          knightBox.x + knightBox.w > obsBox.x &&
          knightBox.y < obsBox.y + obsBox.h &&
          knightBox.y + knightBox.h > obsBox.y
        ) {
          if (obs.type === 'goblin' && isSlashingRef.current) {
            // Goblin defeated!
            obstaclesRef.current.splice(i, 1);
            const newScore = scoreRef.current + 20;
            setScore(newScore);
            scoreRef.current = newScore;
            continue;
          } else {
            // Player hit!
            handleGameOver(scoreRef.current);
            return;
          }
        }

        if (obs.x + obs.width < 0) {
          obstaclesRef.current.splice(i, 1);
          const newScore = scoreRef.current + 10;
          setScore(newScore);
          scoreRef.current = newScore;
        }
      }

      // Draw Knight
      ctx.fillStyle = '#38bdf8'; // Armor color
      ctx.fillRect(80, yRef.current, 30, 40);

      // Knight shield & helmet visor
      ctx.fillStyle = '#f87171';
      ctx.fillRect(95, yRef.current + 6, 10, 4);

      // Sword slash arc
      if (isSlashingRef.current) {
        ctx.beginPath();
        ctx.arc(105, yRef.current + 20, 30, -Math.PI / 3, Math.PI / 3);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-amber-400 mb-2 tracking-wider">SUPER KNIGHT</h1>

      {gameState === 'playing' && (
        <div className="text-xl font-bold text-amber-400 mb-2">Score: {score}</div>
      )}

      <div className="relative border-2 border-amber-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onClick={jump}
          className="cursor-pointer max-w-full"
        />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-6 max-w-md">
              Run forward! Press SPACE or TAP to Jump over deadly red spikes. Press F or SLASH button to slay green goblins!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              START RUN
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">KNIGHT FELL!</h2>
            <p className="text-2xl text-amber-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              RUN AGAIN
            </button>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={jump}
            className="px-8 py-3 bg-sky-600 hover:bg-sky-500 font-black rounded-lg text-white text-lg transition active:scale-95"
          >
            JUMP (SPACE)
          </button>
          <button
            onClick={slash}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 font-black rounded-lg text-zinc-950 text-lg transition active:scale-95"
          >
            SLASH (F)
          </button>
        </div>
      )}
    </div>
  );
}
