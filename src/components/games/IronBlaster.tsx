'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Bullet {
  x: number;
  y: number;
}

interface Alien {
  id: number;
  x: number;
  y: number;
  alive: boolean;
}

export default function IronBlaster() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  const playerXRef = useRef(280);
  const bulletsRef = useRef<Bullet[]>([]);
  const aliensRef = useRef<Alien[]>([]);
  const alienDirectionRef = useRef(1); // 1 = right, -1 = left
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastShotRef = useRef(0);

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

  const moveLeft = () => {
    playerXRef.current = Math.max(20, playerXRef.current - 30);
  };

  const moveRight = () => {
    playerXRef.current = Math.min(540, playerXRef.current + 30);
  };

  const shoot = () => {
    const now = Date.now();
    if (now - lastShotRef.current > 200) {
      lastShotRef.current = now;
      bulletsRef.current.push({
        x: playerXRef.current + 18,
        y: 350,
      });
    }
  };

  const spawnAlienGrid = () => {
    const aliens: Alien[] = [];
    let id = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        aliens.push({
          id: id++,
          x: 60 + c * 55,
          y: 40 + r * 40,
          alive: true,
        });
      }
    }
    aliensRef.current = aliens;
  };

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    playerXRef.current = 280;
    bulletsRef.current = [];
    alienDirectionRef.current = 1;
    spawnAlienGrid();
    gameOverHandled.current = false;
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        shoot();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (!ctx || gameStateRef.current !== 'playing') return;

      // Player Movement
      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        playerXRef.current = Math.max(15, playerXRef.current - 5);
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        playerXRef.current = Math.min(545, playerXRef.current + 5);
      }
      if (keysRef.current[' ']) {
        shoot();
      }

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Move Aliens
      let touchEdge = false;
      const speed = 0.8 + Math.min(scoreRef.current / 400, 2);

      const activeAliens = aliensRef.current.filter((a) => a.alive);
      if (activeAliens.length === 0) {
        // Respawn next wave
        spawnAlienGrid();
      }

      activeAliens.forEach((alien) => {
        alien.x += speed * alienDirectionRef.current;
        if (alien.x > canvas.width - 40 || alien.x < 10) {
          touchEdge = true;
        }

        if (alien.y >= 330) {
          handleGameOver(scoreRef.current);
          return;
        }
      });

      if (touchEdge) {
        alienDirectionRef.current *= -1;
        aliensRef.current.forEach((a) => {
          if (a.alive) a.y += 15;
        });
      }

      // Update Bullets
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.y -= 8;

        if (b.y < 0) {
          bulletsRef.current.splice(i, 1);
          continue;
        }

        // Check bullet hit alien
        for (const alien of aliensRef.current) {
          if (alien.alive) {
            if (b.x > alien.x && b.x < alien.x + 35 && b.y > alien.y && b.y < alien.y + 25) {
              alien.alive = false;
              bulletsRef.current.splice(i, 1);
              const newScore = scoreRef.current + 15;
              setScore(newScore);
              scoreRef.current = newScore;
              break;
            }
          }
        }

        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(b.x - 2, b.y, 4, 10);
      }

      // Draw Aliens
      aliensRef.current.forEach((alien) => {
        if (!alien.alive) return;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(alien.x, alien.y, 35, 25);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(alien.x + 6, alien.y + 6, 6, 6);
        ctx.fillRect(alien.x + 23, alien.y + 6, 6, 6);
      });

      // Draw Player Mech
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(playerXRef.current, 360, 40, 20);
      ctx.fillRect(playerXRef.current + 15, 345, 10, 15);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-rose-500 mb-2 tracking-wider">IRON BLASTER</h1>

      {gameState === 'playing' && (
        <div className="text-xl font-bold text-rose-400 mb-2">Score: {score}</div>
      )}

      <div className="relative border-2 border-rose-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={600} height={400} className="max-w-full" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-6 max-w-md">
              Control your iron blaster cannon. Move left/right and unleash laser blasts to destroy invading space armadas!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              START BLASTER
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">INVASION OVERWHELMED</h2>
            <p className="text-2xl text-rose-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={moveLeft}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-lg border border-rose-500/40 text-rose-300 text-lg transition active:scale-95"
          >
            ◀ LEFT
          </button>
          <button
            onClick={shoot}
            className="px-8 py-3 bg-rose-500 hover:bg-rose-400 font-black rounded-lg text-zinc-950 text-lg transition active:scale-95"
          >
            FIRE (SPACE)
          </button>
          <button
            onClick={moveRight}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-lg border border-rose-500/40 text-rose-300 text-lg transition active:scale-95"
          >
            RIGHT ▶
          </button>
        </div>
      )}
    </div>
  );
}
