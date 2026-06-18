"use client";
import { useState, useEffect } from "react";

export default function ReactionTime() {
  const [state, setState] = useState<"idle"|"waiting"|"ready"|"done">("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Need to import useRef:
  const { useRef } = require("react");
  const tRef = useRef<any>(null);

  const start = () => {
    if (state === "ready") {
      // Too early!
      setState("idle");
      if (tRef.current) clearTimeout(tRef.current);
      return;
    }
    setState("waiting");
    const delay = 1000 + Math.random() * 4000;
    tRef.current = setTimeout(() => { setState("ready"); setStartTime(Date.now()); }, delay);
  };

  const click = () => {
    if (state === "waiting") { setState("idle"); if (tRef.current) clearTimeout(tRef.current); return; }
    if (state === "ready") {
      const rt = Date.now() - startTime;
      setTimes(t => [...t.slice(-4), rt]);
      setState("done");
    } else {
      start();
    }
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b) / times.length) : 0;

  const bgColor = state === "waiting" ? "bg-rose-600" : state === "ready" ? "bg-emerald-500" : "bg-zinc-800";
  const msg = state === "idle" ? "Click to Start" : state === "waiting" ? "Wait..." : state === "ready" ? "CLICK NOW!" : `${times[times.length - 1]}ms — Click again`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white uppercase tracking-widest mb-2">Reaction Time</h1>
        {times.length > 0 && <p className="text-zinc-400">Avg: <span className="text-cyan-400 font-bold">{avg}ms</span></p>}
      </div>

      <button onClick={click}
        className={`w-80 h-64 rounded-3xl ${bgColor} transition-colors duration-100 text-white font-black text-3xl uppercase tracking-widest shadow-2xl active:scale-95 select-none`}>
        {msg}
      </button>

      {times.length > 0 && (
        <div className="flex gap-3">
          {times.map((t, i) => (
            <div key={i} className={`px-4 py-2 rounded-xl text-white font-black text-sm border-2 ${
              t < 200 ? "border-emerald-500 bg-emerald-500/10" : t < 350 ? "border-cyan-500 bg-cyan-500/10" : "border-red-500 bg-red-500/10"
            }`}>{t}ms</div>
          ))}
        </div>
      )}
    </div>
  );
}
