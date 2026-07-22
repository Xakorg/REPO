'use client';

import React, { useState, useEffect, useRef } from 'react';

const SYMBOLS = ['⚡', '🔥', '💎', '🚀', '🌟', '🍀', '🍎', '👑'];

interface Tile {
  id: number;
  symbol: string;
  matched: boolean;
  flipped: boolean;
}

export default function CrazyLink() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');

  const gameOverHandled = useRef(false);

  const handleGameOver = (finalScore: number) => {
    if (gameOverHandled.current) return;
    gameOverHandled.current = true;
    setGameState('gameover');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  const initGame = () => {
    const deck = [...SYMBOLS, ...SYMBOLS]; // 16 tiles total
    deck.sort(() => Math.random() - 0.5);

    setTiles(
      deck.map((sym, idx) => ({
        id: idx,
        symbol: sym,
        matched: false,
        flipped: false,
      }))
    );
    setSelected([]);
    setScore(0);
    setTimeLeft(60);
    gameOverHandled.current = false;
    setGameState('playing');
  };

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
      handleGameOver(score);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleTileClick = (idx: number) => {
    if (gameState !== 'playing') return;
    if (tiles[idx].matched || tiles[idx].flipped) return;
    if (selected.length === 2) return;

    const newTiles = [...tiles];
    newTiles[idx].flipped = true;
    setTiles(newTiles);

    const newSelected = [...selected, idx];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const [firstIdx, secondIdx] = newSelected;
      if (tiles[firstIdx].symbol === tiles[secondIdx].symbol) {
        // Match!
        setTimeout(() => {
          setTiles((prev) => {
            const updated = [...prev];
            updated[firstIdx].matched = true;
            updated[secondIdx].matched = true;

            const allMatched = updated.every((t) => t.matched);
            if (allMatched) {
              const bonusScore = score + 50 + timeLeft * 5;
              setScore(bonusScore);
              // Restart new round with extra score
              setTimeout(() => {
                const newDeck = [...SYMBOLS, ...SYMBOLS].sort(() => Math.random() - 0.5);
                setTiles(
                  newDeck.map((sym, i) => ({
                    id: i,
                    symbol: sym,
                    matched: false,
                    flipped: false,
                  }))
                );
              }, 500);
            }
            return updated;
          });
          setScore((s) => s + 20);
          setSelected([]);
        }, 400);
      } else {
        // No match -> flip back
        setTimeout(() => {
          setTiles((prev) => {
            const updated = [...prev];
            updated[firstIdx].flipped = false;
            updated[secondIdx].flipped = false;
            return updated;
          });
          setSelected([]);
        }, 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-emerald-400 mb-2 tracking-wider">CRAZY LINK</h1>

      {gameState === 'playing' && (
        <div className="flex justify-between w-80 mb-4 font-bold text-lg">
          <span className="text-emerald-400">Score: {score}</span>
          <span className="text-amber-400">Time: {timeLeft}s</span>
        </div>
      )}

      <div className="relative bg-zinc-900 border-2 border-emerald-500/30 p-6 rounded-xl min-w-[340px] min-h-[340px] flex items-center justify-center">
        {gameState === 'playing' && (
          <div className="grid grid-cols-4 gap-3">
            {tiles.map((tile, idx) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(idx)}
                disabled={tile.matched}
                className={`w-16 h-16 rounded-xl font-bold text-2xl flex items-center justify-center transition-all duration-300 transform active:scale-95 border ${
                  tile.matched
                    ? 'opacity-0 cursor-default'
                    : tile.flipped
                    ? 'bg-emerald-500/20 border-emerald-400 text-white rotate-0'
                    : 'bg-zinc-800 border-zinc-700 hover:border-emerald-500/50 text-transparent'
                }`}
              >
                {tile.flipped || tile.matched ? tile.symbol : '?'}
              </button>
            ))}
          </div>
        )}

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl">
            <p className="text-zinc-300 mb-6 max-w-xs">
              Flip and link matching cosmic symbol tiles before time runs out! Chain fast pairs for maximum score!
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              START MATCHING
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">TIME'S UP!</h2>
            <p className="text-2xl text-emerald-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
