"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const WORDS = ["APPLE", "TRAIN", "HOUSE", "MOUSE", "BRICK", "GHOST", "PIZZA", "WATER", "LIGHT", "BRAIN", "SMILE", "NIGHT", "DREAM", "HEART", "MUSIC", "WORLD", "PEACE"];

export default function WordGuess() {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrentGuess("");
    setGameOver(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) {
        if (e.key === "Enter") resetGame();
        return;
      }
      if (e.key === "Enter") {
        submitGuess();
      } else if (e.key === "Backspace") {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess(prev => prev + e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, gameOver]);

  const submitGuess = () => {
    if (currentGuess.length !== WORD_LENGTH) return;
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    if (currentGuess === targetWord) {
      setGameOver(true);
      const wonScore = (MAX_ATTEMPTS - guesses.length) * 100;
      setScore(prev => prev + wonScore);
      window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: score + wonScore } }));
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameOver(true);
      window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score } }));
      setScore(0);
    }
  };

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Enter", "Z", "X", "C", "V", "B", "N", "M", "Backspace"]
  ];

  const getLetterStatus = (letter: string, i: number, guess: string) => {
    if (guess[i] === targetWord[i]) return "correct";
    if (targetWord.includes(guess[i])) return "present";
    return "absent";
  };

  const usedLetters = new Map<string, string>();
  guesses.forEach(guess => {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const char = guess[i];
      const status = getLetterStatus(char, i, guess);
      const existing = usedLetters.get(char);
      if (status === "correct" || (status === "present" && existing !== "correct")) {
        usedLetters.set(char, status);
      } else if (!existing) {
        usedLetters.set(char, status);
      }
    }
  });

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none min-h-[600px] w-full max-w-lg mx-auto">
      <div className="mb-8 text-white text-2xl font-black tracking-widest uppercase flex justify-between w-full">
        <span>WORD GUESS</span>
        <span className="text-primary">Score: {score}</span>
      </div>

      <div className="grid grid-rows-6 gap-2 mb-8">
        {Array.from({ length: MAX_ATTEMPTS }).map((_, rIndex) => {
          const guess = guesses[rIndex];
          const isCurrent = rIndex === guesses.length;
          const text = guess || (isCurrent ? currentGuess : "");

          return (
            <div key={rIndex} className="grid grid-cols-5 gap-2">
              {Array.from({ length: WORD_LENGTH }).map((_, cIndex) => {
                const char = text[cIndex] || "";
                let bgColor = "bg-white/5";
                let borderColor = "border-white/10";
                
                if (guess) {
                  const status = getLetterStatus(char, cIndex, guess);
                  if (status === "correct") bgColor = "bg-green-500", borderColor = "border-green-500";
                  else if (status === "present") bgColor = "bg-yellow-500", borderColor = "border-yellow-500";
                  else bgColor = "bg-zinc-800", borderColor = "border-zinc-800";
                } else if (char) {
                  borderColor = "border-white/30";
                }

                return (
                  <motion.div 
                    key={cIndex}
                    initial={guess ? { rotateX: 90 } : false}
                    animate={guess ? { rotateX: 0 } : {}}
                    transition={{ delay: guess ? cIndex * 0.1 : 0 }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl font-black text-white border-2 rounded-xl uppercase ${bgColor} ${borderColor} transition-colors`}
                  >
                    {char}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      {gameOver && (
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-white mb-2">
            {guesses[guesses.length - 1] === targetWord ? "You Win!" : `Game Over! Word was ${targetWord}`}
          </div>
          <button onClick={resetGame} className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition">
            Play Again
          </button>
        </div>
      )}

      <div className="w-full flex flex-col gap-2">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 sm:gap-2">
            {row.map(key => {
              const status = usedLetters.get(key.toUpperCase());
              let keyBg = "bg-white/10";
              if (status === "correct") keyBg = "bg-green-500";
              else if (status === "present") keyBg = "bg-yellow-500";
              else if (status === "absent") keyBg = "bg-zinc-800 text-white/30";
              
              const isAction = key.length > 1;

              return (
                <button 
                  key={key}
                  onClick={() => {
                    if (key === "Enter") submitGuess();
                    else if (key === "Backspace") setCurrentGuess(p => p.slice(0, -1));
                    else if (currentGuess.length < WORD_LENGTH) setCurrentGuess(p => p + key.toUpperCase());
                  }}
                  className={`${keyBg} hover:bg-white/20 text-white font-bold rounded-lg ${isAction ? 'px-3 text-sm' : 'w-8 sm:w-11 text-lg'} h-14 flex items-center justify-center transition-colors`}
                >
                  {key === "Backspace" ? "⌫" : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
