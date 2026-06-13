"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Star, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function TicTacToeGame({ onExit }: { onExit: () => void }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const calculateWinner = (squares: any[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return squares.every(s => s) ? 'Draw' : null;
  };

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const newBoard = [...board];
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  useEffect(() => {
    setWinner(calculateWinner(board));
  }, [board]);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 animate-in zoom-in-95 duration-500 max-w-md w-full relative">
      <div className="flex justify-between w-full items-center text-foreground">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Star className="w-6 h-6 text-white" /></div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Magic_Toe</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><XCircle className="w-8 h-8" /></Button>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full aspect-square">
        {board.map((square, i) => (
          <div 
            key={i}
            onClick={() => handleClick(i)}
            className={cn(
              "bg-secondary/30 rounded-[2rem] border-4 border-white/10 flex items-center justify-center text-6xl font-black cursor-pointer transition-all hover:bg-primary/10 hover:border-primary/20 hover:scale-105 active:scale-95 shadow-lg",
              square === 'X' ? "text-primary" : "text-amber-500"
            )}
          >
            {square}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6">
        {winner ? (
          <div className="text-center animate-bounce">
            <p className="text-4xl font-black uppercase text-primary italic tracking-tighter">{winner === 'Draw' ? "It's a Tie!" : `${winner} Wins!`}</p>
          </div>
        ) : (
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Next Vibe: <span className={isXNext ? "text-primary" : "text-amber-500"}>{isXNext ? 'X' : 'O'}</span></p>
        )}
        <Button onClick={() => { setBoard(Array(9).fill(null)); setIsXNext(true); setWinner(null); }} className="bg-secondary hover:bg-secondary/80 h-16 px-12 rounded-[1.8rem] font-black uppercase tracking-widest text-foreground flex items-center gap-4 shadow-xl border-4 border-white/5">
          <RotateCcw className="w-6 h-6" /> Reset Game
        </Button>
      </div>
    </div>
  );
}