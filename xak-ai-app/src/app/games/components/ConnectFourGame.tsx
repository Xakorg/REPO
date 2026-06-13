"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Hash, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConnectFourGame({ onExit }: { onExit: () => void }) {
  const [board, setBoard] = useState(Array(6).fill(null).map(() => Array(7).fill(null)));
  const [isRedNext, setIsRedNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const dropDisc = (col: number) => {
    if (winner) return;
    const nextBoard = [...board];
    for (let row = 5; row >= 0; row--) {
      if (!nextBoard[row][col]) {
        nextBoard[row][col] = isRedNext ? 'Red' : 'Yellow';
        setBoard(nextBoard);
        setIsRedNext(!isRedNext);
        checkWinner(nextBoard);
        return;
      }
    }
  };

  const checkWinner = (b: any[][]) => {
    // Simplified winner check (Horizontal only for demo, expand logic as needed)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] && b[r][c] === b[r][c+1] && b[r][c] === b[r][c+2] && b[r][c] === b[r][c+3]) {
          setWinner(b[r][c]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-purple-500/30 bg-background/90 max-w-2xl w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Four_Nodes</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="bg-blue-600 p-6 rounded-[2rem] shadow-2xl">
        <div className="grid grid-cols-7 gap-4">
          {board[0].map((_, col) => (
            <button key={col} onClick={() => dropDisc(col)} className="h-4 w-12 bg-white/20 rounded-full mb-2 hover:bg-white/40" />
          ))}
          {board.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} className={cn(
              "w-12 h-12 rounded-full border-4 border-black/20",
              cell === 'Red' ? "bg-rose-500" : cell === 'Yellow' ? "bg-amber-400" : "bg-blue-900"
            )} />
          )))}
        </div>
      </div>
      <div className="flex items-center gap-8">
        {winner ? <h3 className="text-2xl font-black uppercase text-primary animate-bounce">{winner} Wins!</h3> : 
          <p className="font-bold uppercase tracking-widest">Turn: <span className={isRedNext ? "text-rose-500" : "text-amber-400"}>{isRedNext ? 'Red' : 'Yellow'}</span></p>}
        <Button onClick={() => window.location.reload()} size="icon" variant="ghost"><RotateCcw /></Button>
      </div>
    </div>
  );
}
