"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GAMES_DB, GameMeta } from "@/lib/games-db";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ShoppingBag, Plus, Sparkles, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GamesLibraryPage() {
  const router = useRouter();
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);

  useEffect(() => {
    // Load owned games from localStorage (default to free built-in games)
    const stored = localStorage.getItem("xakteir_game_library");
    if (stored) {
      setLibraryIds(JSON.parse(stored));
    } else {
      const defaultIds = ["xaksports", "retro_engine", "pixel_knight"];
      localStorage.setItem("xakteir_game_library", JSON.stringify(defaultIds));
      setLibraryIds(defaultIds);
    }
  }, []);

  const libraryGames = GAMES_DB.filter(g => libraryIds.includes(g.id));

  const handleLaunch = (game: GameMeta) => {
    setLaunchingGame(game.id);
    // Simulate a slick fade-to-black entering transition
    setTimeout(() => {
      router.push(game.route);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* Background ambient light based on hovered game */}
      <AnimatePresence>
        {hoveredGame && (
          <motion.div 
            key={hoveredGame}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-black pointer-events-none"
            style={{ 
              backgroundImage: `url(${GAMES_DB.find(g => g.id === hoveredGame)?.bannerUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(100px)'
            }}
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter italic">XAKTEIR<span className="text-zinc-500">GAMES</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/games/store')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm tracking-wide hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <ShoppingBag className="w-4 h-4" />
            STORE
          </button>
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
            <Settings className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Main Library View */}
      <main className="relative z-10 pt-32 px-10 pb-20 max-w-[1800px] mx-auto h-screen flex flex-col">
        <h2 className="text-5xl font-black tracking-tighter mb-12">My Library</h2>

        {libraryGames.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <ShoppingBag className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-bold">Your library is empty</h3>
            <p className="text-sm mt-2">Head to the store to add some games!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {libraryGames.map((game) => (
              <motion.div
                key={game.id}
                onHoverStart={() => setHoveredGame(game.id)}
                onHoverEnd={() => setHoveredGame(null)}
                whileHover={{ scale: 1.05, y: -10 }}
                className="group relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer border border-white/10 shadow-2xl bg-zinc-900"
                onClick={() => handleLaunch(game)}
              >
                {/* Banner Image */}
                <img 
                  src={game.bannerUrl} 
                  alt={game.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      {game.type}
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white mb-2">{game.title}</h3>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                      {game.genre.slice(0,2).map(g => (
                        <span key={g} className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-bold text-zinc-300">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-500 delay-100 shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                    <Play className="w-6 h-6 fill-black ml-1" />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add More Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push('/games/store')}
              className="aspect-[16/9] rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/50 hover:bg-white/5 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold tracking-widest uppercase text-sm text-zinc-400 group-hover:text-white transition-colors">Find More Games</span>
            </motion.div>
          </div>
        )}
      </main>

      {/* Launching Transition Overlay */}
      <AnimatePresence>
        {launchingGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-white/10 mb-8 overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                <img src={GAMES_DB.find(g => g.id === launchingGame)?.iconUrl} alt="Icon" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-3xl font-black tracking-widest uppercase text-white mb-2">
                {GAMES_DB.find(g => g.id === launchingGame)?.title}
              </h2>
              <div className="w-48 h-1 bg-zinc-800 rounded-full mt-8 overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="h-full bg-white"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}