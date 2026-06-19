"use client";
import { useState, useEffect } from "react";

export default function ClickSpeed() {
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [best, setBest] = useState(0);

  useEffect(() => {
    if (playing && timeLeft > 0) {
      const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(t);
    } else if (timeLeft === 0 && playing) {
      setPlaying(false);
      setBest(b => Math.max(b, clicks));
    }
  }, [playing, timeLeft, clicks]);

  const cps = timeLeft < 10 ? (clicks / (10 - timeLeft)).toFixed(1) : "0.0";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 to-black gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black text-white uppercase tracking-widest">Click Speed</h1>
        <p className="text-zinc-400 text-sm">Best: <span className="text-emerald-400 font-bold">{best} clicks</span></p>
      </div>

      <div className="flex gap-12 text-center">
        <div>
          <div className="text-6xl font-black text-white">{clicks}</div>
          <div className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Clicks</div>
        </div>
        <div>
          <div className={`text-6xl font-black ${timeLeft <= 3 ? "text-rose-500 animate-pulse" : "text-white"}`}>{timeLeft}</div>
          <div className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Seconds</div>
        </div>
        <div>
          <div className="text-6xl font-black text-cyan-400">{cps}</div>
          <div className="text-xs text-zinc-400 uppercase tracking-widest mt-1">CPS</div>
        </div>
      </div>

      <button
        className={`w-64 h-64 rounded-full text-3xl font-black uppercase tracking-widest shadow-2xl transition-all duration-75 active:scale-95 select-none ${
          playing
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:brightness-110"
            : timeLeft === 0
            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
            : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
        }`}
        onClick={() => {
          if (!playing) { setClicks(0); setTimeLeft(10); setPlaying(true); }
          if (playing) setClicks(c => c + 1);
        }}
      >
        {!playing && timeLeft === 0 ? "Again!" : !playing ? "Start!" : "CLICK!"}
      </button>
    </div>
  );
}
