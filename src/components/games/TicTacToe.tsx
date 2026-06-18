"use client";
import { useState } from "react";

type Player = "X" | "O";
const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

const checkWinner = (b: (Player|null)[]) => WIN_LINES.find(([a,c,d]) => b[a] && b[a] === b[c] && b[a] === b[d]);

export default function TicTacToe() {
  const [board, setBoard] = useState<(Player|null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>("X");
  const [score, setScore] = useState({ X: 0, O: 0, D: 0 });

  const winLine = checkWinner(board);
  const winner = winLine ? board[winLine[0]] : null;
  const draw = !winner && board.every(Boolean);

  const click = (i: number) => {
    if (board[i] || winner || draw) return;
    const nb = [...board]; nb[i] = turn;
    setBoard(nb);
    const wl = checkWinner(nb);
    if (wl) { setScore(s => ({ ...s, [turn]: s[turn] + 1 })); }
    else if (nb.every(Boolean)) { setScore(s => ({ ...s, D: s.D + 1 })); }
    else setTurn(t => t === "X" ? "O" : "X");
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-8">
      <div className="flex gap-12 text-white font-black text-2xl uppercase tracking-widest">
        <span className="text-cyan-400">X: {score.X}</span>
        <span className="text-zinc-400">D: {score.D}</span>
        <span className="text-rose-500">O: {score.O}</span>
      </div>

      <div className="text-lg font-bold text-white uppercase tracking-widest">
        {winner ? <span className={winner === "X" ? "text-cyan-400" : "text-rose-500"}>{winner} wins! 🎉</span>
          : draw ? <span className="text-zinc-400">Draw!</span>
          : <span>Turn: <span className={turn === "X" ? "text-cyan-400" : "text-rose-500"}>{turn}</span></span>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {board.map((cell, i) => {
          const isWin = winLine?.includes(i);
          return (
            <button key={i} onClick={() => click(i)}
              className={`w-28 h-28 rounded-2xl text-5xl font-black border-2 flex items-center justify-center transition-all active:scale-95 ${
                isWin ? "border-white bg-white/20 scale-105" : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500"
              }`}>
              {cell && <span className={cell === "X" ? "text-cyan-400" : "text-rose-500"}>{cell}</span>}
            </button>
          );
        })}
      </div>

      {(winner || draw) && (
        <button onClick={() => { setBoard(Array(9).fill(null)); setTurn("X"); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest">
          Next Round
        </button>
      )}
    </div>
  );
}
