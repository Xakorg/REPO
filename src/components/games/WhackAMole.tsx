"use client";
import { useState, useEffect } from "react";

const MOLES = Array.from({ length: 9 }, (_, i) => i);

export default function WhackAMole() {
  const [active, setActive] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (playing) {
      setHasPlayed(true);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing && timeLeft === 0 && hasPlayed) {
      window.dispatchEvent(new CustomEvent("xakteir-game-score", {
        detail: { score, points: Math.max(1, Math.floor(score / 50)) }
      }));
      setHasPlayed(false);
    }
  }, [playing, timeLeft, score, hasPlayed]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setTimeLeft(t => { if (t <= 1) { setPlaying(false); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!playing) { setActive(new Set()); return; }
    const interval = setInterval(() => {
      setActive(prev => {
        const next = new Set(prev);
        // Random appear/disappear
        const mole = Math.floor(Math.random() * 9);
        if (next.has(mole)) next.delete(mole);
        else { next.add(mole); setTimeout(() => setActive(a => { const n = new Set(a); n.delete(mole); return n; }), 800); }
        return next;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [playing]);

  const handleClick = (i: number) => {
    if (!playing) return;
    if (active.has(i)) {
      setActive(prev => { const next = new Set(prev); next.delete(i); return next; });
      setScore(s => s + 10);
    } else {
      setMisses(m => m + 1);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 to-zinc-950 gap-8">
      <div className="flex gap-10 text-white font-black text-xl uppercase tracking-widest">
        <span>Score: <span className="text-emerald-400">{score}</span></span>
        <span className={timeLeft <= 5 ? "text-rose-500 animate-pulse" : "text-white"}>Time: {timeLeft}s</span>
        <span className="text-zinc-400">Misses: {misses}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {MOLES.map(i => (
          <button key={i} onClick={() => handleClick(i)}
            className={`w-32 h-32 rounded-full border-4 transition-all duration-150 overflow-hidden relative ${
              active.has(i) ? "border-emerald-500 bg-emerald-900 scale-110" : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
            }`}>
            {/* Hole */}
            <div className="absolute inset-0 rounded-full bg-gradient-radial from-zinc-950 to-zinc-800" />
            {/* Mole */}
            <div className={`absolute inset-0 flex items-center justify-center text-5xl transition-transform duration-150 ${active.has(i) ? "translate-y-0" : "translate-y-full"}`}>
              🐹
            </div>
          </button>
        ))}
      </div>

      {!playing && (
        <button onClick={() => { setScore(0); setMisses(0); setTimeLeft(30); setPlaying(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-lg">
          {timeLeft === 0 ? `Game Over! ${score}pts — Play Again` : "Start!"}
        </button>
      )}
    </div>
  );
}
