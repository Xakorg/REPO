'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function MagicKnight() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentHp = 100;

    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 16,
      angle: 0,
      slashAngle: 0,
      slashing: false,
      slashTimer: 0,
    };

    type Enemy = { x: number; y: number; hp: number; maxHp: number; speed: number; radius: number };
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string };

    let enemies: Enemy[] = [];
    let particles: Particle[] = [];
    let frame = 0;

    // Mouse movement to aim slash
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    };

    const handleClick = () => {
      if (!player.slashing) {
        player.slashing = true;
        player.slashTimer = 10;
        player.slashAngle = player.angle;
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const gameLoop = () => {
      frame++;

      // Clear & Draw background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Arena circle boundary
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 220, 0, Math.PI * 2);
      ctx.stroke();

      // Spawn Enemies
      if (frame % Math.max(20, 60 - Math.floor(currentScore / 20)) === 0) {
        const spawnAngle = Math.random() * Math.PI * 2;
        const dist = 240;
        enemies.push({
          x: canvas.width / 2 + Math.cos(spawnAngle) * dist,
          y: canvas.height / 2 + Math.sin(spawnAngle) * dist,
          hp: 2,
          maxHp: 2,
          speed: 1.2 + Math.random() * 0.8,
          radius: 14,
        });
      }

      // Handle Slashing logic & rendering
      if (player.slashing) {
        player.slashTimer--;
        if (player.slashTimer <= 0) {
          player.slashing = false;
        }

        // Draw Slash Arc
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.slashAngle);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 55, -Math.PI / 3, Math.PI / 3);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Check slash hits on enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          const edist = Math.hypot(e.x - player.x, e.y - player.y);
          if (edist <= 65) {
            const enemyAngle = Math.atan2(e.y - player.y, e.x - player.x);
            let diff = enemyAngle - player.slashAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            if (Math.abs(diff) <= Math.PI / 3) {
              e.hp -= 1;
              // Push back enemy
              e.x += Math.cos(enemyAngle) * 20;
              e.y += Math.sin(enemyAngle) * 20;

              // Spark particles
              for (let p = 0; p < 5; p++) {
                particles.push({
                  x: e.x,
                  y: e.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  life: 15,
                  maxLife: 15,
                  color: '#c084fc',
                });
              }

              if (e.hp <= 0) {
                enemies.splice(i, 1);
                currentScore += 10;
                setScore(currentScore);
              }
            }
          }
        }
      }

      // Update & Draw Player Knight
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      // Sword
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(10, -3, 30, 6);

      // Body
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Update & Draw Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angleToPlayer) * e.speed;
        e.y += Math.sin(angleToPlayer) * e.speed;

        // Draw Enemy
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Check collision with player
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < player.radius + e.radius) {
          enemies.splice(i, 1);
          currentHp -= 15;
          setHealth(Math.max(0, currentHp));
          if (currentHp <= 0) {
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
            return;
          }
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1;
        if (p.life <= 0) particles.splice(i, 1);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setHealth(100);
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl relative select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-purple-400">MAGIC KNIGHT</h2>
      <div className="relative border-2 border-purple-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={500} height={500} className="block cursor-crosshair" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">Aim with your mouse and LEFT-CLICK to slash surrounded dark monsters!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              ENTER ARENA
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-extrabold text-red-500 mb-2">KNIGHT FELL</h3>
            <p className="text-lg text-zinc-300 mb-4">Final Score: <span className="text-purple-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              RESURRECT
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
            <div className="bg-zinc-900/90 border border-purple-500/30 px-3 py-1 rounded-md text-purple-300 text-sm font-bold">
              Score: {score}
            </div>
            <div className="w-36 bg-zinc-950 border border-zinc-700 h-4 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-200"
                style={{ width: `${health}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
