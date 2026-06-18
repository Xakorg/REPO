"use client";
import { useState, useEffect, useRef } from "react";

const WORDS = ["the quick brown fox","jumps over the lazy dog","xakteir is the future","code is poetry and art","practice makes perfect","never stop learning now","build something amazing","every day is a new start"];

export default function TypingTest() {
  const [wordIdx, setWordIdx] = useState(Math.floor(Math.random() * WORDS.length));
  const [typed, setTyped] = useState("");
  const [wpm, setWpm] = useState(0);
  const [acc, setAcc] = useState(100);
  const [done, setDone] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const target = WORDS[wordIdx];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!startTime) setStartTime(Date.now());
    setTyped(val);

    // Accuracy
    let correct = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === target[i]) correct++;
    }
    setAcc(val.length ? Math.round((correct / val.length) * 100) : 100);

    if (val === target) {
      const elapsed = (Date.now() - (startTime || Date.now())) / 1000 / 60;
      const words = target.split(" ").length;
      setWpm(Math.round(words / elapsed));
      setDone(true);
    }
  };

  const reset = () => {
    setWordIdx(Math.floor(Math.random() * WORDS.length));
    setTyped(""); setWpm(0); setAcc(100); setDone(false); setStartTime(null);
    inputRef.current?.focus();
  };

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-8 p-8">
      <h1 className="text-4xl font-black text-white uppercase tracking-widest">Typing Test</h1>

      {!done ? (
        <>
          <div className="w-full max-w-2xl p-6 bg-zinc-900 border border-zinc-700 rounded-2xl font-mono text-xl leading-relaxed">
            {target.split("").map((char, i) => {
              let color = "text-zinc-500";
              if (i < typed.length) color = typed[i] === char ? "text-emerald-400" : "text-rose-500";
              else if (i === typed.length) color = "text-white border-b-2 border-white";
              return <span key={i} className={color}>{char}</span>;
            })}
          </div>
          <input ref={inputRef} value={typed} onChange={handleChange}
            className="w-full max-w-2xl h-14 bg-zinc-800 border border-zinc-600 rounded-xl px-4 text-white font-mono text-lg focus:outline-none focus:border-indigo-500"
            placeholder="Start typing..." spellCheck={false} autoComplete="off" />
          <div className="flex gap-8 text-lg font-black text-white">
            <span>Accuracy: <span className={acc >= 90 ? "text-emerald-400" : "text-rose-500"}>{acc}%</span></span>
          </div>
        </>
      ) : (
        <div className="text-center space-y-6">
          <div className="text-7xl font-black text-white">{wpm} <span className="text-2xl text-zinc-400">WPM</span></div>
          <div className="text-2xl text-emerald-400 font-bold">{acc}% Accuracy</div>
          <div className={`text-lg font-bold ${wpm > 60 ? "text-emerald-400" : wpm > 40 ? "text-amber-400" : "text-zinc-400"}`}>
            {wpm > 80 ? "🚀 Incredible!" : wpm > 60 ? "⚡ Fast Typer!" : wpm > 40 ? "👍 Good Job!" : "💪 Keep Practicing!"}
          </div>
          <button onClick={reset} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest">Try Again</button>
        </div>
      )}
    </div>
  );
}
