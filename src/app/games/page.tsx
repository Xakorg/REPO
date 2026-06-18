"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GAMES_DB, GameMeta } from "@/lib/games-db";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ShoppingBag, Settings, Sparkles, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlayStationGamesLibrary() {
  const router = useRouter();
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("xakteir_game_library");
    if (stored) {
      setLibraryIds(JSON.parse(stored));
    } else {
      const defaultIds = ["xaksports", "retro_engine", "pixel_knight"];
      localStorage.setItem("xakteir_game_library", JSON.stringify(defaultIds));
      setLibraryIds(defaultIds);
    }
  }, []);

  // Make sure 'store' card is always at the end of the library array
  const libraryGames = GAMES_DB.filter(g => libraryIds.includes(g.id));
  const activeItem = focusedIndex < libraryGames.length ? libraryGames[focusedIndex] : null;

  // Handle keyboard navigation for that authentic console feel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (launchingGame) return;
      
      if (e.key === "ArrowRight") {
        setFocusedIndex(prev => Math.min(prev + 1, libraryGames.length));
      } else if (e.key === "ArrowLeft") {
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && activeItem) {
        handleLaunch(activeItem);
      } else if (e.key === "Enter" && !activeItem) {
        router.push('/games/store');
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [libraryGames.length, activeItem, launchingGame, router]);

  // Center the focused item in the carousel
  useEffect(() => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const focusedElement = container.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        const containerWidth = container.offsetWidth;
        const elementOffset = focusedElement.offsetLeft;
        const elementWidth = focusedElement.offsetWidth;
        
        container.scrollTo({
          left: elementOffset - (containerWidth / 2) + (elementWidth / 2),
          behavior: "smooth"
        });
      }
    }
  }, [focusedIndex]);

  const handleLaunch = (game: GameMeta) => {
    setLaunchingGame(game.id);
    setTimeout(() => {
      router.push(game.route);
    }, 2000);
  };

  // Generate a dynamic gradient based on the active item
  const getGradient = (index: number) => {
    const colors = [
      "from-blue-600 via-indigo-900",
      "from-rose-600 via-red-900",
      "from-emerald-600 via-teal-900",
      "from-amber-500 via-orange-900",
      "from-purple-600 via-fuchsia-900"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden relative selection:bg-white/20">
      
      {/* 1. Dynamic Fullscreen Background (PS5 Style) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={focusedIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "absolute inset-0 bg-gradient-to-br to-black pointer-events-none transition-colors duration-1000",
            getGradient(focusedIndex)
          )}
        >
          {activeItem && (
            <>
              <img 
                src={activeItem.bannerUrl} 
                alt="bg" 
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
              />
              {/* Vignette & Fade to Black at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating Particles/UI Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />

      {/* 2. Top Status Bar */}
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-8 text-sm font-black uppercase tracking-widest text-white/50">
            <span className="text-white">Games</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => router.push('/games/store')}>Store</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer border border-white/20">
            <Settings className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* 3. Game Info (Top Left) */}
      <div className="absolute top-40 left-16 z-40 max-w-2xl">
        <AnimatePresence mode="wait">
          {activeItem ? (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <img src={activeItem.iconUrl} alt="logo" className="w-24 h-24 rounded-3xl bg-zinc-900 border-2 border-white/10 mb-6 shadow-2xl" />
              <h1 className="text-6xl font-black tracking-tighter mb-4">{activeItem.title}</h1>
              <p className="text-lg text-white/70 font-medium mb-8 leading-relaxed line-clamp-3">{activeItem.description}</p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleLaunch(activeItem)}
                  className="px-10 py-4 bg-white text-black rounded-full font-black tracking-widest uppercase hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  <Play className="w-5 h-5 fill-black" /> Play
                </button>
                <div className="text-xs font-bold tracking-widest uppercase text-white/50 bg-white/10 px-4 py-4 rounded-full backdrop-blur-md border border-white/10">
                  {activeItem.type}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="store-info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                <ShoppingBag className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-6xl font-black tracking-tighter mb-4">Store</h1>
              <p className="text-lg text-white/70 font-medium mb-8 leading-relaxed">Discover your next favorite game. Expand your library with native 3D, retro emulators, and top-down adventures.</p>
              <button 
                onClick={() => router.push('/games/store')}
                className="px-10 py-4 bg-indigo-600 text-white rounded-full font-black tracking-widest uppercase hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(79,70,229,0.4)]"
              >
                Browse Catalog
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. The 1-Line Carousel (Bottom) */}
      <div className="absolute bottom-20 left-0 right-0 z-40">
        <div 
          ref={carouselRef}
          className="flex items-end gap-4 px-[10vw] overflow-x-auto no-scrollbar scroll-smooth pb-10 pt-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {libraryGames.map((game, idx) => (
            <div
              key={game.id}
              onClick={() => setFocusedIndex(idx)}
              className="shrink-0 relative group outline-none"
            >
              <motion.div
                animate={{
                  width: focusedIndex === idx ? 280 : 120,
                  height: focusedIndex === idx ? 280 : 120,
                  y: focusedIndex === idx ? -20 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "rounded-3xl overflow-hidden cursor-pointer shadow-2xl transition-colors duration-300",
                  focusedIndex === idx ? "border-4 border-white" : "border border-white/20 bg-white/5 hover:bg-white/20 hover:border-white/40"
                )}
              >
                <img 
                  src={game.iconUrl} 
                  alt={game.title} 
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    focusedIndex === idx ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                  )} 
                />
              </motion.div>
              {/* Label underneath small icons */}
              {focusedIndex !== idx && (
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-bold tracking-widest uppercase text-white/50 opacity-0 group-hover:opacity-100 transition-opacity truncate px-2">
                  {game.title}
                </div>
              )}
            </div>
          ))}

          {/* "Store" Card at the end of the line */}
          <div
            onClick={() => setFocusedIndex(libraryGames.length)}
            className="shrink-0 relative group outline-none ml-4"
          >
            <motion.div
              animate={{
                width: focusedIndex === libraryGames.length ? 280 : 120,
                height: focusedIndex === libraryGames.length ? 280 : 120,
                y: focusedIndex === libraryGames.length ? -20 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "rounded-3xl cursor-pointer shadow-2xl flex items-center justify-center transition-colors duration-300",
                focusedIndex === libraryGames.length ? "bg-indigo-600 border-4 border-white" : "bg-white/5 border border-white/20 hover:bg-white/20 hover:border-white/40"
              )}
            >
              <ShoppingBag className={cn(
                "transition-all duration-300",
                focusedIndex === libraryGames.length ? "w-20 h-20 text-white" : "w-10 h-10 text-white/50 group-hover:text-white"
              )} />
            </motion.div>
            {focusedIndex !== libraryGames.length && (
              <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-bold tracking-widest uppercase text-white/50 opacity-0 group-hover:opacity-100 transition-opacity truncate px-2">
                Store
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Launching Sequence Overlay */}
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
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 rounded-[2rem] bg-zinc-900 border-2 border-white/10 mb-8 overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.1)]">
                <img src={GAMES_DB.find(g => g.id === launchingGame)?.iconUrl} alt="Icon" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-4xl font-black tracking-widest uppercase text-white mb-12">
                {GAMES_DB.find(g => g.id === launchingGame)?.title}
              </h2>
              {/* PlayStation style pulsing loader */}
              <div className="flex gap-4">
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-3 h-3 rounded-full bg-blue-500" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-3 h-3 rounded-full bg-rose-500" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}