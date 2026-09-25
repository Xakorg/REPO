"use client";

import React, { useState } from "react";
import { Gamepad2, Zap, Target, Brain, Dice6, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatGamesBarProps {
  onLaunchGame: (gameType: string) => void;
  channelId?: string;
  serverName?: string;
}

export function ChatGamesBar({ onLaunchGame, channelId, serverName }: ChatGamesBarProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const games = [
    { id: "tictactoe", name: "Tic-Tac-Toe", icon: "✖️⭕", desc: "Classic 2-player", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { id: "rps", name: "Rock-Paper-Scissors", icon: "✊✋✌️", desc: "Quick PvP", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
    { id: "trivia", name: "Trivia", icon: "🧠", desc: "Answer questions", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { id: "wordle", name: "Word Guess", icon: "🔤", desc: "Guess the word", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { id: "dice", name: "Dice Roll", icon: "🎲", desc: "Roll the dice", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  ];

  const handleLaunch = (gameId: string) => {
    if (!channelId || !serverName) {
      toast({ variant: "destructive", title: "Cannot launch", description: "You must be in a channel to play games." });
      return;
    }
    onLaunchGame(gameId);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className={cn(
          "relative transition-all hover:scale-110",
          open ? "bg-primary/20 text-primary" : "text-zinc-400 hover:text-white hover:bg-white/10"
        )}
        title="Launch Mini-Games"
      >
        <Gamepad2 className="w-4 h-4" />
        {open && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-20 left-0 right-0 z-50 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Mini-Games
              </h4>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {games.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleLaunch(game.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95",
                    game.color
                  )}
                >
                  <span className="text-xl">{game.icon}</span>
                  <span className="text-[9px] font-bold text-white/80 leading-tight text-center">{game.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
