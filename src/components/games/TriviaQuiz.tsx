"use client";
import { useState } from "react";

const QUESTIONS = [
  { q: "What is the capital of France?", a: "Paris", choices: ["London","Berlin","Paris","Madrid"] },
  { q: "How many planets are in the Solar System?", a: "8", choices: ["7","8","9","10"] },
  { q: "What is 7 × 8?", a: "56", choices: ["54","56","48","64"] },
  { q: "Who wrote Romeo and Juliet?", a: "Shakespeare", choices: ["Dickens","Shakespeare","Hemingway","Twain"] },
  { q: "What element is H₂O?", a: "Water", choices: ["Oxygen","Hydrogen","Water","Carbon Dioxide"] },
  { q: "Which country invented pizza?", a: "Italy", choices: ["France","Italy","Greece","Spain"] },
  { q: "What year did WW2 end?", a: "1945", choices: ["1943","1944","1945","1946"] },
  { q: "What is the largest ocean?", a: "Pacific", choices: ["Atlantic","Indian","Pacific","Arctic"] },
  { q: "Speed of light (approx)?", a: "300,000 km/s", choices: ["150,000 km/s","300,000 km/s","500,000 km/s","1,000,000 km/s"] },
  { q: "How many sides does a hexagon have?", a: "6", choices: ["5","6","7","8"] },
];

export default function TriviaQuiz() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[idx];

  const choose = (choice: string) => {
    if (answered) return;
    setAnswered(choice);
    if (choice === q.a) setScore(s => s + 10);
    setTimeout(() => {
      if (idx + 1 >= QUESTIONS.length) { setDone(true); return; }
      setIdx(i => i + 1);
      setAnswered(null);
    }, 1000);
  };

  const reset = () => { setIdx(0); setScore(0); setAnswered(null); setDone(false); };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 to-violet-950 gap-8 p-8">
      {done ? (
        <div className="text-center space-y-6">
          <div className="text-6xl">🏆</div>
          <h2 className="text-4xl font-black text-white">Quiz Complete!</h2>
          <p className="text-2xl text-amber-400 font-bold">{score} / {QUESTIONS.length * 10} points</p>
          <button onClick={reset} className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest">Play Again</button>
        </div>
      ) : (
        <>
          <div className="flex justify-between w-full max-w-lg text-white font-black text-sm uppercase tracking-widest">
            <span>Q {idx + 1}/{QUESTIONS.length}</span>
            <span className="text-amber-400">Score: {score}</span>
          </div>
          <div className="w-full max-w-lg h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${((idx) / QUESTIONS.length) * 100}%` }} />
          </div>

          <div className="w-full max-w-lg p-8 bg-zinc-900/80 border border-white/10 rounded-3xl text-center">
            <p className="text-white font-bold text-xl leading-relaxed">{q.q}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
            {q.choices.map(choice => {
              let cls = "bg-zinc-800 border-zinc-700 hover:border-violet-500 hover:bg-violet-600/20 text-white";
              if (answered === choice) cls = choice === q.a ? "bg-emerald-600 border-emerald-500 text-white" : "bg-rose-600 border-rose-500 text-white";
              else if (answered && choice === q.a) cls = "bg-emerald-600/40 border-emerald-500 text-white";
              return (
                <button key={choice} onClick={() => choose(choice)}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 ${cls}`}>
                  {choice}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
