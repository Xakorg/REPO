"use client";

import React, { useEffect, useState } from "react";

export default function UltimatePuzzle() {
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [score, setScore] = useState(0);

  const initGame = () => {
    // Generate solved array
    let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
    // Shuffle with valid moves to guarantee solvable puzzle
    let emptyIndex = 15;
    for (let i = 0; i < 200; i++) {
      const validMoves: number[] = [];
      const row = Math.floor(emptyIndex / 4);
      const col = emptyIndex % 4;

      if (row > 0) validMoves.push(emptyIndex - 4);
      if (row < 3) validMoves.push(emptyIndex + 4);
      if (col > 0) validMoves.push(emptyIndex - 1);
      if (col < 3) validMoves.push(emptyIndex + 1);

      const target = validMoves[Math.floor(Math.random() * validMoves.length)];
      [arr[emptyIndex], arr[target]] = [arr[target], arr[emptyIndex]];
      emptyIndex = target;
    }

    setBoard(arr);
    setMoves(0);
    setTimer(0);
    setIsPlaying(true);
    setIsWon(false);
    setScore(0);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isWon) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isWon]);

  const handleTileClick = (index: number) => {
    if (!isPlaying || isWon) return;

    const emptyIndex = board.indexOf(0);
    const row = Math.floor(index / 4);
    const col = index % 4;
    const emptyRow = Math.floor(emptyIndex / 4);
    const emptyCol = emptyIndex % 4;

    const isAdjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newBoard = [...board];
      [newBoard[index], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[index]];
      setBoard(newBoard);
      const newMoves = moves + 1;
      setMoves(newMoves);

      // Check solved
      const solved = newBoard.every((val, idx) => (idx === 15 ? val === 0 : val === idx + 1));
      if (solved) {
        setIsWon(true);
        setIsPlaying(false);
        const finalScore = Math.max(100, 10000 - newMoves * 50 - timer * 20);
        setScore(finalScore);
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: finalScore } }));
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-indigo-400 mb-2 uppercase tracking-wider">
        Ultimate Puzzle
      </h1>
      <div className="flex gap-8 mb-6 font-semibold text-zinc-300">
        <div>Moves: <span className="text-indigo-400 font-bold">{moves}</span></div>
        <div>Time: <span className="text-emerald-400 font-bold">{timer}s</span></div>
        {isWon && <div>Score: <span className="text-amber-400 font-bold">{score}</span></div>}
      </div>

      <div className="relative p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-4 gap-2 w-80 h-80">
          {board.map((num, idx) => (
            <button
              key={idx}
              onClick={() => handleTileClick(idx)}
              disabled={!isPlaying || num === 0}
              className={`flex items-center justify-center text-2xl font-black rounded-xl transition-all duration-150 select-none ${
                num === 0
                  ? "bg-zinc-950 border border-dashed border-zinc-800"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95"
              }`}
            >
              {num !== 0 ? num : ""}
            </button>
          ))}
        </div>

        {(!isPlaying || isWon) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {isWon ? "Puzzle Solved!" : "Slide to Order 1-15"}
            </h2>
            {isWon && <p className="text-amber-400 font-bold text-lg">Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold uppercase tracking-wider transition"
            >
              {isWon ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
