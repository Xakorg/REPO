'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Hazard {
  x: number;
  type: 'high' | 'low';
  w: number;
  h: number;
}

interface Rune {
  x: number;
  y: number;
  collected: boolean;
}

export default function MysticRunner2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [mana, setMana] = useState(100);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    mana: 100,
    playerY: 360,
    vy: 0,
    isGrounded: true,
    isSliding: false,
    isShielded: false,
    shieldTimer: 0,
    hazards: [] as Hazard[],
    runes: [] as Rune[],
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      mana: 100,
      playerY: 360,
      vy: 0,
      isGrounded: true,
      isSliding: false,
      isShielded: false,
      shieldTimer: 0,
      hazards: [],
      runes: [],
      spawnTimer: 0,
    };
    setScore(0);
    setMana(100);
    setGameState('PLAYING');
  };

  const jump = () => {
    const state = stateRef.current;
    if (state.gameState === 'PLAYING' && state.isGrounded) {
      state.vy = -12;
      state.isGrounded = false;
      state.isSliding = false;
    }
  };

  const slide = () => {
    const state = stateRef.current;
    if (state.gameState === 'PLAYING' && state.isGrounded) {
      state.isSliding = true;
      setTimeout(() => {
        state.isSliding = false;
      }, 600);
    }
  };

  const activateShield = () => {
    const state = stateRef.current;
    if (state.gameState === 'PLAYING' && state.mana >= 40 && !state.isShielded) {
      state.mana -= 40;
      setMana(state.mana);
      state.isShielded = true;
      state.shieldTimer = 120; // ~2 seconds
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') {
        jump();
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        slide();
      } else if (e.key === 'e' || e.key === 'E') {
        activateShield();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (state.gameState === 'PLAYING') {
        state.score += 1;
        setScore(Math.floor(state.score / 5));

        // Mana regen
        if (state.mana < 100) {
          state.mana = Math.min(100, state.mana + 0.1);
          setMana(Math.floor(state.mana));
        }

        // Shield timer
        if (state.isShielded) {
          state.shieldTimer--;
          if (state.shieldTimer <= 0) {
            state.isShielded = false;
          }
        }

        // Physics
        state.playerY += state.vy;
        if (!state.isGrounded) {
          state.vy += 0.6; // gravity
          if (state.playerY >= 360) {
            state.playerY = 360;
            state.vy = 0;
            state.isGrounded = true;
          }
        }

        // Spawn hazards and runes
        state.spawnTimer++;
        if (state.spawnTimer % 50 === 0) {
          if (Math.random() > 0.4) {
            state.hazards.push({
              x: 420,
              type: Math.random() > 0.5 ? 'low' : 'high',
              w: 25,
              h: 40,
            });
          } else {
            state.runes.push({
              x: 420,
              y: Math.random() > 0.5 ? 320 : 260,
              collected: false,
            });
          }
        }

        // Update hazards
        const playerBox = {
          x: 60,
          y: state.isSliding ? state.playerY + 20 : state.playerY - 40,
          w: 30,
          h: state.isSliding ? 20 : 40,
        };

        for (let i = state.hazards.length - 1; i >= 0; i--) {
          const h = state.hazards[i];
          h.x -= 6;
          if (h.x < -40) {
            state.hazards.splice(i, 1);
            continue;
          }

          const hY = h.type === 'low' ? 360 : 300;
          if (
            playerBox.x < h.x + h.w &&
            playerBox.x + playerBox.w > h.x &&
            playerBox.y < hY + h.h &&
            playerBox.y + playerBox.h > hY
          ) {
            if (state.isShielded) {
              state.hazards.splice(i, 1);
            } else {
              state.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              const finalScore = Math.floor(state.score / 5);
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
            }
          }
        }

        // Update runes
        for (let i = state.runes.length - 1; i >= 0; i--) {
          const r = state.runes[i];
          r.x -= 6;
          if (r.x < -30) {
            state.runes.splice(i, 1);
            continue;
          }

          if (!r.collected && Math.hypot(r.x - playerBox.x, r.y - playerBox.y) < 30) {
            r.collected = true;
            state.score += 200;
            state.mana = Math.min(100, state.mana + 20);
          }
        }
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 480);

      // Floor
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 400, 400, 80);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 400, 400, 2);

      if (state.gameState === 'PLAYING') {
        // Runes
        state.runes.forEach((r) => {
          if (!r.collected) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#c084fc';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#c084fc';
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // Hazards
        state.hazards.forEach((h) => {
          const hY = h.type === 'low' ? 360 : 300;
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(h.x, hY, h.w, h.h);
        });

        // Player runner
        ctx.fillStyle = '#818cf8';
        if (state.isShielded) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#38bdf8';
        }

        if (state.isSliding) {
          ctx.fillRect(60, state.playerY + 20, 35, 20);
        } else {
          ctx.fillRect(60, state.playerY - 40, 30, 40);
        }
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-[400px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-indigo-400">Mystic Runner 2</h2>
          <p className="text-xs text-zinc-400">Endless mystical ruin runner</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-indigo-300">Score: {score}</div>
          <div className="text-xs text-purple-400">Mana: {mana}%</div>
        </div>
      </div>

      <div className="relative border border-indigo-900/50 rounded-xl overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={400} height={480} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-indigo-400 mb-2">MYSTIC RUNNER 2</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Jump (Up / Space) over low obstacles, Slide (Down) under high traps, and activate Mystic Shield (E) to absorb hits!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
            >
              Start Run
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-rose-500 mb-2">RUN ENDED</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Distance Score: <span className="text-indigo-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {gameState === 'PLAYING' && (
        <div className="flex gap-2 mt-3 w-[400px]">
          <button
            onClick={jump}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-indigo-600 font-bold rounded-lg text-xs"
          >
            ⬆️ JUMP
          </button>
          <button
            onClick={slide}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-indigo-600 font-bold rounded-lg text-xs"
          >
            ⬇️ SLIDE
          </button>
          <button
            onClick={activateShield}
            disabled={mana < 40}
            className={`flex-1 py-2 font-bold rounded-lg text-xs ${
              mana >= 40 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            🛡️ SHIELD (40)
          </button>
        </div>
      )}
    </div>
  );
}
