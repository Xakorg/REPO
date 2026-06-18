"use client";
import { useState } from "react";

const EMOJIS = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮"];
const makeCards = () => {
  const pairs = [...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
  return pairs.sort(() => Math.random() - 0.5);
};

export default function MemoryCards() {
  const [cards, setCards] = useState(makeCards);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const flip = (idx: number) => {
    if (picked.length === 2 || cards[idx].flipped || cards[idx].matched) return;
    const next = [...picked, idx];
    const nc = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);
    setCards(nc);
    setPicked(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      if (nc[next[0]].emoji === nc[next[1]].emoji) {
        const matched = nc.map((c, i) => next.includes(i) ? { ...c, matched: true } : c);
        setCards(matched);
        if (matched.every(c => c.matched)) setWon(true);
      } else {
        setTimeout(() => {
          setCards(c => c.map((card, i) => next.includes(i) ? { ...card, flipped: false } : card));
        }, 800);
      }
      setPicked([]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 to-purple-950 gap-6">
      <div className="flex gap-10 text-white font-black text-xl uppercase tracking-widest">
        <span>Moves: <span className="text-purple-400">{moves}</span></span>
        {won && <span className="text-emerald-400 animate-bounce">🎉 All Matched!</span>}
      </div>
      <div className="grid grid-cols-6 gap-2">
        {cards.map((card, i) => (
          <button key={card.id} onClick={() => flip(i)}
            className={`w-14 h-14 rounded-xl text-2xl flex items-center justify-center border-2 transition-all duration-300 ${
              card.flipped || card.matched
                ? "bg-purple-600 border-purple-400 scale-105"
                : "bg-zinc-800 border-zinc-700 hover:border-purple-500 hover:scale-105"
            } ${card.matched ? "opacity-50" : ""}`}>
            {(card.flipped || card.matched) ? card.emoji : "❓"}
          </button>
        ))}
      </div>
      {won && (
        <button onClick={() => { setCards(makeCards()); setMoves(0); setWon(false); }}
          className="bg-purple-500 hover:bg-purple-400 text-white px-8 py-3 rounded-full font-bold uppercase">
          Play Again
        </button>
      )}
    </div>
  );
}
