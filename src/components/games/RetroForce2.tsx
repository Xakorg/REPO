'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function RetroForce2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [baseHp, setBaseHp] = useState(100);
  const [energy, setEnergy] = useState(100);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    baseHp: 100,
    energy: 100,
    aliens: [] as { lane: number; x: number; speed: number; hp: number }[],
    lasers: [] as { lane: number; x: number }[],
    frameCount: 0,
  });

  const fireLane = (laneIndex: number) => {
    const state = stateRef.current;
    if (state.gameState !== 'PLAYING') return;
    if (state.energy < 20) return;

    state.energy -= 20;
    setEnergy(state.energy);
    state.lasers.push({ lane: laneIndex, x: 40 });
  };

  const initGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      baseHp: 100,
      energy: 100,
      aliens: [],
      lasers: [],
      frameCount: 0,
    };
    setScore(0);
    setBaseHp(100);
    setEnergy(100);
    setGameState('PLAYING');
  };

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const state = stateRef.current;

      if (state.gameState === 'PLAYING') {
        state.frameCount++;

        // Energy recharge
        if (state.frameCount % 10 === 0 && state.energy < 100) {
          state.energy = Math.min(100, state.energy + 4);
          setEnergy(state.energy);
        }

        // Spawn Aliens
        if (state.frameCount % 45 === 0) {
          const lane = Math.floor(Math.random() * 3);
          state.aliens.push({
            lane,
            x: canvas.width + 10,
            speed: 1.5 + Math.random() * 1.5,
            hp: 1,
          });
        }

        // Update Lasers
        state.lasers.forEach((l) => {
          l.x += 12;
        });

        // Update Aliens & Collisions
        state.aliens.forEach((a) => {
          a.x -= a.speed;

          // Check hit by laser
          state.lasers.forEach((l) => {
            if (l.lane === a.lane && Math.abs(l.x - a.x) < 25) {
              a.hp = 0;
              l.x = canvas.width + 100; // remove laser
              state.score += 25;
              setScore(state.score);
            }
          });

          // Reached Base
          if (a.x <= 40 && a.hp > 0) {
            a.hp = 0;
            state.baseHp = Math.max(0, state.baseHp - 15);
            setBaseHp(state.baseHp);

            if (state.baseHp <= 0) {
              state.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(
                new CustomEvent('xakteir-game-score', { detail: { score: state.score } })
              );
            }
          }
        });

        // Filter active
        state.aliens = state.aliens.filter((a) => a.hp > 0 && a.x > -20);
        state.lasers = state.lasers.filter((l) => l.x < canvas.width);
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Lanes
      const laneH = canvas.height / 3;
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * laneH);
        ctx.lineTo(canvas.width, i * laneH);
        ctx.stroke();
      }

      // Draw Force Base on Left
      ctx.fillStyle = '#3b82f6';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, 0, 35, canvas.height);
      ctx.shadowBlur = 0;

      if (state.gameState === 'PLAYING') {
        // Draw Lasers
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 12;
        state.lasers.forEach((l) => {
          const y = l.lane * laneH + laneH / 2 - 4;
          ctx.fillRect(l.x, y, 30, 8);
        });
        ctx.shadowBlur = 0;

        // Draw Aliens
        state.aliens.forEach((a) => {
          const y = a.lane * laneH + laneH / 2;
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#fb7185';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(a.x, y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold tracking-wider text-blue-400 mb-2">RETRO FORCE 2</h2>

      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="bg-zinc-900 border border-blue-500/30 rounded-lg w-full"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-xl font-bold text-blue-400 mb-2 font-mono">Lane Defense Force</h3>
            <p className="text-zinc-400 text-sm mb-6">Fire energy lasers down the 3 lanes to destroy incoming invaders!</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Start Defense
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-2xl font-bold text-rose-500 mb-2">FORCE BASE BREACHED</h3>
            <p className="text-zinc-300 text-lg mb-1">Defense Score:</p>
            <p className="text-3xl font-extrabold text-blue-400 mb-6">{score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Reboot Base
            </button>
          </div>
        )}
      </div>

      {/* Lane Controls */}
      <div className="grid grid-cols-3 gap-2 w-full mt-3">
        <button
          onClick={() => fireLane(0)}
          disabled={gameState !== 'PLAYING'}
          className="py-2.5 bg-blue-950/60 border border-blue-500/40 hover:bg-blue-900/60 font-bold text-xs rounded-lg transition-all disabled:opacity-50 text-blue-300"
        >
          FIRE LANE 1 (TOP)
        </button>
        <button
          onClick={() => fireLane(1)}
          disabled={gameState !== 'PLAYING'}
          className="py-2.5 bg-blue-950/60 border border-blue-500/40 hover:bg-blue-900/60 font-bold text-xs rounded-lg transition-all disabled:opacity-50 text-blue-300"
        >
          FIRE LANE 2 (MID)
        </button>
        <button
          onClick={() => fireLane(2)}
          disabled={gameState !== 'PLAYING'}
          className="py-2.5 bg-blue-950/60 border border-blue-500/40 hover:bg-blue-900/60 font-bold text-xs rounded-lg transition-all disabled:opacity-50 text-blue-300"
        >
          FIRE LANE 3 (BOT)
        </button>
      </div>

      <div className="flex justify-between w-full mt-3 text-xs font-semibold text-zinc-400">
        <span>Base HP: <span className="text-rose-400">{baseHp}%</span></span>
        <span>Energy: <span className="text-emerald-400">{energy}%</span></span>
        <span>Score: <span className="text-blue-400">{score}</span></span>
      </div>
    </div>
  );
}
