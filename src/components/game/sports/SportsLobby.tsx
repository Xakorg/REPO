"use client";

import { Play, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SportsLobbyProps {
  setGameState: (state: "lobby" | "playing") => void;
  gameMode: string;
  setGameMode: (mode: string) => void;
}

export function SportsLobby({ setGameState, gameMode, setGameMode }: SportsLobbyProps) {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8 font-sans bg-black/60 backdrop-blur-md z-50"
      >
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-center mb-12 pointer-events-auto"
        >
          <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
            XAK<span className="text-white">SPORTS</span>
          </h1>
          <p className="text-white/70 font-bold tracking-widest uppercase mt-2">Local Multiplayer Edition</p>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-8 flex flex-col gap-6 pointer-events-auto shadow-2xl items-center"
        >
          <div className="flex gap-4">
            {["1v1 Split-Screen", "Practice"].map(mode => (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                className={cn(
                  "px-6 py-3 rounded-xl font-black uppercase tracking-wider text-sm transition-all duration-300",
                  gameMode === mode 
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.5)] scale-105" 
                    : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGameState("playing")}
            className="relative group bg-gradient-to-br from-emerald-400 to-green-600 text-white font-black italic uppercase tracking-widest text-4xl px-20 py-6 rounded-xl shadow-[0_0_50px_rgba(52,211,153,0.5)] overflow-hidden w-full mt-4"
          >
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />
            <div className="flex items-center justify-center gap-4 relative z-10">
              <Play className="w-10 h-10 fill-white" />
              PLAY
            </div>
          </motion.button>
          
          <div className="text-white/40 text-xs font-bold text-center mt-2">
            P1: WASD &bull; P2: Arrow Keys
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
