"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  X,
  Zap,
  Target,
  Brain,
  Dice6,
  Heart,
  Trophy,
  Crown,
  Sword,
  Hand,
  Sparkles,
  ChevronDown,
  Check,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactionPicker } from "@/components/chat/ReactionPicker";

// ─── Types ────────────────────────────────────────────────────────────
interface GameEntry {
  id: string;
  type: "tictactoe" | "rps" | "trivia" | "wordle";
  players: string[];
  currentTurn: number;
  board: string[];
  state: "waiting" | "playing" | "finished";
  winner?: string;
  channelId: string;
  serverName: string;
  createdAt: any;
}

interface TicTacToeState {
  board: (string | null)[];
  turn: "X" | "O";
  players: string[];
  winner?: string;
  draw: boolean;
}

interface RPSState {
  playerChoice: string | null;
  opponentChoice: string | null;
  result: string | null;
  gameOver: boolean;
}

interface TriviaState {
  question: string;
  choices: string[];
  correctAnswer: string;
  selected: string | null;
  answered: boolean;
  score: number;
  questionIndex: number;
  gameOver: boolean;
}

interface WordleState {
  targetWord: string;
  guesses: string[];
  currentGuess: string;
  gameOver: boolean;
  won: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const TRIVIA_QUESTIONS = [
  { q: "What is the capital of France?", choices: ["London", "Berlin", "Paris", "Madrid"], answer: "Paris" },
  { q: "How many planets are in the Solar System?", choices: ["7", "8", "9", "10"], answer: "8" },
  { q: "What is 7 × 8?", choices: ["54", "56", "48", "64"], answer: "56" },
  { q: "Who wrote Romeo and Juliet?", choices: ["Dickens", "Shakespeare", "Hemingway", "Twain"], answer: "Shakespeare" },
  { q: "What element is H₂O?", choices: ["Oxygen", "Hydrogen", "Water", "Carbon Dioxide"], answer: "Water" },
  { q: "Which country invented pizza?", choices: ["France", "Italy", "Greece", "Spain"], answer: "Italy" },
  { q: "What year did WW2 end?", choices: ["1943", "1944", "1945", "1946"], answer: "1945" },
  { q: "What is the largest ocean?", choices: ["Atlantic", "Indian", "Pacific", "Arctic"], answer: "Pacific" },
  { q: "Speed of light (approx)?", choices: ["150,000 km/s", "300,000 km/s", "500,000 km/s", "1,000,000 km/s"], answer: "300,000 km/s" },
  { q: "How many sides does a hexagon have?", choices: ["5", "6", "7", "8"], answer: "6" },
  { q: "What is the smallest prime number?", choices: ["0", "1", "2", "3"], answer: "2" },
  { q: "Which planet is known as the Red Planet?", choices: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
];

const WORDLE_WORDS = [
  "APPLE", "TRAIN", "HOUSE", "MOUSE", "BRICK", "GHOST", "PIZZA",
  "WATER", "LIGHT", "BRAIN", "SMILE", "NIGHT", "DREAM", "HEART",
  "MUSIC", "WORLD", "PEACE", "CHAOS", "FLAME", "STORM", "SNAKE",
  "LUNAR", "FROST", "CLOUD", "SWIFT", "BRAVE", "DRIFT", "FLYER",
];

const RPS_OPTIONS = ["rock", "paper", "scissors"];

// ─── Helper Functions ─────────────────────────────────────────────────
function checkTicTacToeWinner(board: (string | null)[]): { winner: string | null; draw: boolean } {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], draw: false };
    }
  }
  const draw = board.every(Boolean);
  return { winner: draw ? "draw" : null, draw };
}

function selectRPSOpponent(): string {
  return RPS_OPTIONS[Math.floor(Math.random() * RPS_OPTIONS.length)];
}

function getRPSResult(player: string, opponent: string): string {
  if (player === opponent) return "draw";
  if (
    (player === "rock" && opponent === "scissors") ||
    (player === "paper" && opponent === "rock") ||
    (player === "scissors" && opponent === "paper")
  ) return "win";
  return "lose";
}

function getRPSEmoji(choice: string): string {
  return choice === "rock" ? "🪨" : choice === "paper" ? "📄" : "✂️";
}

function getWordleStatus(guess: string, target: string): string[] {
  return guess.split("").map((char, i) => {
    if (char === target[i]) return "correct";
    if (target.includes(char)) return "present";
    return "absent";
  });
}

// ─── MiniGamePanel Component ──────────────────────────────────────────
interface MiniGamePanelProps {
  channelId: string;
  serverName: string;
}

export function MiniGamePanel({ channelId, serverName }: MiniGamePanelProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [launcherOpen, setLauncherOpen] = useState(false);

  // ── Tic-Tac-Toe State ──
  const [tttState, setTttState] = useState<TicTacToeState>({
    board: Array(9).fill(null),
    turn: "X",
    players: [],
  });

  // ── RPS State ──
  const [rpsState, setRpsState] = useState<RPSState>({
    playerChoice: null,
    opponentChoice: null,
    result: null,
    gameOver: false,
  });

  // ── Trivia State ──
  const [triviaState, setTriviaState] = useState<TriviaState>({
    question: "",
    choices: [],
    correctAnswer: "",
    selected: null,
    answered: false,
    score: 0,
    questionIndex: 0,
    gameOver: false,
  });

  // ── Wordle State ──
  const [wordleState, setWordleState] = useState<WordleState>({
    targetWord: "",
    guesses: [],
    currentGuess: "",
    gameOver: false,
    won: false,
  });

  // ── Firestore game collection ref ──
  const gamesRef = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, "games");
  }, [firestore]);

  // ── Load active games from Firestore ──
  const gamesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "games"),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  // ── Initialize trivia when starting ──
  const initTrivia = useCallback(() => {
    const q = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
    setTriviaState({
      question: q.q,
      choices: q.choices,
      correctAnswer: q.answer,
      selected: null,
      answered: false,
      score: 0,
      questionIndex: 0,
      gameOver: false,
    });
  }, []);

  // ── Initialize wordle when starting ──
  const initWordle = useCallback(() => {
    const word = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
    setWordleState({
      targetWord: word,
      guesses: [],
      currentGuess: "",
      gameOver: false,
      won: false,
    });
  }, []);

  // ── Start Game ──
  const startGame = useCallback((type: string) => {
    setActiveGame(type);
    setLauncherOpen(false);

    if (type === "tictactoe") {
      const playerId = user?.uid || "player1";
      setTttState({
        board: Array(9).fill(null),
        turn: "X",
        players: [playerId, "opponent"],
      });
    } else if (type === "rps") {
      setRpsState({ playerChoice: null, opponentChoice: null, result: null, gameOver: false });
    } else if (type === "trivia") {
      initTrivia();
    } else if (type === "wordle") {
      initWordle();
    }

    // Save game to Firestore
    if (gamesRef && user) {
      addDocumentNonBlocking(gamesRef, {
        type,
        players: [user.uid],
        currentTurn: 0,
        board: type === "tictactoe" ? Array(9).fill(null) : [],
        state: "playing",
        channelId,
        serverName,
        createdAt: serverTimestamp(),
      });
    }

    toast({
      title: "Game Started!",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} game launched in ${channelId}`,
    });
  }, [user, firestore, gamesRef, channelId, serverName, toast, initTrivia, initWordle]);

  // ── Tic-Tac-Toe Handler ──
  const tttClick = useCallback((index: number) => {
    if (tttState.board[index] || tttState.winner || tttState.draw) return;
    if (!user) return;

    const nb = [...tttState.board];
    nb[index] = tttState.turn;
    const { winner, draw } = checkTicTacToeWinner(nb);

    const newState: TicTacToeState = {
      board: nb,
      turn: tttState.turn === "X" ? "O" : "X",
      players: tttState.players,
      winner: winner === "draw" ? undefined : (winner || undefined),
      draw,
    };
    setTttState(newState);

    // Save to Firestore
    if (gamesRef && user) {
      addDocumentNonBlocking(collection(firestore, "games"), {
        type: "tictactoe",
        players: tttState.players,
        currentTurn: index,
        board: nb,
        state: winner || draw ? "finished" : "playing",
        winner: winner === "draw" ? undefined : winner || undefined,
        channelId,
        serverName,
        createdAt: serverTimestamp(),
      });
    }

    if (winner || draw) {
      const resultMsg = winner === "draw" ? "It's a draw!" : `${winner} wins!`;
      toast({
        title: "Game Over!",
        description: resultMsg,
      });
    }
  }, [tttState, user, firestore, gamesRef, channelId, serverName, toast]);

  // ── Reset Tic-Tac-Toe ──
  const resetTtt = useCallback(() => {
    setTttState({ board: Array(9).fill(null), turn: "X", players: tttState.players });
  }, [tttState.players]);

  // ── RPS Handler ──
  const rpsPick = useCallback((choice: string) => {
    if (rpsState.gameOver || !user) return;
    const opponent = selectRPSOpponent();
    const result = getRPSResult(choice, opponent);

    setRpsState({ playerChoice: choice, opponentChoice: opponent, result, gameOver: true });

    // Save to Firestore
    if (gamesRef && user) {
      addDocumentNonBlocking(collection(firestore, "games"), {
        type: "rps",
        players: [user.uid],
        currentTurn: 0,
        board: [],
        state: "finished",
        winner: result === "win" ? user.uid : result === "lose" ? undefined : "draw",
        channelId,
        serverName,
        createdAt: serverTimestamp(),
      });
    }

    if (result === "win") {
      toast({ title: "You Win!", description: `${getRPSEmoji(choice)} beats ${getRPSEmoji(opponent)}!` });
    } else if (result === "lose") {
      toast({ title: "You Lose!", description: `${getRPSEmoji(opponent)} beats ${getRPSEmoji(choice)}!` });
    } else {
      toast({ title: "It's a Draw!", description: "Both chose the same!" });
    }
  }, [rpsState.gameOver, user, firestore, gamesRef, channelId, serverName, toast]);

  // ── Reset RPS ──
  const resetRps = useCallback(() => {
    setRpsState({ playerChoice: null, opponentChoice: null, result: null, gameOver: false });
  }, []);

  // ── Trivia Handler ──
  const triviaChoose = useCallback((choice: string) => {
    if (triviaState.answered || triviaState.gameOver || !user) return;
    const isCorrect = choice === triviaState.correctAnswer;

    const newScore = isCorrect ? triviaState.score + 10 : triviaState.score;
    const nextIdx = triviaState.questionIndex + 1;

    if (nextIdx >= TRIVIA_QUESTIONS.length || !isCorrect) {
      setTriviaState(prev => ({
        ...prev,
        selected: choice,
        answered: true,
        score: newScore,
        gameOver: true,
      }));

      // Save to Firestore
      if (gamesRef && user) {
        addDocumentNonBlocking(collection(firestore, "games"), {
          type: "trivia",
          players: [user.uid],
          currentTurn: triviaState.questionIndex,
          board: [],
          state: "finished",
          winner: isCorrect ? user.uid : undefined,
          channelId,
          serverName,
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: isCorrect ? "Correct!" : "Wrong!",
        description: isCorrect ? `+10 points!` : `The answer was ${triviaState.correctAnswer}`,
      });
    } else {
      const nextQ = TRIVIA_QUESTIONS[nextIdx];
      setTriviaState(prev => ({
        ...prev,
        selected: choice,
        answered: true,
        score: newScore,
        questionIndex: nextIdx,
        question: nextQ.q,
        choices: nextQ.choices,
        correctAnswer: nextQ.answer,
      }));
    }
  }, [triviaState, user, firestore, gamesRef, channelId, serverName, toast]);

  // ── Reset Trivia ──
  const resetTrivia = useCallback(() => {
    initTrivia();
  }, [initTrivia]);

  // ── Wordle Handler ──
  const wordleSubmit = useCallback(() => {
    if (wordleState.currentGuess.length !== 5 || wordleState.gameOver || !user) return;
    const guess = wordleState.currentGuess.toUpperCase();
    const newGuesses = [...wordleState.guesses, guess];
    const statuses = getWordleStatus(guess, wordleState.targetWord);

    const won = guess === wordleState.targetWord;
    const lost = newGuesses.length >= 6;

    if (won || lost) {
      setWordleState(prev => ({
        ...prev,
        guesses: newGuesses,
        gameOver: true,
        won,
      }));

      // Save to Firestore
      if (gamesRef && user) {
        addDocumentNonBlocking(collection(firestore, "games"), {
          type: "wordle",
          players: [user.uid],
          currentTurn: newGuesses.length,
          board: [],
          state: "finished",
          winner: won ? user.uid : undefined,
          channelId,
          serverName,
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: won ? "You Won!" : "Game Over!",
        description: won ? `Correct word: ${wordleState.targetWord}` : `The word was ${wordleState.targetWord}`,
      });
    } else {
      setWordleState(prev => ({
        ...prev,
        guesses: newGuesses,
        currentGuess: "",
      }));
    }
  }, [wordleState, user, firestore, gamesRef, channelId, serverName, toast]);

  // ── Wordle Keypress ──
  const wordleKeydown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      wordleSubmit();
    } else if (e.key === "Backspace") {
      setWordleState(prev => ({ ...prev, currentGuess: prev.currentGuess.slice(0, -1) }));
    } else if (/^[a-zA-Z]$/.test(e.key) && wordleState.currentGuess.length < 5) {
      setWordleState(prev => ({ ...prev, currentGuess: prev.currentGuess + e.key.toUpperCase() }));
    }
  }, [wordleState.currentGuess, wordleSubmit]);

  // ── Reset Wordle ──
  const resetWordle = useCallback(() => {
    initWordle();
  }, [initWordle]);

  // ── Close panel ──
  const closePanel = useCallback(() => {
    setActiveGame(null);
    setLauncherOpen(false);
  }, []);

  // ── Render Game Launcher ──
  const gameOptions = [
    { type: "tictactoe", label: "Tic-Tac-Toe", emoji: "❌⭕", icon: Gamepad2, color: "text-cyan-400" },
    { type: "rps", label: "Rock-Paper-Scissors", emoji: "🪨📄✂️", icon: Zap, color: "text-amber-400" },
    { type: "trivia", label: "Trivia Quiz", emoji: "❓", icon: Brain, color: "text-violet-400" },
    { type: "wordle", label: "Wordle Guess", emoji: "🔤", icon: Target, color: "text-emerald-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg mx-auto bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">Mini-Games</h2>
            <p className="text-xs text-zinc-400">{serverName} · {channelId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLauncherOpen(!launcherOpen)}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", launcherOpen && "rotate-180")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={closePanel} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Launcher Dropdown */}
      <AnimatePresence>
        {launcherOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 grid grid-cols-2 gap-3 border-b border-white/10 bg-zinc-950/50">
              {gameOptions.map((game) => (
                <motion.button
                  key={game.type}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => startGame(game.type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-white/20 hover:bg-zinc-800/80 transition-all group"
                >
                  <span className="text-3xl">{game.emoji}</span>
                  <span className={cn("text-sm font-bold", game.color)}>{game.label}</span>
                  <game.icon className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Game Content */}
      <div className="p-4 min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* ── Tic-Tac-Toe ── */}
          {activeGame === "tictactoe" && (
            <motion.div
              key="tictactoe"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                    <Gamepad2 className="w-3 h-3 mr-1" /> Tic-Tac-Toe
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={resetTtt} className="text-zinc-400 hover:text-white">
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </Button>
              </div>

              <div className="text-sm font-bold text-white uppercase tracking-wider">
                {tttState.winner ? (
                  <span className={tttState.winner === "X" ? "text-cyan-400" : "text-rose-500"}>
                    {tttState.winner === "draw" ? "It's a Draw!" : `${tttState.winner} Wins!`} 🎉
                  </span>
                ) : tttState.draw ? (
                  <span className="text-zinc-400">Draw!</span>
                ) : (
                  <span>Turn: <span className={tttState.turn === "X" ? "text-cyan-400" : "text-rose-500"}>{tttState.turn}</span></span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {tttState.board.map((cell, i) => {
                  const winLine = WIN_LINES.find(
                    ([a, b, c]) => tttState.board[a] && tttState.board[a] === tttState.board[b] && tttState.board[a] === tttState.board[c] && tttState.board[a]!.includes(tttState.board[i]!)
                  );
                  const isWinCell = winLine?.includes(i);
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => tttClick(i)}
                      disabled={!!cell || !!tttState.winner || !!tttState.draw}
                      className={cn(
                        "aspect-square rounded-xl text-3xl font-black border-2 flex items-center justify-center transition-all active:scale-95",
                        isWinCell
                          ? "bg-white/20 border-white scale-105"
                          : cell
                          ? "border-zinc-600 bg-zinc-900"
                          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer"
                      )}
                    >
                      <span className={cell === "X" ? "text-cyan-400" : cell === "O" ? "text-rose-500" : ""}>
                        {cell}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-cyan-400 font-black">X</span>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{tttState.turn === "X" ? "◀" : ""}</Badge>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                  <span className="text-rose-500 font-black">O</span>
                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">{tttState.turn === "O" ? "◀" : ""}</Badge>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Rock-Paper-Scissors ── */}
          {activeGame === "rps" && (
            <motion.div
              key="rps"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center justify-between w-full">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  <Zap className="w-3 h-3 mr-1" /> Rock-Paper-Scissors
                </Badge>
                <Button variant="ghost" size="sm" onClick={resetRps} className="text-zinc-400 hover:text-white">
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </Button>
              </div>

              <p className="text-sm text-zinc-400">Choose your weapon!</p>

              {!rpsState.result ? (
                <div className="flex gap-4">
                  {RPS_OPTIONS.map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => rpsPick(option)}
                      className="w-24 h-24 rounded-2xl bg-zinc-900 border-2 border-white/10 hover:border-amber-500/50 flex flex-col items-center justify-center gap-2 transition-all hover:bg-zinc-800"
                    >
                      <span className="text-4xl">{getRPSEmoji(option)}</span>
                      <span className="text-xs font-bold text-zinc-300 uppercase">{option}</span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-5xl mb-2">{getRPSEmoji(rpsState.playerChoice!)}</div>
                      <p className="text-sm font-bold text-cyan-400">You</p>
                    </div>
                    <div className="text-2xl text-zinc-500">vs</div>
                    <div className="text-center">
                      <div className="text-5xl mb-2">{getRPSEmoji(rpsState.opponentChoice!)}</div>
                      <p className="text-sm font-bold text-rose-500">Opponent</p>
                    </div>
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className={cn(
                      "text-2xl font-black uppercase tracking-wider px-6 py-3 rounded-xl",
                      rpsState.result === "win" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                      rpsState.result === "lose" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                      "bg-zinc-800 text-zinc-300 border border-zinc-600"
                    )}
                  >
                    {rpsState.result === "win" ? "🏆 You Win!" : rpsState.result === "lose" ? "💔 You Lose!" : "🤝 It's a Draw!"}
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Trivia ── */}
          {activeGame === "trivia" && (
            <motion.div
              key="trivia"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between w-full">
                <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                  <Brain className="w-3 h-3 mr-1" /> Trivia Quiz
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-400">Score: {triviaState.score}</span>
                  <Button variant="ghost" size="sm" onClick={resetTrivia} className="text-zinc-400 hover:text-white">
                    <RefreshCw className="w-3 h-3 mr-1" /> Reset
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-violet-500 rounded-full"
                  initial={false}
                  animate={{ width: `${((triviaState.questionIndex) / TRIVIA_QUESTIONS.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <Card className="bg-zinc-900/80 border-white/10">
                <CardContent className="p-6">
                  <p className="text-white font-bold text-lg leading-relaxed">{triviaState.question}</p>
                </CardContent>
              </Card>

              {/* Choices */}
              <div className="grid grid-cols-2 gap-3">
                {triviaState.choices.map((choice) => {
                  const isSelected = triviaState.selected === choice;
                  const isCorrect = choice === triviaState.correctAnswer;
                  const isAnswered = triviaState.answered;

                  let cls = "bg-zinc-800 border-zinc-600 hover:border-violet-500/50 hover:bg-violet-600/10 text-white";
                  if (isAnswered) {
                    if (isCorrect) cls = "bg-emerald-600/30 border-emerald-500 text-emerald-300";
                    else if (isSelected && !isCorrect) cls = "bg-rose-600/30 border-rose-500 text-rose-300";
                    else cls = "bg-zinc-800/50 border-zinc-700 text-zinc-500";
                  }

                  return (
                    <motion.button
                      key={choice}
                      whileHover={!isAnswered ? { scale: 1.02 } : {}}
                      whileTap={!isAnswered ? { scale: 0.98 } : {}}
                      onClick={() => triviaChoose(choice)}
                      disabled={isAnswered}
                      className={cn(
                        "p-4 rounded-xl border-2 font-bold text-sm transition-all active:scale-95",
                        cls
                      )}
                    >
                      {choice}
                      {isCorrect && isAnswered && <Check className="w-4 h-4 inline ml-2 text-emerald-400" />}
                      {isSelected && !isCorrect && isAnswered && <XCircle className="w-4 h-4 inline ml-2 text-rose-400" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Game Over */}
              {triviaState.gameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center p-4 bg-zinc-900/80 border border-white/10 rounded-xl"
                >
                  <div className="text-3xl mb-2">
                    {triviaState.score >= 50 ? <Trophy className="w-8 h-8 text-amber-400 mx-auto" /> : <Brain className="w-8 h-8 text-violet-400 mx-auto" />}
                  </div>
                  <p className="text-white font-bold text-xl">
                    {triviaState.score >= 50 ? "Quiz Master!" : "Quiz Complete!"}
                  </p>
                  <p className="text-2xl font-black text-amber-400 mt-2">{triviaState.score} / {TRIVIA_QUESTIONS.length * 10} points</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Wordle ── */}
          {activeGame === "wordle" && (
            <motion.div
              key="wordle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center justify-between w-full">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <Target className="w-3 h-3 mr-1" /> Wordle Guess
                </Badge>
                <Button variant="ghost" size="sm" onClick={resetWordle} className="text-zinc-400 hover:text-white">
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </Button>
              </div>

              {/* Guess grid */}
              <div className="grid grid-rows-6 gap-2">
                {Array.from({ length: 6 }).map((_, rIndex) => {
                  const guess = wordleState.guesses[rIndex];
                  const isCurrent = rIndex === wordleState.guesses.length;
                  const text = guess || (isCurrent ? wordleState.currentGuess : "");

                  return (
                    <div key={rIndex} className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: 5 }).map((_, cIndex) => {
                        const char = text[cIndex] || "";
                        let bg = "bg-white/5";
                        let border = "border-white/10";

                        if (guess) {
                          const statuses = getWordleStatus(guess, wordleState.targetWord);
                          const status = statuses[cIndex];
                          if (status === "correct") { bg = "bg-emerald-500"; border = "border-emerald-500"; }
                          else if (status === "present") { bg = "bg-amber-500"; border = "border-amber-500"; }
                          else { bg = "bg-zinc-800"; border = "border-zinc-700"; }
                        } else if (char) {
                          border = "border-white/30";
                        }

                        return (
                          <motion.div
                            key={cIndex}
                            initial={guess ? { rotateX: 90 } : false}
                            animate={guess ? { rotateX: 0 } : {}}
                            transition={{ delay: guess ? cIndex * 0.08 : 0 }}
                            className={cn(
                              "w-12 h-12 flex items-center justify-center text-xl font-black border-2 rounded-lg uppercase text-white transition-colors",
                              bg, border
                            )}
                          >
                            {char}
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Virtual keyboard */}
              <div className="flex flex-col gap-1.5">
                {["QWERTYUIOP", "ASDFGHJKL", "Enter", "ZXCVBNM", "Backspace"].map((row, i) => {
                  const isAction = row.length > 1;
                  return (
                    <div key={i} className="flex justify-center gap-1">
                      {row.split("").map((key) => {
                        const upperKey = key.toUpperCase();
                        const status = wordleState.guesses.some(g => {
                          const idx = g.indexOf(upperKey);
                          if (idx === -1) return false;
                          const statuses = getWordleStatus(g, wordleState.targetWord);
                          return statuses[idx];
                        });
                        // Simplified letter status
                        let keyBg = "bg-white/10";
                        const letterCount = wordleState.guesses.filter(g => g.includes(upperKey)).length;
                        if (letterCount > 0 && wordleState.guesses.some(g => g[wordleState.guesses.indexOf(g)].includes(upperKey))) {
                          keyBg = "bg-emerald-500/30";
                        }

                        if (isAction) {
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                if (key === "Enter") wordleSubmit();
                                else if (key === "Backspace") setWordleState(prev => ({ ...prev, currentGuess: prev.currentGuess.slice(0, -1) }));
                              }}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded text-sm transition-colors"
                            >
                              {key === "Backspace" ? "⌫" : key}
                            </button>
                          );
                        }

                        return (
                          <button
                            key={key}
                            onClick={() => {
                              if (wordleState.currentGuess.length < 5) {
                                setWordleState(prev => ({ ...prev, currentGuess: prev.currentGuess + key }));
                              }
                            }}
                            className={cn(
                              "w-10 h-10 flex items-center justify-center text-white font-bold rounded text-sm transition-colors",
                              keyBg
                            )}
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Game Over */}
              {wordleState.gameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-2xl font-black text-white">
                    {wordleState.won ? "🎉 You Won!" : `💀 Game Over! Word: ${wordleState.targetWord}`}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Reactions */}
      <div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Results saved to Firestore • Use <span className="text-indigo-400">/game tic-tac-toe</span>, <span className="text-indigo-400">/game rps</span>, <span className="text-indigo-400">/game trivia</span>, <span className="text-indigo-400">/game wordle</span> to play
        </p>
        <ReactionPicker
          onSelect={(emoji) => {
            // Integration with existing reaction system for voting/choice
            if (activeGame === "rps" && !rpsState.gameOver) {
              const choiceMap: Record<string, string> = { "🪨": "rock", "📄": "paper", "✂️": "scissors" };
              if (choiceMap[emoji]) rpsPick(choiceMap[emoji]);
            }
          }}
          quickReactions={["👍", "❤️", "🔥", "🎯"]}
        />
      </div>
    </motion.div>
  );
}

export default MiniGamePanel;
