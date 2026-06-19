"use client";
import { useState, useEffect } from "react";

const COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#a855f7","#ec4899"];
const genCards = () => {
  const pairs = [...COLORS, ...COLORS].map((c, i) => ({ id: i, color: c, flipped: false, matched: false }));
  return pairs.sort(() => Math.random() - 0.5);
};

export default function ColorMatch() {
  const [cards, setCards] = useState(genCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const flip = (idx: number) => {
    if (selected.length === 2 || cards[idx].flipped || cards[idx].matched) return;
    const next = [...selected, idx];
    setCards(c => c.map((card, i) => i === idx ? { ...card, flipped: true } : card));
    setSelected(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = next;
      if (cards[a].color === cards[b].color) {
        setCards(c => c.map((card, i) => (i === a || i === b) ? { ...card, matched: true } : card));
        setSelected([]);
        if (cards.every((card, i) => card.matched || i === a || i === b)) setWon(true);
      } else {
        setTimeout(() => {
          setCards(c => c.map((card, i) => (i === a || i === b) ? { ...card, flipped: false } : card));
          setSelected([]);
        }, 800);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-8">
      <div className="flex gap-8 text-white font-black text-xl uppercase tracking-widest">
        <span>Moves: <span className="text-cyan-400">{moves}</span></span>
        {won && <span className="text-emerald-400 animate-bounce">You Win! 🎉</span>}
      </div>
      <div className="grid grid-cols-6 gap-3">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => flip(i)}
            className={`w-16 h-16 rounded-xl border-2 transition-all duration-300 ${
              card.flipped || card.matched
                ? "border-white/20 scale-105"
                : "border-white/10 bg-zinc-800 hover:bg-zinc-700"
            } ${card.matched ? "opacity-40" : ""}`}
            style={{ background: card.flipped || card.matched ? card.color : undefined }}
          />
        ))}
      </div>
      {won && (
        <button onClick={() => { setCards(genCards()); setMoves(0); setWon(false); }} className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest">
          Play Again
        </button>
      )}
    </div>
  );
}
