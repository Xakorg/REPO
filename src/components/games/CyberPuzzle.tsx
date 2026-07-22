'use client';

import React, { useState, useEffect } from 'react';

export default function CyberPuzzle() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'showing' | 'playing' | 'gameover'>('start');
  const [activeTile, setActiveTile] = useState<number | null>(null);

  const gridCount = 9;

  const startGame = () => {
    setScore(0);
    const firstTile = Math.floor(Math.random() * gridCount);
    setSequence([firstTile]);
    setUserStep(0);
    setGameState('showing');
  };

  useEffect(() => {
    if (gameState !== 'showing') return;

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < sequence.length) {
        setActiveTile(sequence[idx]);
        setTimeout(() => setActiveTile(null), 400);
        idx++;
      } else {
        clearInterval(interval);
        setGameState('playing');
        setUserStep(0);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [gameState, sequence]);

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;

    setActiveTile(index);
    setTimeout(() => setActiveTile(null), 200);

    if (sequence[userStep] === index) {
      if (userStep + 1 === sequence.length) {
        const nextScore = score + 10;
        setScore(nextScore);
        const nextTile = Math.floor(Math.random() * gridCount);
        setSequence((prev) => [...prev, nextTile]);
        setGameState('showing');
      } else {
        setUserStep((prev) => prev + 1);
      }
    } else {
      setGameState('gameover');
      window.dispatchEvent(
        new CustomEvent('xakteir-game-score', { detail: { score: score } })
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between w-full max-w-[400px] mb-4 items-center">
        <h2 className="text-xl font-bold tracking-wider text-cyan-400">CYBER PUZZLE</h2>
        <div className="text-lg font-mono">Score: <span className="text-yellow-400">{score}</span></div>
      </div>

      <div className="relative w-full max-w-[360px] aspect-square bg-zinc-900 border-2 border-cyan-800 rounded-xl p-4 flex flex-col justify-center items-center">
        <div className="grid grid-cols-3 gap-3 w-full h-full">
          {Array.from({ length: gridCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              className={`rounded-lg transition-all duration-150 border-2 border-cyan-900/60 ${
                activeTile === i
                  ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_20px_#22d3ee]'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 active:scale-95'
              }`}
            />
          ))}
        </div>

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 rounded-xl">
            <h1 className="text-2xl font-extrabold mb-2 text-cyan-400">CYBER MATRIX</h1>
            <p className="text-sm text-zinc-400 mb-6 text-center">Memorize and repeat the cyber node sequence!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-lg transition"
            >
              START SEQUENCE
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 rounded-xl">
            <h2 className="text-2xl font-bold text-red-500 mb-2">SYSTEM FAILURE</h2>
            <p className="text-lg text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 font-bold rounded-lg transition"
            >
              RETRY SYSTEM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
