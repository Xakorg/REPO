'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Hazard {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'demon';
}

interface Spell {
  x: number;
  y: number;
}

interface Mana {
  x: number;
  y: number;
}

export default function MysticRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let runnerY = canvas.height - 70;
    let runnerVy = 0;
    const runnerX = 80;
    const groundY = canvas.height - 70;
    let isGrounded = true;

    let speed = 5;
    let frameCount = 0;

    let hazards: Hazard[] = [];
    let spells: Spell[] = [];
    let manas: Mana[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') && isGrounded) {
        runnerVy = -13;
        isGrounded = false;
      }
      if (e.key === 'x' || e.key === 'X' || e.key === 'Shift') {
        spells.push({ x: runnerX + 20, y: runnerY + 10 });
      }
    };

    const handleCanvasClick = () => {
      if (isGrounded) {
        runnerVy = -13;
        isGrounded = false;
      } else {
        spells.push({ x: runnerX + 20, y: runnerY + 10 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleCanvasClick);

    const gameLoop = () => {
      frameCount++;
      setScore((s) => s + 1);

      // Jump Physics
      runnerVy += 0.75;
      runnerY += runnerVy;
      if (runnerY >= groundY) {
        runnerY = groundY;
        runnerVy = 0;
        isGrounded = true;
      }

      // Speed up
      if (frameCount % 300 === 0) speed += 0.4;

      // Spawn Hazards
      if (frameCount % Math.max(35, 80 - Math.floor(speed * 3)) === 0) {
        const isDemon = Math.random() > 0.5;
        hazards.push({
          x: canvas.width + 30,
          y: isDemon ? groundY - 45 : groundY,
          width: isDemon ? 24 : 20,
          height: isDemon ? 24 : 35,
          type: isDemon ? 'demon' : 'spike',
        });
      }

      // Spawn Mana
      if (frameCount % 50 === 0) {
        manas.push({
          x: canvas.width + 20,
          y: groundY - Math.random() * 80 - 20,
        });
      }

      // Update Spells
      for (let i = spells.length - 1; i >= 0; i--) {
        const spell = spells[i];
        spell.x += 8;

        // Spell hitting demon
        for (let j = hazards.length - 1; j >= 0; j--) {
          const h = hazards[j];
          if (h.type === 'demon' && Math.hypot(spell.x - h.x, spell.y - h.y) < 25) {
            hazards.splice(j, 1);
            spells.splice(i, 1);
            setScore((s) => s + 60);
            break;
          }
        }

        if (spell.x > canvas.width) spells.splice(i, 1);
      }

      // Update Mana
      for (let i = manas.length - 1; i >= 0; i--) {
        const m = manas[i];
        m.x -= speed;

        if (Math.hypot(m.x - runnerX, m.y - runnerY) < 25) {
          manas.splice(i, 1);
          setScore((s) => s + 35);
          continue;
        }

        if (m.x < -20) manas.splice(i, 1);
      }

      // Update Hazards & Check Collision
      for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        h.x -= speed;

        // Collision check with runner
        if (
          runnerX + 20 > h.x &&
          runnerX < h.x + h.width &&
          runnerY + 35 > h.y &&
          runnerY < h.y + h.height
        ) {
          const finalScore = scoreRef.current;
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
          setGameState('GAMEOVER');
          return;
        }

        if (h.x < -40) hazards.splice(i, 1);
      }

      // Render
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, canvas.height - 35, canvas.width, 35);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(0, canvas.height - 35, canvas.width, 3);

      // Draw Runner Mage
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.fillRect(runnerX, runnerY, 20, 35);

      // Mage Hat
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(runnerX - 5, runnerY);
      ctx.lineTo(runnerX + 10, runnerY - 15);
      ctx.lineTo(runnerX + 25, runnerY);
      ctx.closePath();
      ctx.fill();

      // Draw Spells
      spells.forEach((s) => {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Manas
      manas.forEach((m) => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Hazards
      hazards.forEach((h) => {
        if (h.type === 'spike') {
          ctx.fillStyle = '#e11d48';
          ctx.beginPath();
          ctx.moveTo(h.x, h.y + h.height);
          ctx.lineTo(h.x + h.width / 2, h.y);
          ctx.lineTo(h.x + h.width, h.y + h.height);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(h.x + h.width / 2, h.y + h.height / 2, h.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(h.x + 4, h.y + 8, 4, 4);
          ctx.fillRect(h.x + 14, h.y + 8, 4, 4);
        }
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[600px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Mystic Runner</h2>
          <p className="text-xs text-zinc-400">Space / Up / Click to Jump, X to Cast Magic Spell!</p>
        </div>
        <div className="text-lg font-semibold text-purple-300">Score: {score}</div>
      </div>

      <div className="relative border border-purple-900/50 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="bg-zinc-950 block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-purple-400 mb-2">MYSTIC RUNNER</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">Run through the enchanted woods! Jump over crimson spikes, blast shadow demons with spells, and collect mana!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
            >
              Begin Run
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">RUN ENDED</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-purple-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
            >
              Run Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
