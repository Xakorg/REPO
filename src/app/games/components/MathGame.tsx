"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MathGame({ onExit }: { onExit: () => void }) {
  const [problem, setProblem] = useState({ a: 0, b: 0 });
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);

  const generateProblem = () => {
    setProblem({
      a: Math.floor(Math.random() * 20) + 1,
      b: Math.floor(Math.random() * 20) + 1
    });
    setAnswer("");
  };

  useEffect(() => {
    generateProblem();
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === problem.a + problem.b) {
      setScore(s => s + 100);
      generateProblem();
    } else {
      setAnswer("");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-md w-full text-foreground relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Math_Quest</h2>
        <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
      </div>

      <div className="text-center space-y-8">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Time Left: {timeLeft}s</p>
        <div className="text-7xl font-black italic text-primary animate-float drop-shadow-2xl">
          {problem.a} + {problem.b}
        </div>
        <form onSubmit={check} className="space-y-6">
          <Input 
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="h-24 text-center text-5xl font-black rounded-3xl bg-secondary/30 border-4 border-white/10 shadow-inner"
            placeholder="?"
          />
          <Button type="submit" className="w-full h-16 bg-primary font-black uppercase tracking-widest text-white rounded-2xl shadow-xl">SUBMIT ANSWER</Button>
        </form>
      </div>

      <div className="text-center pt-4">
        <span className="text-2xl font-black text-primary italic">Score: {score}</span>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-20 rounded-[4rem] animate-in fade-in duration-500">
          <Trophy className="w-24 h-24 text-amber-400 mb-6 animate-bounce" />
          <h3 className="text-6xl font-black text-white uppercase italic tracking-tighter">Time Up!</h3>
          <p className="text-muted-foreground font-bold mt-4 uppercase text-lg">Final Score: {score}</p>
          <Button onClick={() => window.location.reload()} className="mt-10 bg-primary h-20 px-16 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-2xl text-xl">RETRY</Button>
        </div>
      )}
    </div>
  );
}
