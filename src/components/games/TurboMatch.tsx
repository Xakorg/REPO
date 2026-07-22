'use client';

import React, { useState, useEffect } from 'react';

const SYMBOLS = ['⚡', '💎', '🔥', '🌀', '🌟', '🍀', '🎯', '🚀'];

export default function TurboMatch() {
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');

  const initBoard = () => {
    const deck = [...SYMBOLS, ...SYMBOLS].sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]);
    setMatched([]);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    initBoard();
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameState('gameover');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'gameover') {
      window.dispatchEvent(
        new CustomEvent('xakteir-game-score', { detail: { score: score } })
      );
    }
  }, [gameState, score]);

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing' || flipped.length === 2 || flipped.includes(index) || matched.includes(index)) {
      return;
    }

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [first, second] = nextFlipped;
      if (cards[first] === cards[second]) {
        const nextMatched = [...matched, first, second];
        setMatched(nextMatched);
        setScore((s) => s + 20);
        setTimeLeft((t) => t + 3);
        setFlipped([]);

        if (nextMatched.length === cards.length) {
          // Cleared full board! Re-shuffle & bonus
          setTimeout(() => {
            setScore((s) => s + 50);
            initBoard();
          }, 300);
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 600);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between w-full max-w-[400px] mb-3 items-center">
        <h2 className="text-xl font-bold tracking-wider text-amber-400">TURBO MATCH</h2>
        <div className="flex gap-4 font-mono text-sm">
          <div>Time: <span className="text-red-400 font-bold">{timeLeft}s</span></div>
          <div>Score: <span className="text-yellow-400 font-bold">{score}</span></div>
        </div>
      </div>

      <div className="relative w-full max-w-[360px] aspect-square bg-zinc-900 border-2 border-amber-900 rounded-xl p-3 flex flex-col items-center justify-center">
        <div className="grid grid-cols-4 gap-2 w-full h-full">
          {cards.map((symbol, idx) => {
            const isFlipped = flipped.includes(idx) || matched.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleCardClick(idx)}
                className={`rounded-lg font-bold text-2xl flex items-center justify-center transition-all duration-200 border ${
                  isFlipped
                    ? 'bg-amber-950 border-amber-500 shadow-[0_0_10px_#f59e0b]'
                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {isFlipped ? symbol : '❓'}
              </button>
            );
          })}
        </div>

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 rounded-xl">
            <h1 className="text-2xl font-extrabold mb-2 text-amber-400">TURBO MATCH</h1>
            <p className="text-sm text-zinc-400 mb-6 text-center">Match pairs of icons before time runs out!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 font-bold rounded-lg transition"
            >
              START MATCHING
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 rounded-xl">
            <h2 className="text-2xl font-bold text-red-500 mb-2">TIME'S UP</h2>
            <p className="text-lg text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 font-bold rounded-lg transition"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
