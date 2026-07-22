'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function NeonKnight() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    player: { x: 50, y: 200, width: 30, height: 40, vy: 0, grounded: false, attacking: 0 },
    obstacles: [] as Array<{ x: number; y: number; w: number; h: number; type: 'spike' | 'enemy' }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
    speed: 5,
    frameCount: 0,
  });

  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      player: { x: 80, y: 200, width: 30, height: 40, vy: 0, grounded: false, attacking: 0 },
      obstacles: [],
      particles: [],
      speed: 5,
      frameCount: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  const gameOver = () => {
    const finalScore = Math.floor(stateRef.current.score);
    setGameState('GAMEOVER');
    if (finalScore > highScore) setHighScore(finalScore);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      } else if (e.code === 'KeyZ' || e.code === 'KeyX') {
        attack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const jump = () => {
    const s = stateRef.current;
    if (s.gameState === 'PLAYING' && s.player.grounded) {
      s.player.vy = -12;
      s.player.grounded = false;
      // particles
      for (let i = 0; i < 8; i++) {
        s.particles.push({
          x: s.player.x + 15,
          y: s.player.y + 40,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 2,
          life: 1,
          color: '#00f3ff',
        });
      }
    } else if (s.gameState !== 'PLAYING') {
      startGame();
    }
  };

  const attack = () => {
    const s = stateRef.current;
    if (s.gameState === 'PLAYING' && s.player.attacking <= 0) {
      s.player.attacking = 15;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const groundY = 280;

    const loop = () => {
      const s = stateRef.current;

      if (s.gameState === 'PLAYING') {
        s.frameCount++;
        s.score += 0.1;
        setScore(Math.floor(s.score));
        s.speed = 5 + Math.floor(s.score / 50) * 0.5;

        // Player physics
        s.player.vy += 0.6; // gravity
        s.player.y += s.player.vy;
        if (s.player.y + s.player.height >= groundY) {
          s.player.y = groundY - s.player.height;
          s.player.vy = 0;
          s.player.grounded = true;
        }

        if (s.player.attacking > 0) {
          s.player.attacking--;
        }

        // Spawn obstacles
        if (s.frameCount % Math.max(40, 100 - Math.floor(s.score / 10)) === 0) {
          const type = Math.random() > 0.5 ? 'enemy' : 'spike';
          s.obstacles.push({
            x: canvas.width + 20,
            y: type === 'spike' ? groundY - 25 : groundY - 40,
            w: 25,
            h: type === 'spike' ? 25 : 40,
            type,
          });
        }

        // Update obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Check attack hit on enemy
          if (s.player.attacking > 0 && obs.type === 'enemy') {
            if (
              s.player.x + s.player.width + 40 >= obs.x &&
              s.player.x <= obs.x + obs.w &&
              Math.abs(s.player.y - obs.y) < 50
            ) {
              // Destroy enemy
              for (let p = 0; p < 12; p++) {
                s.particles.push({
                  x: obs.x + 10,
                  y: obs.y + 20,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  life: 1,
                  color: '#ff0055',
                });
              }
              s.obstacles.splice(i, 1);
              s.score += 15;
              continue;
            }
          }

          // Collision check
          if (
            s.player.x < obs.x + obs.w &&
            s.player.x + s.player.width > obs.x &&
            s.player.y < obs.y + obs.h &&
            s.player.y + s.player.height > obs.y
          ) {
            gameOver();
          }

          if (obs.x + obs.w < 0) {
            s.obstacles.splice(i, 1);
          }
        }

        // Update particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.04;
          if (p.life <= 0) s.particles.splice(i, 1);
        }
      }

      // Draw
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background effect
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
      ctx.lineWidth = 1;
      const offset = (s.frameCount * s.speed) % 40;
      for (let x = -offset; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 100, canvas.height);
        ctx.stroke();
      }

      // Ground
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      // Obstacles
      s.obstacles.forEach((obs) => {
        if (obs.type === 'spike') {
          ctx.fillStyle = '#ff0055';
          ctx.shadowColor = '#ff0055';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.h);
          ctx.lineTo(obs.x + obs.w / 2, obs.y);
          ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 12;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
      });

      // Player
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 15;
      ctx.fillRect(s.player.x, s.player.y, s.player.width, s.player.height);

      // Attack slash visual
      if (s.player.attacking > 0) {
        ctx.strokeStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(s.player.x + s.player.width + 10, s.player.y + 20, 25, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-cyan-400 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
          NEON KNIGHT
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>SCORE: <strong className="text-white">{score}</strong></span>
          <span>HIGH SCORE: <strong className="text-yellow-400">{highScore}</strong></span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={320}
          onClick={jump}
          className="bg-zinc-900 border-2 border-cyan-500/30 rounded-lg cursor-pointer shadow-inner"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h3 className="text-2xl font-bold text-cyan-400 mb-2">
              {gameState === 'START' ? 'CYBER RUNNER' : 'GAME OVER'}
            </h3>
            <p className="text-zinc-400 text-sm mb-6 text-center max-w-xs">
              {gameState === 'START' ? 'Jump over red spikes & slash purple enemies!' : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)]"
            >
              {gameState === 'START' ? 'START MISSION' : 'TRY AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-zinc-400">
        <span>[SPACE / UP] Jump</span>
        <span>[Z / X] Slash Attack</span>
        <span>[CLICK] Jump</span>
      </div>
      <div className="mt-2 flex gap-3">
        <button
          onClick={jump}
          className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 rounded-md text-xs font-semibold border border-cyan-500/20"
        >
          JUMP
        </button>
        <button
          onClick={attack}
          className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 rounded-md text-xs font-semibold border border-yellow-500/20"
        >
          SLASH
        </button>
      </div>
    </div>
  );
}
