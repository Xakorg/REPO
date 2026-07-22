'use client';

import React, { useEffect, useState } from 'react';

interface Ring {
  id: number;
  segments: number; // e.g. 6 positions (0, 60, 120, 180, 240, 300 deg)
  targetAngle: number;
  currentAngle: number;
  color: string;
}

export default function CyberSpin() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [rings, setRings] = useState<Ring[]>([]);

  const colors = ['#00f3ff', '#ff0055', '#a855f7', '#ffe600', '#10b981'];

  const initLevel = (lvl: number) => {
    const numRings = Math.min(3 + Math.floor(lvl / 2), 5);
    const newRings: Ring[] = [];
    for (let i = 0; i < numRings; i++) {
      const segs = 6;
      const target = Math.floor(Math.random() * segs) * (360 / segs);
      let current = Math.floor(Math.random() * segs) * (360 / segs);
      if (current === target) current = (current + 60) % 360;

      newRings.push({
        id: i,
        segments: segs,
        targetAngle: target,
        currentAngle: current,
        color: colors[i % colors.length],
      });
    }
    setRings(newRings);
    setTimeLeft(Math.max(10, 30 - lvl * 2));
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameState('PLAYING');
    initLevel(1);
  };

  const gameOver = (finalScore: number) => {
    setGameState('GAMEOVER');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  // Timer loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          gameOver(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, score]);

  const rotateRing = (index: number) => {
    if (gameState !== 'PLAYING') return;
    setRings((prev) => {
      const updated = [...prev];
      const ring = { ...updated[index] };
      ring.currentAngle = (ring.currentAngle + 360 / ring.segments) % 360;
      updated[index] = ring;

      // Check alignment
      const allAligned = updated.every((r) => r.currentAngle % 360 === r.targetAngle % 360);
      if (allAligned) {
        setTimeout(() => {
          const newScore = score + 100 + level * 25 + timeLeft * 10;
          setScore(newScore);
          const nextLvl = level + 1;
          setLevel(nextLvl);
          initLevel(nextLvl);
        }, 200);
      }

      return updated;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
          CYBER SPIN
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>LEVEL: <strong className="text-white">{level}</strong></span>
          <span>TIME: <strong className={timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}>{timeLeft}s</strong></span>
          <span>SCORE: <strong className="text-yellow-400">{score}</strong></span>
        </div>
      </div>

      <div className="relative w-[320px] h-[320px] bg-zinc-900 rounded-full border-4 border-zinc-800 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        {gameState === 'PLAYING' && (
          <>
            {/* Core */}
            <div className="absolute z-10 w-10 h-10 bg-cyan-400 rounded-full shadow-[0_0_20px_#00f3ff] flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
            </div>

            {/* Target indicators */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            </div>

            {/* Rings */}
            {rings.map((ring, idx) => {
              const radius = 50 + idx * 30; // Radius for ring circle
              return (
                <div
                  key={ring.id}
                  onClick={() => rotateRing(idx)}
                  className="absolute rounded-full cursor-pointer transition-transform duration-200 hover:scale-[1.02] flex items-center justify-center"
                  style={{
                    width: `${radius * 2}px`,
                    height: `${radius * 2}px`,
                    border: `3px dashed ${ring.color}`,
                    boxShadow: `0 0 10px ${ring.color}33`,
                    transform: `rotate(${ring.currentAngle}deg)`,
                  }}
                >
                  {/* Beam slot indicator */}
                  <div
                    className="absolute top-0 w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: ring.color,
                      boxShadow: `0 0 10px ${ring.color}`,
                    }}
                  />
                  {/* Target slot shadow indicator */}
                  <div
                    className="absolute rounded-full border border-white/40"
                    style={{
                      transform: `rotate(${ring.targetAngle - ring.currentAngle}deg) translateY(-${radius}px)`,
                      width: '8px',
                      height: '8px',
                    }}
                  />
                </div>
              );
            })}
          </>
        )}

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-2xl font-bold text-purple-400 mb-2">
              {gameState === 'START' ? 'ALIGN THE CORE' : 'CYBER OVERLOAD'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 max-w-xs leading-relaxed">
              {gameState === 'START'
                ? 'Click rings to rotate them until their energy nodes align at the top position!'
                : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              {gameState === 'START' ? 'START PUZZLE' : 'TRY AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-400">
        Click any ring to rotate it 60 degrees. Align all dots to top!
      </div>
    </div>
  );
}
