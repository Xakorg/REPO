"use client";
import { useState } from "react";

const ROWS = 6, COLS = 7;
const empty = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

function checkWin(board: (string | null)[][], player: string) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) count++;
          else break;
        }
        if (count >= 4) return true;
      }
    }
  }
  return false;
}

export default function ConnectFour() {
  const [board, setBoard] = useState(empty());
  const [current, setCurrent] = useState<"R" | "Y">("R");
  const [winner, setWinner] = useState<string | null>(null);

  const drop = (col: number) => {
    if (winner) return;
    const nb = board.map(r => [...r]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!nb[r][col]) {
        nb[r][col] = current;
        setBoard(nb);
        if (checkWin(nb, current)) { setWinner(current); return; }
        setCurrent(current === "R" ? "Y" : "R");
        return;
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-6">
      <div className="text-white font-black text-xl uppercase tracking-widest">
        {winner ? (
          <span className={winner === "R" ? "text-rose-500" : "text-yellow-400"}>
            {winner === "R" ? "🔴 Red Wins!" : "🟡 Yellow Wins!"}
          </span>
        ) : (
          <span>Turn: <span className={current === "R" ? "text-rose-500" : "text-yellow-400"}>{current === "R" ? "🔴 Red" : "🟡 Yellow"}</span></span>
        )}
      </div>

      <div className="bg-blue-700 p-3 rounded-2xl shadow-2xl">
        <div className="flex gap-2 mb-2">
          {Array.from({ length: COLS }).map((_, c) => (
            <button key={c} onClick={() => drop(c)} className="w-12 h-8 rounded hover:bg-white/20 transition-colors text-white text-lg">
              ↓
            </button>
          ))}
        </div>
        {board.map((row, r) => (
          <div key={r} className="flex gap-2 mb-2">
            {row.map((cell, c) => (
              <div key={c} className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center shadow-inner">
                {cell && <div className={`w-10 h-10 rounded-full shadow-lg ${cell === "R" ? "bg-rose-500 shadow-rose-500/50" : "bg-yellow-400 shadow-yellow-400/50"}`} />}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button onClick={() => { setBoard(empty()); setCurrent("R"); setWinner(null); }} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm">
        New Game
      </button>
    </div>
  );
}
