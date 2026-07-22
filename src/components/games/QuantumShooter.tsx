'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function QuantumShooter() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    player: { x: 300, y: 200, radius: 15, vx: 0, vy: 0 },
    bullets: [] as Array<{ x: number; y: number; vx: number; vy: number }>,
    enemies: [] as Array<{ x: number; y: number; radius: number; vx: number; vy: number; hp: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
    keys: { w: false, a: false, s: false, d: false },
    mouse: { x: 0, y: 0, down: false },
    lastShot: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      player: { x: 300, y: 200, radius: 15, vx: 0, vy: 0 },
      bullets: [],
      enemies: [],
      particles: [],
      keys: { w: false, a: false, s: false, d: false },
      mouse: { x: 300, y: 200, down: false },
      lastShot: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  const gameOver = () => {
    const finalScore = stateRef.current.score;
    setGameState('GAMEOVER');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') stateRef.current.keys.w = true;
      if (k === 'a' || e.key === 'ArrowLeft') stateRef.current.keys.a = true;
      if (k === 's' || e.key === 'ArrowDown') stateRef.current.keys.s = true;
      if (k === 'd' || e.key === 'ArrowRight') stateRef.current.keys.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') stateRef.current.keys.w = false;
      if (k === 'a' || e.key === 'ArrowLeft') stateRef.current.keys.a = false;
      if (k === 's' || e.key === 'ArrowDown') stateRef.current.keys.s = false;
      if (k === 'd' || e.key === 'ArrowRight') stateRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouse.x = e.clientX - rect.left;
      stateRef.current.mouse.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      stateRef.current.mouse.down = true;
    };

    const handleMouseUp = () => {
      stateRef.current.mouse.down = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    const loop = () => {
      const s = stateRef.current;

      if (s.gameState === 'PLAYING') {
        // Player movement
        if (s.keys.w) s.player.vy -= 0.5;
        if (s.keys.s) s.player.vy += 0.5;
        if (s.keys.a) s.player.vx -= 0.5;
        if (s.keys.d) s.player.vx += 0.5;

        s.player.vx *= 0.9;
        s.player.vy *= 0.9;
        s.player.x += s.player.vx;
        s.player.y += s.player.vy;

        // Boundaries
        s.player.x = Math.max(15, Math.min(canvas.width - 15, s.player.x));
        s.player.y = Math.max(15, Math.min(canvas.height - 15, s.player.y));

        // Shooting
        const now = Date.now();
        if (s.mouse.down && now - s.lastShot > 120) {
          s.lastShot = now;
          const angle = Math.atan2(s.mouse.y - s.player.y, s.mouse.x - s.player.x);
          s.bullets.push({
            x: s.player.x,
            y: s.player.y,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10,
          });
        }

        // Spawn enemies
        spawnTimer++;
        if (spawnTimer > Math.max(20, 60 - Math.floor(s.score / 50))) {
          spawnTimer = 0;
          const edge = Math.floor(Math.random() * 4);
          let ex = 0, ey = 0;
          if (edge === 0) { ex = Math.random() * canvas.width; ey = -20; }
          else if (edge === 1) { ex = canvas.width + 20; ey = Math.random() * canvas.height; }
          else if (edge === 2) { ex = Math.random() * canvas.width; ey = canvas.height + 20; }
          else { ex = -20; ey = Math.random() * canvas.height; }

          const angle = Math.atan2(s.player.y - ey, s.player.x - ex);
          const speed = 1.5 + Math.random() * 1.5;
          s.enemies.push({
            x: ex,
            y: ey,
            radius: 12 + Math.random() * 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            hp: 1,
          });
        }

        // Update Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            s.bullets.splice(i, 1);
          }
        }

        // Update Enemies
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          e.x += e.vx;
          e.y += e.vy;

          // Check collision with player
          const distToPlayer = Math.hypot(e.x - s.player.x, e.y - s.player.y);
          if (distToPlayer < e.radius + s.player.radius) {
            gameOver();
            break;
          }

          // Bullet collisions
          for (let j = s.bullets.length - 1; j >= 0; j--) {
            const b = s.bullets[j];
            const distToBullet = Math.hypot(e.x - b.x, e.y - b.y);
            if (distToBullet < e.radius + 5) {
              s.bullets.splice(j, 1);
              e.hp--;
              if (e.hp <= 0) {
                // Explosions
                for (let p = 0; p < 8; p++) {
                  s.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 1,
                    color: '#38bdf8',
                  });
                }
                s.enemies.splice(i, 1);
                s.score += 10;
                setScore(s.score);
                break;
              }
            }
          }
        }

        // Update Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          if (p.life <= 0) s.particles.splice(i, 1);
        }
      }

      // RENDER
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bullets
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      s.bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw enemies
      s.enemies.forEach((e) => {
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 3, 3);
      });
      ctx.globalAlpha = 1;

      // Draw Player
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, s.player.radius, 0, Math.PI * 2);
      ctx.fill();

      // Gun direction line
      const angle = Math.atan2(s.mouse.y - s.player.y, s.mouse.x - s.player.x);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(s.player.x, s.player.y);
      ctx.lineTo(s.player.x + Math.cos(angle) * 22, s.player.y + Math.sin(angle) * 22);
      ctx.stroke();

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
          QUANTUM SHOOTER
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
          className="bg-slate-950 border-2 border-sky-500/30 rounded-lg cursor-crosshair shadow-inner"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h3 className="text-2xl font-bold text-sky-400 mb-2">
              {gameState === 'START' ? 'QUANTUM DEFENSE' : 'QUANTUM DISRUPTED'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 text-center max-w-xs">
              {gameState === 'START'
                ? 'Use [WASD] to move, hold [MOUSE CLICK] to aim and shoot incoming red quantum glitches!'
                : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(56,189,248,0.4)]"
            >
              {gameState === 'START' ? 'INITIALIZE GAME' : 'RESTART'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-zinc-400">
        <span>[WASD] Move</span>
        <span>[MOUSE] Aim & Shoot</span>
      </div>
    </div>
  );
}
