'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SolarGlider() {
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
    
    // Player
    const player = {
      x: canvas.width / 2,
      y: canvas.height - 80,
      width: 30,
      height: 40,
      speed: 6,
      vx: 0,
      vy: 0
    };

    // Controls
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Obstacles & Collectibles
    type Entity = { x: number; y: number; size: number; speed: number; type: 'flare' | 'orb' };
    let entities: Entity[] = [];
    let spawnTimer = 0;

    const gameLoop = () => {
      // Input
      player.vx = 0;
      player.vy = 0;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.vx = -player.speed;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.vx = player.speed;
      if (keys['ArrowUp'] || keys['w'] || keys['W']) player.vy = -player.speed;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) player.vy = player.speed;

      player.x = Math.max(15, Math.min(canvas.width - 15, player.x + player.vx));
      player.y = Math.max(20, Math.min(canvas.height - 20, player.y + player.vy));

      // Spawn
      spawnTimer++;
      if (spawnTimer % 30 === 0) {
        const isOrb = Math.random() < 0.35;
        entities.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -20,
          size: isOrb ? 12 : Math.random() * 15 + 15,
          speed: Math.random() * 2 + 3 + currentScore * 0.005,
          type: isOrb ? 'orb' : 'flare'
        });
      }

      // Draw background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield effect
      ctx.fillStyle = 'rgba(255, 235, 150, 0.15)';
      for (let i = 0; i < 20; i++) {
        const sx = (Math.sin(i * 99 + spawnTimer * 0.05) * 0.5 + 0.5) * canvas.width;
        const sy = ((i * 30 + spawnTimer * 2) % canvas.height);
        ctx.fillRect(sx, sy, 2, 8);
      }

      // Draw Player Glider
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, -player.height / 2);
      ctx.lineTo(player.width / 2, player.height / 2);
      ctx.lineTo(0, player.height / 4);
      ctx.lineTo(-player.width / 2, player.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Process Entities
      for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        ent.y += ent.speed;

        if (ent.type === 'flare') {
          // Solar flare obstacle
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ef4444';
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(ent.x, ent.y, ent.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Collision check
          const dist = Math.hypot(ent.x - player.x, ent.y - player.y);
          if (dist < ent.size + 12) {
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
            return;
          }
        } else {
          // Solar energy orb
          ctx.save();
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#3b82f6';
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(ent.x, ent.y, ent.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Collect check
          const dist = Math.hypot(ent.x - player.x, ent.y - player.y);
          if (dist < ent.size + 15) {
            currentScore += 10;
            setScore(currentScore);
            entities.splice(i, 1);
            continue;
          }
        }

        // Out of bounds
        if (ent.y > canvas.height + 30) {
          if (ent.type === 'flare') {
            currentScore += 1;
            setScore(currentScore);
          }
          entities.splice(i, 1);
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
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-amber-400">SOLAR GLIDER</h2>
      <div className="relative border-2 border-amber-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={400} height={500} className="block" />
        
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-4 text-sm">Dodge red solar flares and collect blue energy orbs!</p>
            <p className="text-xs text-zinc-400 mb-6">Use WASD or Arrow Keys to controls</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              LAUNCH GLIDER
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-extrabold text-red-500 mb-2">GLIDER DESTROYED</h3>
            <p className="text-lg text-zinc-300 mb-4">Final Score: <span className="text-amber-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 bg-zinc-900/80 border border-amber-500/30 px-3 py-1 rounded-md text-amber-400 text-sm font-bold">
            Score: {score}
          </div>
        )}
      </div>
    </div>
  );
}
