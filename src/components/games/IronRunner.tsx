'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Hazard {
  id: number;
  x: number;
  type: 'low' | 'high'; // low (jump over) or high (slide under)
  w: number;
  h: number;
}

export default function IronRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    mechY: 380,
    mechVY: 0,
    isJumping: false,
    isSliding: false,
    speed: 6,
    hazards: [] as Hazard[],
    nextHazardId: 1,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      mechY: 380,
      mechVY: 0,
      isJumping: false,
      isSliding: false,
      speed: 6,
      hazards: [],
      nextHazardId: 1,
      spawnTimer: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (st.gameState !== 'PLAYING') return;

      if ((e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') && !st.isJumping) {
        st.isJumping = true;
        st.mechVY = -12;
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && !st.isJumping) {
        st.isSliding = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        stateRef.current.isSliding = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Industrial factory grid background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground Line
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.lineTo(canvas.width, 420);
      ctx.stroke();

      const st = stateRef.current;

      if (st.gameState === 'PLAYING') {
        st.speed += 0.002;
        st.score += Math.floor(st.speed / 3);
        setScore(st.score);

        // Mech Physics
        if (st.isJumping) {
          st.mechY += st.mechVY;
          st.mechVY += 0.6; // Gravity

          if (st.mechY >= 380) {
            st.mechY = 380;
            st.mechVY = 0;
            st.isJumping = false;
          }
        }

        // Spawn Hazards
        st.spawnTimer++;
        if (st.spawnTimer > Math.max(35, 75 - Math.floor(st.speed * 4))) {
          st.spawnTimer = 0;
          const type: 'low' | 'high' = Math.random() > 0.5 ? 'low' : 'high';
          st.hazards.push({
            id: st.nextHazardId++,
            x: 520,
            type,
            w: 30,
            h: type === 'low' ? 40 : 50,
          });
        }

        // Mech Hitbox
        const mechHeight = st.isSliding ? 22 : 40;
        const mechTop = st.mechY - mechHeight;
        const mechX = 80;
        const mechW = 30;

        // Move Hazards
        for (let i = st.hazards.length - 1; i >= 0; i--) {
          const h = st.hazards[i];
          h.x -= st.speed;

          const hY = h.type === 'low' ? 420 - h.h : 420 - 90;

          // AABB Collision test
          if (
            mechX < h.x + h.w &&
            mechX + mechW > h.x &&
            mechTop < hY + h.h &&
            st.mechY > hY
          ) {
            st.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
          }

          if (h.x < -40) {
            st.hazards.splice(i, 1);
          }
        }

        // Draw Hazards
        st.hazards.forEach((h) => {
          const hY = h.type === 'low' ? 420 - h.h : 420 - 90;
          ctx.fillStyle = h.type === 'low' ? '#ef4444' : '#a855f7';
          ctx.shadowColor = h.type === 'low' ? '#f87171' : '#c084fc';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(h.x, hY, h.w, h.h, 6);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw Iron Mech Player
        ctx.fillStyle = '#71717a';
        ctx.shadowColor = '#a1a1aa';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(mechX, mechTop, mechW, mechHeight, 6);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#eab308';
        ctx.fillRect(mechX + 18, mechTop + 8, 10, 6);
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-yellow-500">Iron Runner</h2>
          <p className="text-xs text-zinc-400">Armored Mech Endless Factory Dash!</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-amber-400">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-yellow-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={500} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-yellow-500 mb-2">IRON RUNNER</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Press UP Arrow or Space to jump over red ground hurdles. Hold DOWN Arrow or S to slide under purple overhead barriers!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition shadow-lg shadow-yellow-600/30"
            >
              Deploy Mech
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">SYSTEM FAILURE</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-yellow-500 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition"
            >
              Reboot Mech
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
