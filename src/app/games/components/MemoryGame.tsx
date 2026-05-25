"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Trophy, BrainCircuit, Heart, Star, Zap, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = [Sparkles, BrainCircuit, Trophy, Heart, Star, Zap, Ghost];

export function MemoryGame({ onExit }: { onExit: () => void }) {
  const [cards, setCards] = useState<{ id: number, type: number, flipped: boolean, solved: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const initial = [...Array(12).keys()].map(i => ({
      id: i,
      type: Math.floor(i / 2),
      flipped: false,
      solved: false
    })).sort(() => Math.random() - 0.5);
    setCards(initial);
  }, []);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || cards[id].flipped || cards[id].solved) return;

    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]].type === cards[newFlipped[1]].type) {
        setTimeout(() => {
          const solvedCards = cards.map((c, i) => 
            newFlipped.includes(i) ? { ...c, solved: true } : c
          );
          setCards(solvedCards);
          setFlipped([]);
          setScore(s => s + 500);
          if (solvedCards.every(c => c.solved)) setWon(true);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(cards.map((c, i) => 
            newFlipped.includes(i) ? { ...c, flipped: false } : c
          ));
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 animate-in zoom-in-95 duration-500 max-w-2xl w-full">
      <div className="flex justify-between w-full items-center text-foreground">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><BrainCircuit className="w-6 h-6 text-white" /></div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Memory_Match</h2>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-2xl font-black text-primary">{score}</span>
          <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 w-full">
        {cards.map((card, i) => {
          const Icon = ICONS[card.type % ICONS.length];
          return (
            <div 
              key={card.id} 
              onClick={() => handleFlip(i)}
              className={cn(
                "aspect-square rounded-[2rem] cursor-pointer transition-all duration-500 relative",
                (card.flipped || card.solved) ? "[transform:rotateY(180deg)]" : ""
              )}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 bg-primary/20 border-4 border-primary/30 rounded-[2rem] flex items-center justify-center [backface-visibility:hidden]">
                <span className="text-4xl font-black text-primary/40 italic">?</span>
              </div>
              <div className="absolute inset-0 bg-primary border-4 border-white/20 rounded-[2rem] flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <Icon className="w-12 h-12 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {won && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-20 rounded-[4rem]">
          <Trophy className="w-24 h-24 text-amber-400 mb-6 animate-bounce" />
          <h3 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Perfect Match!</h3>
          <Button onClick={onExit} className="mt-10 bg-primary h-16 px-12 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-2xl">Return to Hub</Button>
        </div>
      )}
    </div>
  );
}