"use client";
import { useState } from "react";

const UPGRADES = [
  { id: "cursor", name: "Auto Clicker", desc: "+1/s", baseCost: 10, cps: 1 },
  { id: "farm", name: "Cookie Farm", desc: "+8/s", baseCost: 100, cps: 8 },
  { id: "factory", name: "Factory", desc: "+47/s", baseCost: 1100, cps: 47 },
  { id: "bank", name: "Bank", desc: "+260/s", baseCost: 12000, cps: 260 },
  { id: "lab", name: "Lab", desc: "+1600/s", baseCost: 130000, cps: 1600 },
];

export default function IdleClicker() {
  const [score, setScore] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [perSec, setPerSec] = useState(0);

  const fmt = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : Math.floor(n).toString();

  const click = () => setScore(s => s + 1 + Math.floor(perSec / 10));

  const buy = (upg: typeof UPGRADES[0]) => {
    const owned = counts[upg.id] || 0;
    const cost = Math.floor(upg.baseCost * Math.pow(1.15, owned));
    if (score >= cost) {
      setScore(s => s - cost);
      setCounts(c => ({ ...c, [upg.id]: (c[upg.id] || 0) + 1 }));
      setPerSec(p => p + upg.cps);
    }
  };

  // Passive income
  useState(() => {
    const interval = setInterval(() => {
      setScore(s => s + perSec / 10);
    }, 100);
    return () => clearInterval(interval);
  });

  return (
    <div className="w-full h-full flex bg-zinc-950 text-white overflow-hidden">
      {/* Left - Cookie */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 border-r border-white/5">
        <div className="text-center">
          <div className="text-5xl font-black">{fmt(score)}</div>
          <div className="text-zinc-400 text-sm mt-1">xak cookies</div>
          <div className="text-emerald-400 text-xs mt-1">{fmt(perSec)} per second</div>
        </div>
        <button
          onClick={click}
          className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-transform text-7xl select-none"
        >
          🍪
        </button>
      </div>

      {/* Right - Upgrades */}
      <div className="w-64 p-4 space-y-3 overflow-y-auto">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Upgrades</h2>
        {UPGRADES.map(upg => {
          const owned = counts[upg.id] || 0;
          const cost = Math.floor(upg.baseCost * Math.pow(1.15, owned));
          const canAfford = score >= cost;
          return (
            <button
              key={upg.id}
              onClick={() => buy(upg)}
              className={`w-full p-3 rounded-xl border text-left transition-all ${canAfford ? "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20" : "border-white/5 bg-white/5 opacity-50"}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{upg.name}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{owned}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">{upg.desc}</div>
              <div className="text-xs text-amber-400 font-bold mt-1">🍪 {fmt(cost)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
