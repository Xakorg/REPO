"use client";
import { useState, useEffect, useRef } from "react";

const SEQUENCE_LEN_START = 3;
const COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b"];
const COLOR_NAMES = ["Red", "Blue", "Green", "Yellow"];

export default function MemorySequence() {
  const [seq, setSeq] = useState<number[]>([]);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [phase, setPhase] = useState<"show"|"input"|"idle">("idle");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [failed, setFailed] = useState(false);

  const generateSequence = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 4));

  const startRound = (newSeq: number[]) => {
    setSeq(newSeq);
    setUserSeq([]);
    setPhase("show");
    setFailed(false);
    let i = 0;
    const show = () => {
      if (i >= newSeq.length) { setTimeout(() => setPhase("input"), 500); return; }
      setActiveIdx(null);
      setTimeout(() => {
        setActiveIdx(newSeq[i]);
        i++;
        setTimeout(show, 700);
      }, 300);
    };
    setTimeout(show, 500);
  };

  const handleClick = (idx: number) => {
    if (phase !== "input") return;
    const next = [...userSeq, idx];
    setUserSeq(next);
    setActiveIdx(idx);
    setTimeout(() => setActiveIdx(null), 200);

    if (next[next.length - 1] !== seq[next.length - 1]) {
      setFailed(true);
      setPhase("idle");
      return;
    }

    if (next.length === seq.length) {
      setLevel(l => l + 1);
      setTimeout(() => startRound(generateSequence(SEQUENCE_LEN_START + level)), 800);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white uppercase tracking-widest">Memory Sequence</h1>
        <p className="text-zinc-400 mt-2">Level: <span className="text-emerald-400 font-bold">{level}</span></p>
      </div>

      {phase === "show" && <div className="text-lg text-zinc-400 uppercase tracking-widest animate-pulse">Watch carefully...</div>}
      {phase === "input" && <div className="text-lg text-cyan-400 uppercase tracking-widest">Now repeat it!</div>}
      {failed && <div className="text-rose-500 text-2xl font-black uppercase animate-bounce">Wrong! The sequence was: {seq.map(i => COLOR_NAMES[i]).join(", ")}</div>}

      <div className="grid grid-cols-2 gap-6">
        {COLORS.map((color, i) => (
          <button key={i} onClick={() => handleClick(i)}
            className={`w-40 h-40 rounded-3xl transition-all duration-150 border-4 shadow-xl active:scale-95 ${
              activeIdx === i ? "brightness-200 scale-105 shadow-white" : "brightness-75"
            }`}
            style={{ background: color, borderColor: color, boxShadow: activeIdx === i ? `0 0 40px ${color}` : "none" }}>
          </button>
        ))}
      </div>

      {(phase === "idle" || failed) && (
        <button onClick={() => { setLevel(1); setFailed(false); startRound(generateSequence(SEQUENCE_LEN_START)); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest">
          {failed ? "Try Again" : "Start"}
        </button>
      )}
    </div>
  );
}
