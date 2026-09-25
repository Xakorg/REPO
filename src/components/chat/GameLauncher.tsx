"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Target, Brain, Dice6, Crown, Trophy, Heart, Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, orderBy, serverTimestamp, addDoc, doc, updateDoc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GameLauncherProps {
  gameType: string;
  channelId: string;
  serverName: string;
  onClose: () => void;
}

export function GameLauncher({ gameType, channelId, serverName, onClose }: GameLauncherProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [gameId, setGameId] = useState<string>("");
  const [gameState, setGameState] = useState<any>(null);
  const [turn, setTurn] = useState(0);

  // Fetch or create the game
  const gamesQuery = useMemoFirebase(() => {
    if (!firestore || !channelId) return null;
    return query(
      collection(firestore, "games"),
      where("channelId", "==", channelId),
      where("type", "==", gameType),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  }, [firestore, channelId, gameType]);
  const { data: existingGames } = useCollection(gamesQuery);

  const activeGame = existingGames?.[0];

  useEffect(() => {
    if (activeGame) {
      setGameId(activeGame.id);
      setGameState(activeGame.state);
      setTurn(activeGame.currentTurn || 0);
    } else if (user) {
      // Create a new game
      createGame();
    }
  }, [activeGame, user]);

  const createGame = async () => {
    if (!firestore || !user) return;
    const newGameId = `${gameType}_${Date.now()}`;
    const gameData: any = {
      id: newGameId,
      type: gameType,
      channelId,
      serverName,
      players: [user.uid],
      createdAt: serverTimestamp(),
    };

    switch (gameType) {
      case "tictactoe":
        gameData.state = Array(9).fill(null);
        gameData.currentTurn = "X";
        gameData.gameOver = false;
        break;
      case "rps":
        gameData.state = { playerChoice: null, botChoice: null, result: null };
        break;
      case "trivia":
        gameData.state = { question: "", options: [], currentQuestion: 0, score: 0, totalQuestions: 5 };
        gameData.currentTurn = 0;
        break;
      case "wordle":
        gameData.state = { word: "", guesses: [], currentGuess: "", attemptsLeft: 6 };
        break;
      case "dice":
        gameData.state = { lastRoll: null, totalRolls: 0 };
        break;
    }

    await addDoc(collection(firestore, "games"), { ...gameData, status: "active" });
    setGameId(newGameId);
    setGameState(gameData.state);
  };

  const makeMove = async (move: any) => {
    if (!firestore || !gameId || !user) return;
    try {
      const gameRef = doc(firestore, "games", gameId);
      
      switch (gameType) {
        case "tictactoe": {
          const newState = [...gameState];
          if (newState[move] !== null || gameState.gameOver) return;
          newState[move] = gameState.currentTurn;
          const winner = checkTicTacToeWinner(newState);
          const nextTurn = gameState.currentTurn === "X" ? "O" : "X";
          await updateDoc(gameRef, { state: newState, currentTurn: nextTurn, gameOver: !!winner, winner: winner || null });
          setGameState({ ...gameState, ...newState });
          if (winner) toast({ title: `🎉 ${winner} wins!` });
          else if (!newState.includes(null)) toast({ title: "It's a draw!" });
          break;
        }
        case "rps": {
          const choices = ["rock", "paper", "scissors"];
          const botChoice = choices[Math.floor(Math.random() * 3)];
          const result = getRPSResult(move, botChoice);
          await updateDoc(gameRef, { state: { playerChoice: move, botChoice, result } });
          toast({ title: result === "win" ? "You win! 🎉" : result === "lose" ? "You lost!" : "It's a tie!" });
          onClose();
          break;
        }
        case "dice": {
          const roll = Math.floor(Math.random() * 6) + 1;
          await updateDoc(gameRef, { state: { lastRoll: roll, totalRolls: (gameState.totalRolls || 0) + 1 } });
          toast({ title: `🎲 You rolled a ${roll}!` });
          setGameState({ ...gameState, lastRoll: roll, totalRolls: (gameState.totalRolls || 0) + 1 });
          break;
        }
      }
    } catch (e) {
      console.error("Game move error:", e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="bg-[#0a0a15] border border-white/10 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl flex flex-col items-center gap-4"
      >
        <div className="flex items-center justify-between w-full">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> {gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* Game Content */}
        <div className="flex-1 flex items-center justify-center w-full">
          {gameType === "tictactoe" && (
            <div className="grid grid-cols-3 gap-2">
              {gameState.map((cell: string | null, i: number) => (
                <button
                  key={i}
                  onClick={() => makeMove(i)}
                  disabled={cell !== null || gameState.gameOver}
                  className="w-20 h-20 rounded-xl bg-white/5 border-2 border-white/10 text-2xl font-black flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  {cell === "X" ? "✖" : cell === "O" ? "⭕" : ""}
                </button>
              ))}
            </div>
          )}

          {gameType === "rps" && (
            <div className="flex gap-4">
              {["rock", "paper", "scissors"].map(choice => (
                <button
                  key={choice}
                  onClick={() => makeMove(choice)}
                  className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors text-white capitalize"
                >
                  <span className="text-3xl">{choice === "rock" ? "🪨" : choice === "paper" ? "📄" : "✂️"}</span>
                  <span className="text-xs font-bold">{choice}</span>
                </button>
              ))}
            </div>
          )}

          {gameType === "dice" && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎲</div>
              <p className="text-4xl font-black text-primary mb-2">{gameState.lastRoll || "?"}</p>
              <p className="text-sm text-zinc-400">Total rolls: {gameState.totalRolls || 0}</p>
              <Button onClick={() => makeMove(null)} className="mt-4 bg-primary text-black font-black uppercase">
                Roll Again
              </Button>
            </div>
          )}

          {gameType === "trivia" && (
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-primary/20 text-primary">Question {gameState.currentQuestion + 1}/{gameState.totalQuestions}</Badge>
              <p className="text-lg font-bold text-white text-center">What is the capital of France?</p>
              <div className="grid grid-cols-2 gap-2">
                {["London", "Berlin", "Paris", "Madrid"].map((opt, i) => (
                  <Button key={i} variant="outline" onClick={() => { makeMove(i); }} className="font-bold border-white/10">
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {gameType === "wordle" && (
            <div className="space-y-4 text-center">
              <p className="text-lg font-bold text-white">Guess the 5-letter word!</p>
              <p className="text-sm text-zinc-400">Attempts remaining: {gameState.attemptsLeft || 6}</p>
              <div className="flex gap-2 justify-center">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg border-2 border-white/20 flex items-center justify-center font-black text-xl">
                    {(gameState.currentGuess || "")[i] || ""}
                  </div>
                ))}
              </div>
              <Input placeholder="Enter 5-letter word" className="bg-white/5 border-white/10 text-white" maxLength={5} />
              <Button onClick={() => toast({ title: "Word submitted!" })} className="bg-primary text-black font-black uppercase">Submit</Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Play with anyone in this channel</span>
          <span className="flex items-center gap-1"><Crown className="w-3 h-3" /> Earn credits for winning</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function checkTicTacToeWinner(board: (string | null)[]) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function getRPSResult(player: string, bot: string): string {
  if (player === bot) return "tie";
  if ((player === "rock" && bot === "scissors") || (player === "paper" && bot === "rock") || (player === "scissors" && bot === "paper")) return "win";
  return "lose";
}
