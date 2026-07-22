'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function RetroBlaster() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let frame = 0;

    const player = {
      x: canvas.width / 2,
      y: canvas.height - 40,
      w: 32,
      h: 24,
      speed: 6,
      vx: 0,
    };

    type Bullet = { x: number; y: number; vy: number; isEnemy: boolean };
    type Alien = { x: number; y: number; w: number; h: number; type: number };

    let bullets: Bullet[] = [];
    let aliens: Alien[] = [];

    // Keys
    const keys: Record<string, boolean> = {};
    let lastShootTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Spawn initial alien grid
    const spawnAliens = () => {
      aliens = [];
      const rows = 4;
      const cols = 8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          aliens.push({
            x: 40 + c * 42,
            y: 40 + r * 35,
            w: 26,
            h: 20,
            type: r % 3,
          });
        }
      }
    };

    spawnAliens();

    let alienDir = 1;
    let alienSpeed = 0.8;

    const gameLoop = () => {
      frame++;

      // Player Movement
      player.vx = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -player.speed;
      if (keys['ArrowRight'] || keys['KeyD']) player.vx = player.speed;
      player.x = Math.max(20, Math.min(canvas.width - 20, player.x + player.vx));

      // Player Shooting
      if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && Date.now() - lastShootTime > 200) {
        bullets.push({ x: player.x, y: player.y - 12, vy: -9, isEnemy: false });
        lastShootTime = Date.now();
      }

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Player Ship
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 12);
      ctx.lineTo(player.x + 16, player.y + 12);
      ctx.lineTo(player.x - 16, player.y + 12);
      ctx.closePath();
      ctx.fill();

      // Update & Move Aliens
      let shiftDown = false;
      for (const alien of aliens) {
        if ((alien.x > canvas.width - 30 && alienDir > 0) || (alien.x < 30 && alienDir < 0)) {
          shiftDown = true;
          break;
        }
      }

      if (shiftDown) {
        alienDir *= -1;
        for (const alien of aliens) {
          alien.y += 12;
          if (alien.y >= player.y - 20) {
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
            return;
          }
        }
      }

      for (const alien of aliens) {
        alien.x += alienDir * alienSpeed;

        // Draw Alien
        ctx.fillStyle = alien.type === 0 ? '#f43f5e' : alien.type === 1 ? '#a855f7' : '#06b6d4';
        ctx.fillRect(alien.x - alien.w / 2, alien.y - alien.h / 2, alien.w, alien.h);

        // Random alien shoot
        if (Math.random() < 0.0015) {
          bullets.push({ x: alien.x, y: alien.y + 10, vy: 4, isEnemy: true });
        }
      }

      // Respawn wave if empty
      if (aliens.length === 0) {
        currentScore += 100;
        setScore(currentScore);
        alienSpeed += 0.3;
        spawnAliens();
      }

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y += b.vy;

        // Draw bullet
        ctx.fillStyle = b.isEnemy ? '#ef4444' : '#4ade80';
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);

        // Player bullet hit alien
        if (!b.isEnemy) {
          for (let j = aliens.length - 1; j >= 0; j--) {
            const a = aliens[j];
            if (
              b.x > a.x - a.w / 2 &&
              b.x < a.x + a.w / 2 &&
              b.y > a.y - a.h / 2 &&
              b.y < a.y + a.h / 2
            ) {
              aliens.splice(j, 1);
              bullets.splice(i, 1);
              currentScore += 15;
              setScore(currentScore);
              break;
            }
          }
        } else {
          // Enemy bullet hit player
          if (
            b.x > player.x - player.w / 2 &&
            b.x < player.x + player.w / 2 &&
            b.y > player.y - player.h / 2 &&
            b.y < player.y + player.h / 2
          ) {
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
            return;
          }
        }

        // Out of bounds
        if (b.y < 0 || b.y > canvas.height) {
          bullets.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl relative select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-green-400">RETRO BLASTER</h2>
      <div className="relative border-2 border-green-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={420} height={480} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">Move with A/D or Arrow Keys. Press SPACE to shoot down invading alien armadas!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-green-500 hover:bg-green-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              START BLASTER
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-extrabold text-red-500 mb-2">SHIP DESTROYED</h3>
            <p className="text-lg text-zinc-300 mb-4">Final Score: <span className="text-green-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-green-500 hover:bg-green-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 bg-zinc-900/80 border border-green-500/30 px-3 py-1 rounded-md text-green-400 text-sm font-bold">
            Score: {score}
          </div>
        )}
      </div>
    </div>
  );
}
