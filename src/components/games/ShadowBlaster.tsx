'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function ShadowBlaster() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [coreHp, setCoreHp] = useState(100);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    hp: 100,
    shadows: [] as Array<{ x: number; y: number; radius: number; speed: number; hp: number }>,
    beams: [] as Array<{ x: number; y: number; alpha: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      hp: 100,
      shadows: [],
      beams: [],
      particles: [],
    };
    setScore(0);
    setCoreHp(100);
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
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const handleCanvasClick = (e: MouseEvent) => {
      const s = stateRef.current;
      if (s.gameState !== 'PLAYING') return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      s.beams.push({ x: mx, y: my, alpha: 1 });

      // Check hit on shadow monsters
      for (let i = s.shadows.length - 1; i >= 0; i--) {
        const shadow = s.shadows[i];
        const dist = Math.hypot(shadow.x - mx, shadow.y - my);
        if (dist < shadow.radius + 20) {
          shadow.hp -= 1;
          if (shadow.hp <= 0) {
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: shadow.x,
                y: shadow.y,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                life: 1,
                color: '#e0e7ff',
              });
            }
            s.shadows.splice(i, 1);
            s.score += 25;
            setScore(s.score);
          }
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    const loop = () => {
      const s = stateRef.current;

      if (s.gameState === 'PLAYING') {
        spawnTimer++;
        if (spawnTimer > Math.max(20, 55 - Math.floor(s.score / 50))) {
          spawnTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          const dist = 320;
          const sx = cx + Math.cos(angle) * dist;
          const sy = cy + Math.sin(angle) * dist;
          const speed = 1.0 + Math.random() * 1.8;

          s.shadows.push({
            x: sx,
            y: sy,
            radius: 14 + Math.random() * 10,
            speed,
            hp: Math.random() > 0.6 ? 2 : 1,
          });
        }

        // Move shadows toward center light core
        for (let i = s.shadows.length - 1; i >= 0; i--) {
          const shadow = s.shadows[i];
          const angle = Math.atan2(cy - shadow.y, cx - shadow.x);
          shadow.x += Math.cos(angle) * shadow.speed;
          shadow.y += Math.sin(angle) * shadow.speed;

          const distToCore = Math.hypot(shadow.x - cx, shadow.y - cy);
          if (distToCore < 35) {
            s.hp -= 20;
            setCoreHp(Math.max(0, s.hp));
            s.shadows.splice(i, 1);
            if (s.hp <= 0) {
              gameOver();
              break;
            }
          }
        }

        // Fade beams
        for (let i = s.beams.length - 1; i >= 0; i--) {
          s.beams[i].alpha -= 0.15;
          if (s.beams[i].alpha <= 0) s.beams.splice(i, 1);
        }

        // Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          if (p.life <= 0) s.particles.splice(i, 1);
        }
      }

      // RENDER
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Light core
      const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80);
      gradient.addColorStop(0, 'rgba(238, 242, 255, 1)');
      gradient.addColorStop(0.4, 'rgba(129, 140, 248, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e0e7ff';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fill();

      // Shadow enemies
      s.shadows.forEach((shadow) => {
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#4338ca';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#312e81';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(shadow.x, shadow.y, shadow.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 5;
        ctx.fillRect(shadow.x - 5, shadow.y - 3, 3, 3);
        ctx.fillRect(shadow.x + 2, shadow.y - 3, 3, 3);
      });

      // Beams (Light Blasters)
      s.beams.forEach((beam) => {
        ctx.strokeStyle = `rgba(224, 231, 255, ${beam.alpha})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(beam.x, beam.y);
        ctx.stroke();

        // Blast ring at mouse click location
        ctx.strokeStyle = `rgba(129, 140, 248, ${beam.alpha})`;
        ctx.beginPath();
        ctx.arc(beam.x, beam.y, 25 * (1 - beam.alpha + 0.2), 0, Math.PI * 2);
        ctx.stroke();
      });

      // Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 3, 3);
      });
      ctx.globalAlpha = 1;

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
          SHADOW BLASTER
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>CORE ENERGY: <strong className={coreHp < 30 ? 'text-red-500' : 'text-indigo-400'}>{coreHp}%</strong></span>
          <span>SCORE: <strong className="text-yellow-400">{score}</strong></span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={550}
          height={400}
          className="bg-gray-950 border-2 border-indigo-500/30 rounded-lg cursor-crosshair shadow-inner"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h3 className="text-2xl font-bold text-indigo-400 mb-2">
              {gameState === 'START' ? 'DEFEND THE LIGHT' : 'CONSUMED BY SHADOWS'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 text-center max-w-xs">
              {gameState === 'START'
                ? 'Click on the creeping shadow monsters before they reach and absorb the central Light Core!'
                : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              {gameState === 'START' ? 'BANISH SHADOWS' : 'TRY AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-400">
        [CLICK] Aim & Blast Light Beams at Shadow Monsters
      </div>
    </div>
  );
}
