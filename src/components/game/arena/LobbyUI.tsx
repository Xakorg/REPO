"use client";

import { Play, Users, Settings, Gamepad2, ShoppingBag, Swords, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LobbyUIProps {
  setGameState: (state: "lobby" | "playing") => void;
  gameMode: string;
  setGameMode: (mode: string) => void;
}

export function LobbyUI({ setGameState, gameMode, setGameMode }: LobbyUIProps) {
  const [activeTab, setActiveTab] = useState("Play");

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-sans"
      >
        
        {/* Top Navigation */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center gap-12 pointer-events-auto"
        >
          <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#855cd6] drop-shadow-[0_0_15px_rgba(133,92,214,0.5)]">
          XAK<span className="text-[#855cd6]">ARENA</span>
        </h1>
        
        <nav className="flex gap-2">
          {["Play", "Locker", "Item Shop", "Career"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-t-lg font-bold uppercase tracking-wider text-sm transition-all border-b-4",
                activeTab === tab 
                  ? "bg-white/20 border-white text-white shadow-[0_-5px_20px_rgba(255,255,255,0.1)]" 
                  : "bg-black/20 border-transparent text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
          </nav>
        </motion.div>

        {/* Main Play Area (Bottom Right) */}
        <div className="flex justify-end pointer-events-auto items-end gap-6 mr-[320px]"> {/* Offset for Friends Sidebar */}
          
          {/* Mode Selector */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 p-4 flex flex-col gap-2 min-w-[200px] shadow-2xl"
          >
            <h3 className="text-[#855cd6] uppercase font-black text-xs tracking-widest mb-1 drop-shadow-[0_0_8px_rgba(133,92,214,0.8)]">Game Mode</h3>
            {["Free For All", "1v1 Duel", "2v2 Team", "Floor is Lava"].map(mode => (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                className={cn(
                  "text-left px-4 py-2 rounded font-bold text-sm transition-all duration-300",
                  gameMode === mode 
                    ? "bg-gradient-to-r from-[#855cd6] to-[#7042c1] text-white shadow-[0_0_15px_rgba(133,92,214,0.5)] scale-105" 
                    : "hover:bg-white/10 text-white/70 hover:pl-6"
                )}
              >
              {mode}
            </button>
            ))}
          </motion.div>

          {/* Big PLAY Button */}
          <motion.button 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              setGameState("playing");
              try {
                if (!document.fullscreenElement) {
                  await document.documentElement.requestFullscreen();
                }
              } catch (err) {
                console.warn("Fullscreen failed", err);
              }
            }}
            className="relative group bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-black font-black italic uppercase tracking-widest text-5xl px-20 py-8 rounded-xl shadow-[0_0_50px_rgba(251,191,36,0.5)] overflow-hidden"
          >
            {/* Animated Shine Effect */}
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />
            <div className="flex items-center gap-4 relative z-10">
              <Play className="w-12 h-12 fill-black" />
              PLAY
            </div>
          </motion.button>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
