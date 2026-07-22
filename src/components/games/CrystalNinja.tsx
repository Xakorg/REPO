'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CrystalNinja() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    lives: 3,
    items: [] as Array<{ x: number; y: number; vx: number; vy: number; radius: number; isBomb: boolean; color: string }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
    slashes: [] as Array<{ x: number; y: number; time: number }>,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      lives: 3,
      items: [],
      particles: [],
      slashes: [],
    };
    setScore(0);
    setLives(3);
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;
    const colors = ['#00f3ff', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

    const handleMouseMove = (e: MouseEvent) => {
      const s = stateRef.current;
      if (s.gameState !== 'PLAYING') return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      s.slashes.push({ x: mx, y: my, time: 10 });

      // Check hit on items
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        const dist = Math.hypot(item.x - mx, item.y - my);

        if (dist < item.radius + 10) {
          if (item.isBomb) {
            // Hit Bomb!
            s.lives--;
            setLives(s.lives);
            // Explosion particles
            for (let p = 0; p < 20; p++) {
              s.particles.push({
                x: item.x,
                y: item.y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1,
                color: '#ef4444',
              });
            }
            s.items.splice(i, 1);
            if (s.lives <= 0) {
              gameOver();
              break;
            }
          } else {
            // Slice Crystal!
            s.score += 10;
            setScore(s.score);
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: item.x,
                y: item.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: item.color,
              });
            }
            s.items.splice(i, 1);
          }
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const loop = () => {
      const s = stateRef.current;

      if (s.gameState === 'PLAYING') {
        spawnTimer++;
        if (spawnTimer > Math.max(15, 45 - Math.floor(s.score / 40))) {
          spawnTimer = 0;
          const isBomb = Math.random() < 0.2;
          const radius = isBomb ? 18 : 22;
          const x = 50 + Math.random() * (canvas.width - 100);
          const vx = (Math.random() - 0.5) * 4;
          const vy = -(11 + Math.random() * 4); // shoot upward

          s.items.push({
            x,
            y: canvas.height + 20,
            vx,
            vy,
            radius,
            isBomb,
            color: isBomb ? '#ef4444' : colors[Math.floor(Math.random() * colors.length)],
          });
        }

        // Update Items
        for (let i = s.items.length - 1; i >= 0; i--) {
          const item = s.items[i];
          item.x += item.vx;
          item.y += item.vy;
          item.vy += 0.3; // gravity

          if (item.y > canvas.height + 40) {
            if (!item.isBomb) {
              s.lives--;
              setLives(s.lives);
              if (s.lives <= 0) {
                gameOver();
                break;
              }
            }
            s.items.splice(i, 1);
          }
        }

        // Fade slashes
        for (let i = s.slashes.length - 1; i >= 0; i--) {
          s.slashes[i].time--;
          if (s.slashes[i].time <= 0) s.slashes.splice(i, 1);
        }

        // Update particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          if (p.life <= 0) s.particles.splice(i, 1);
        }
      }

      // RENDER
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw items (crystals / bombs)
      s.items.forEach((item) => {
        if (item.isBomb) {
          ctx.fillStyle = '#18181b';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Fuse spark
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(item.x - 2, item.y - item.radius - 4, 4, 4);
        } else {
          // Diamond crystal shape
          ctx.fillStyle = item.color;
          ctx.shadowColor = item.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(item.x, item.y - item.radius);
          ctx.lineTo(item.x + item.radius, item.y);
          ctx.lineTo(item.x, item.y + item.radius);
          ctx.lineTo(item.x - item.radius, item.y);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Draw Ninja Slashes
      if (s.slashes.length > 1) {
        ctx.strokeStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.slashes[0].x, s.slashes[0].y);
        for (let i = 1; i < s.slashes.length; i++) {
          ctx.lineTo(s.slashes[i].x, s.slashes[i].y);
        }
        ctx.stroke();
      }

      // Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-teal-400 drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]">
          CRYSTAL NINJA
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>LIVES: <strong className="text-red-400">{'❤️'.repeat(lives)}</strong></span>
          <span>SCORE: <strong className="text-yellow-400">{score}</strong></span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="bg-zinc-900 border-2 border-teal-500/30 rounded-lg cursor-crosshair shadow-inner"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h3 className="text-2xl font-bold text-teal-400 mb-2">
              {gameState === 'START' ? 'CRYSTAL SLICER' : 'MISSION FAILED'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 text-center max-w-xs">
              {gameState === 'START'
                ? 'Swipe your mouse to slice glowing crystals! Don’t slice red bombs or miss crystals!'
                : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(20,184,166,0.4)]"
            >
              {gameState === 'START' ? 'ENTER DOJO' : 'TRY AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-400">
        [MOUSE SWIPE] Slice crystals into pieces!
      </div>
    </div>
  );
}
