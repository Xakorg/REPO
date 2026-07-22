'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function MegaKnight2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [knightHp, setKnightHp] = useState(100);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentHp = 100;

    const groundY = canvas.height - 40;

    const knight = {
      x: canvas.width / 2,
      y: groundY - 40,
      vy: 0,
      width: 30,
      height: 40,
      isGrounded: true,
      facingRight: true,
      isAttacking: false,
      attackTimer: 0,
    };

    const enemies: { x: number; y: number; vx: number; hp: number; maxHp: number; radius: number; color: string }[] = [];

    let spawnTimer = 0;
    const keys: Record<string, boolean> = {};

    const attack = () => {
      if (!knight.isAttacking) {
        knight.isAttacking = true;
        knight.attackTimer = 15;

        // Hit enemies in attack range
        const attackBoxX = knight.facingRight ? knight.x + knight.width : knight.x - 45;
        const attackBoxW = 45;

        enemies.forEach((en) => {
          if (en.x > attackBoxX && en.x < attackBoxX + attackBoxW) {
            en.hp -= 50;
          }
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === ' ' || e.key === 'j' || e.key === 'k') {
        attack();
      }
      if ((e.key === 'w' || e.key === 'ArrowUp') && knight.isGrounded) {
        knight.vy = -12;
        knight.isGrounded = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    const handleClick = () => {
      attack();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleClick);

    const update = () => {
      // Horizontal Movement
      if (keys['ArrowLeft'] || keys['a']) {
        knight.x = Math.max(10, knight.x - 5);
        knight.facingRight = false;
      }
      if (keys['ArrowRight'] || keys['d']) {
        knight.x = Math.min(canvas.width - knight.width - 10, knight.x + 5);
        knight.facingRight = true;
      }

      // Gravity
      knight.vy += 0.6;
      knight.y += knight.vy;

      if (knight.y >= groundY - knight.height) {
        knight.y = groundY - knight.height;
        knight.vy = 0;
        knight.isGrounded = true;
      }

      // Attack timer
      if (knight.isAttacking) {
        knight.attackTimer--;
        if (knight.attackTimer <= 0) knight.isAttacking = false;
      }

      // Spawn Enemies
      spawnTimer++;
      if (spawnTimer % 45 === 0) {
        const spawnFromLeft = Math.random() < 0.5;
        enemies.push({
          x: spawnFromLeft ? -20 : canvas.width + 20,
          y: groundY - 30,
          vx: spawnFromLeft ? Math.random() * 1.5 + 1.2 : -(Math.random() * 1.5 + 1.2),
          hp: 40,
          maxHp: 40,
          radius: 15,
          color: spawnFromLeft ? '#16a34a' : '#9333ea',
        });
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        en.x += en.vx;

        if (en.hp <= 0) {
          enemies.splice(i, 1);
          currentScore += 100;
          setScore(currentScore);
          continue;
        }

        // Enemy hits knight
        if (Math.abs(en.x - (knight.x + knight.width / 2)) < en.radius + 15 && Math.abs(en.y - knight.y) < 30) {
          currentHp -= 10;
          setKnightHp(currentHp);
          enemies.splice(i, 1);

          if (currentHp <= 0) {
            setGameState('gameover');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
            return;
          }
        }
      }
    };

    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Arena Floor
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.fillStyle = '#e4e4e7';
      ctx.fillRect(0, groundY, canvas.width, 4);

      // Knight Body
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(knight.x, knight.y, knight.width, knight.height);

      // Helmet Visor
      ctx.fillStyle = '#0f172a';
      const visorX = knight.facingRight ? knight.x + 16 : knight.x + 4;
      ctx.fillRect(visorX, knight.y + 6, 10, 5);

      // Sword Strike / Slash Animation
      if (knight.isAttacking) {
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        const slashX = knight.facingRight ? knight.x + knight.width : knight.x - 40;

        ctx.beginPath();
        ctx.arc(slashX + 20, knight.y + 20, 30, knight.facingRight ? -Math.PI / 3 : (2 * Math.PI) / 3, knight.facingRight ? Math.PI / 3 : (4 * Math.PI) / 3);
        ctx.stroke();
      }

      // Draw Enemies
      enemies.forEach((en) => {
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
        ctx.fill();

        // Enemy eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(en.x - 4, en.y - 4, 3, 3);
        ctx.fillRect(en.x + 2, en.y - 4, 3, 3);
      });
    };

    const loop = () => {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setKnightHp(100);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-slate-300 tracking-wider">MEGA KNIGHT 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Use A/D to move, W to jump, Space or Click to strike with Sword!</p>
      <div className="relative border-2 border-slate-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950 cursor-crosshair" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-slate-300 mb-4">Slash Through Hordes of Dark Creatures!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <h2 className="text-3xl font-bold text-red-500 mb-2">KNIGHT DEFEATED</h2>
            <p className="text-lg text-zinc-300 mb-4">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-8 mt-4 font-mono text-lg">
        <span className="text-slate-300">Score: {score}</span>
        <span className="text-emerald-400">Knight HP: {knightHp}</span>
      </div>
    </div>
  );
}
