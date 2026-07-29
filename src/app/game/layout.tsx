"use client";

import { usePathname } from "next/navigation";
import { GAMES_DB, GameMeta } from "@/lib/games-db";
import { Maximize, ChevronLeft, Gamepad2, Info } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentGame, setCurrentGame] = useState<GameMeta | null>(null);
  const [otherGames, setOtherGames] = useState<GameMeta[]>([]);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine which game we are currently playing based on the route
    if (pathname) {
      const found = GAMES_DB.find(g => g.route === pathname || pathname.startsWith(g.route));
      if (found) {
        setCurrentGame(found);
      }
      
      // Get some random "other games" for the sidebar
      const others = GAMES_DB.filter(g => g.route !== pathname).sort(() => 0.5 - Math.random()).slice(0, 10);
      setOtherGames(others);
    }
  }, [pathname]);

  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      gameContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!currentGame) {
    // Fallback if route isn't mapped in DB yet, just render the game full screen
    return <main className="w-full h-screen bg-black">{children}</main>;
  }

  return (
    <main className="min-h-screen bg-[#05030d] text-white flex flex-col font-sans overflow-x-hidden pb-12 pt-16 md:pt-20">
      {/* Top Breadcrumb Nav */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mb-4 flex items-center justify-between">
        <button 
          onClick={() => window.location.href = '/games'}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Library
        </button>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-6">
        
        {/* Main Game Column */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Game Container (The iFrame or Canvas will stretch here) */}
          <div 
            ref={gameContainerRef}
            className="w-full aspect-video bg-black rounded-t-2xl overflow-hidden relative border-x border-t border-white/10 group shadow-2xl flex flex-col"
          >
            {/* The actual game */}
            <div className="flex-1 w-full h-full relative z-0">
              {children}
            </div>

            {/* Fullscreen inner close button (only visible when in fullscreen) */}
            <div className="hidden group-[&:fullscreen]:block absolute top-4 right-4 z-50">
              <button 
                onClick={toggleFullscreen}
                className="p-3 bg-black/50 hover:bg-black/80 text-white rounded-xl backdrop-blur-md border border-white/20 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                Exit Fullscreen
              </button>
            </div>
          </div>

          {/* Thin Action Bar Below Game */}
          <div className="w-full bg-zinc-900 border-x border-b border-white/10 rounded-b-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <img src={currentGame.iconUrl} alt="icon" className="w-12 h-12 rounded-xl bg-black border border-white/10" />
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none mb-1">{currentGame.title}</h1>
                <div className="text-xs font-bold tracking-widest uppercase text-white/40">
                  By {currentGame.developer} • {currentGame.type}
                </div>
              </div>
            </div>
            
            <button 
              onClick={toggleFullscreen}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
            >
              <Maximize className="w-4 h-4" /> Fullscreen
            </button>
          </div>

          {/* Details Section */}
          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-black tracking-widest uppercase flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" /> About Game
            </h2>
            <p className="text-white/70 leading-relaxed font-medium text-sm md:text-base">
              {currentGame.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {currentGame.genre.map((g, i) => (
                <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold tracking-widest uppercase text-white/50">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Other Games */}
        <div className="w-full lg:w-80 flex flex-col shrink-0 gap-4 mt-8 lg:mt-0">
          <h3 className="text-sm font-black tracking-widest uppercase text-white/40 flex items-center gap-2 px-2">
            <Gamepad2 className="w-4 h-4" /> Recommended
          </h3>
          <div className="flex flex-col gap-3">
            {otherGames.map(game => (
              <div 
                key={game.id}
                onClick={() => window.location.href = game.route}
                className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 hover:border-white/30 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group"
              >
                <img src={game.iconUrl} alt="icon" className="w-16 h-16 rounded-xl object-cover bg-black" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black tracking-tight truncate group-hover:text-primary transition-colors">
                    {game.title}
                  </div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 truncate mt-1">
                    {game.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
