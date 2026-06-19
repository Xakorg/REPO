"use client";
import { useState, useEffect } from "react";

const ops = ["+", "-", "×", "÷"];
const genQ = () => {
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * 12) + 1, b = Math.floor(Math.random() * 12) + 1;
  let ans: number;
  if (op === "+") ans = a + b;
  else if (op === "-") { if (a < b) [a, b] = [b, a]; ans = a - b; }
  else if (op === "×") ans = a * b;
  else { b = [1,2,3,4,5,6][Math.floor(Math.random()*6)]; a = b * (Math.floor(Math.random()*9)+1); ans = a / b; }
  const wrongs = new Set<number>();
  while (wrongs.size < 3) wrongs.add(ans + Math.floor(Math.random() * 10) - 5);
  const choices = [...wrongs, ans].sort(() => Math.random() - 0.5);
  return { q: `${a} ${op} ${b}`, ans, choices };
};

export default function MathQuiz() {
  const [q, setQ] = useState(genQ);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!gameOver) {
        setGameOver(true);
        window.dispatchEvent(new CustomEvent("xakteir-game-score", {
          detail: { score, points: Math.max(1, Math.floor(score / 15)) }
        }));
      }
      return;
    }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, q, gameOver, score]);

  const answer = (choice: number) => {
    if (timeLeft <= 0 || gameOver) return;
    if (choice === q.ans) {
      setScore(s => s + 10 + streak * 5);
      setStreak(s => s + 1);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }
    setTimeout(() => { setQ(genQ()); setTimeLeft(20); setFeedback(null); }, 600);
  };

  const restart = () => {
    setScore(0);
    setStreak(0);
    setQ(genQ());
    setTimeLeft(20);
    setGameOver(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 to-indigo-950 gap-8">
      <div className="flex gap-10 text-white font-black text-xl uppercase tracking-widest">
        <span>Score: <span className="text-emerald-400">{score}</span></span>
        <span className={`transition-colors ${timeLeft <= 5 ? "text-rose-500 animate-pulse" : "text-white"}`}>Time: {timeLeft}s</span>
        {streak > 1 && <span className="text-amber-400">🔥 {streak}x Streak!</span>}
      </div>

      {timeLeft <= 0 ? (
        <div className="text-center space-y-6">
          <h2 className="text-5xl font-black text-rose-500 tracking-wider">TIME'S UP!</h2>
          <p className="text-2xl text-zinc-300">Final Score: <span className="text-emerald-400 font-bold">{score}</span></p>
          <button onClick={restart} className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-black tracking-widest uppercase hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className={`flex items-center justify-center w-72 h-36 rounded-3xl border-4 text-7xl font-black text-white transition-colors duration-300 ${
            feedback === "correct" ? "bg-emerald-500/20 border-emerald-500" : feedback === "wrong" ? "bg-rose-500/20 border-rose-500" : "bg-white/5 border-white/10"
          }`}>
            {q.q} = ?
          </div>

          <div className="grid grid-cols-2 gap-4">
            {q.choices.map(c => (
              <button key={c} onClick={() => answer(c)}
                className="w-40 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-2xl font-black transition-all active:scale-95">
                {c}
              </button>
            ))}
          </div>

          <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${timeLeft <= 5 ? "bg-rose-500" : "bg-indigo-500"}`} style={{ width: `${(timeLeft / 20) * 100}%` }} />
          </div>
        </>
      )}
    </div>
  );
}
