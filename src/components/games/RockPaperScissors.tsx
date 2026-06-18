"use client";
import { useState } from "react";

const ITEMS = ["✊","✋","✌️"] as const;
type Item = typeof ITEMS[number];
const names: Record<Item, string> = { "✊": "Rock", "✋": "Paper", "✌️": "Scissors" };
const beats: Record<Item, Item> = { "✊": "✌️", "✋": "✊", "✌️": "✋" };

export default function RockPaperScissors() {
  const [choice, setChoice] = useState<Item | null>(null);
  const [cpu, setCpu] = useState<Item | null>(null);
  const [result, setResult] = useState<"win"|"lose"|"draw"|null>(null);
  const [score, setScore] = useState({ w: 0, l: 0, d: 0 });

  const play = (pick: Item) => {
    const cpuPick = ITEMS[Math.floor(Math.random() * 3)];
    setChoice(pick);
    setCpu(cpuPick);
    let r: "win"|"lose"|"draw";
    if (pick === cpuPick) r = "draw";
    else if (beats[pick] === cpuPick) r = "win";
    else r = "lose";
    setResult(r);
    setScore(s => ({ ...s, [r[0]]: s[r[0] as "w"|"l"|"d"] + 1 }));
  };

  const colors = { win: "text-emerald-400", lose: "text-rose-500", draw: "text-amber-400" };
  const labels = { win: "You Win! 🎉", lose: "You Lose! 💀", draw: "Draw! 🤝" };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 to-purple-950 gap-8">
      <div className="flex gap-8 text-white font-black text-lg uppercase tracking-widest">
        <span className="text-emerald-400">W: {score.w}</span>
        <span className="text-rose-500">L: {score.l}</span>
        <span className="text-amber-400">D: {score.d}</span>
      </div>

      <div className="flex items-center gap-20">
        <div className="text-center space-y-3">
          <div className="text-xs text-zinc-400 uppercase tracking-widest">You</div>
          <div className={`w-32 h-32 flex items-center justify-center text-7xl rounded-2xl border-2 transition-all duration-300 ${choice ? "bg-indigo-600/20 border-indigo-500 scale-110" : "bg-white/5 border-white/10"}`}>
            {choice || "?"}
          </div>
          {choice && <div className="text-white font-bold">{names[choice]}</div>}
        </div>

        <div className={`text-4xl font-black ${result ? colors[result] : "text-zinc-600"}`}>
          {result ? labels[result] : "VS"}
        </div>

        <div className="text-center space-y-3">
          <div className="text-xs text-zinc-400 uppercase tracking-widest">CPU</div>
          <div className={`w-32 h-32 flex items-center justify-center text-7xl rounded-2xl border-2 transition-all duration-300 ${cpu ? "bg-rose-600/20 border-rose-500 scale-110" : "bg-white/5 border-white/10"}`}>
            {cpu || "?"}
          </div>
          {cpu && <div className="text-white font-bold">{names[cpu]}</div>}
        </div>
      </div>

      <div className="flex gap-6">
        {ITEMS.map(item => (
          <button key={item} onClick={() => play(item)}
            className="w-24 h-24 text-5xl rounded-2xl bg-white/10 hover:bg-indigo-600/40 border-2 border-white/10 hover:border-indigo-500 transition-all active:scale-90">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
