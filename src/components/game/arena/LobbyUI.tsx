"use client";

import { Play, Users, Settings, Gamepad2, ShoppingBag, Swords, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LobbyUIProps {
  setGameState: (state: "lobby" | "playing") => void;
  gameMode: string;
  setGameMode: (mode: string) => void;
}

export function LobbyUI({ setGameState, gameMode, setGameMode }: LobbyUIProps) {
  const [activeTab, setActiveTab] = useState("Play");

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-sans">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-12 pointer-events-auto">
        <h1 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
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
      </div>

      {/* Main Play Area (Bottom Right) */}
      <div className="flex justify-end pointer-events-auto items-end gap-6 mr-[320px]"> {/* Offset for Friends Sidebar */}
        
        {/* Mode Selector */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-4 flex flex-col gap-2 min-w-[200px]">
          <h3 className="text-white/60 uppercase font-bold text-xs tracking-widest mb-1">Game Mode</h3>
          {["Free For All", "1v1 Duel", "2v2 Team", "Floor is Lava"].map(mode => (
            <button
              key={mode}
              onClick={() => setGameMode(mode)}
              className={cn(
                "text-left px-4 py-2 rounded font-bold text-sm transition-colors",
                gameMode === mode 
                  ? "bg-[#855cd6] text-white" 
                  : "hover:bg-white/10 text-white/70"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Big PLAY Button */}
        <button 
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
          className="relative group bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black italic uppercase tracking-widest text-4xl px-20 py-8 rounded-xl shadow-[0_0_50px_rgba(251,191,36,0.3)] transition-all transform hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4">
            <Play className="w-10 h-10 fill-black" />
            PLAY
          </div>
        </button>
      </div>

    </div>
  );
}
