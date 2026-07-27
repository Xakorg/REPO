"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GAMES_DB, GameMeta } from "@/lib/games-db";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ShoppingBag, Settings, Sparkles, Gamepad2, Trophy, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
// Removed DynamicFavicon import

export default function PlayStationGamesLibrary() {
  const router = useRouter();
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const firestore = useFirestore();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const leaderboardQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "leaderboard"),
      orderBy("points", "desc"),
      limit(10)
    );
  }, [firestore]);

  const { data: topPlayers, isLoading: leaderboardLoading } = useCollection(leaderboardQuery);

  useEffect(() => {
    const stored = localStorage.getItem("games_theme");
    if (stored === "light") {
      setIsLightMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    localStorage.setItem("games_theme", nextMode ? "light" : "dark");
  };

  useEffect(() => {
    const stored = localStorage.getItem("xakteir_game_library");
    if (stored) {
      setLibraryIds(JSON.parse(stored));
    } else {
      const defaultIds = ["super_stick_battles", "aero_phantom", "solar_tempest", "hyper_horizon", "cyber_pulse", "xaksports", "retro_engine", "pixel_knight"];
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
    <div className={cn(
      "w-full h-screen font-sans overflow-hidden relative selection:bg-white/20 transition-colors duration-500",
      isLightMode ? "light-theme" : "bg-black text-white"
    )}>
      
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
      <header className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center z-50 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Gamepad2 
              className="w-5 h-5 md:w-6 md:h-6" 
              style={{
                stroke: "url(#mesh-gradient)",
                fill: "url(#mesh-gradient)",
                fillOpacity: 0.2
              }} 
            />
          </div>
          <div className="flex gap-4 md:gap-8 text-xs md:text-sm font-black uppercase tracking-widest text-white/50">
            <span className="text-white">Games</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => router.push('/games/store')}>Store</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Global Leaderboard Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20">
                <Trophy className="w-5 h-5 text-amber-400" />
              </button>
            </SheetTrigger>
            <SheetContent className="bg-zinc-950/95 border-l border-white/10 text-white font-sans overflow-y-auto">
              <SheetHeader className="pb-6 border-b border-white/10">
                <SheetTitle className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-400 animate-pulse" /> Global Rankings
                </SheetTitle>
              </SheetHeader>
              
              <div className="py-6 space-y-4">
                {leaderboardLoading ? (
                  <div className="text-center py-12 text-white/40 font-bold uppercase tracking-widest text-xs">Loading scoreboard...</div>
                ) : !topPlayers || topPlayers.length === 0 ? (
                  <div className="text-center py-12 text-white/40 font-bold uppercase tracking-widest text-xs">No records. Play to join! 🏆</div>
                ) : (
                  <div className="space-y-3">
                    {topPlayers.map((player: any, idx: number) => (
                      <div 
                        key={player.id || idx}
                        className={cn(
                          "p-4 rounded-2xl flex items-center justify-between border transition-all",
                          idx === 0 ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]" :
                          idx === 1 ? "bg-slate-400/10 border-slate-400/30" :
                          idx === 2 ? "bg-amber-700/10 border-amber-700/30" :
                          "bg-white/5 border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-base font-black w-5 text-center",
                            idx === 0 ? "text-amber-400" :
                            idx === 1 ? "text-slate-300" :
                            idx === 2 ? "text-amber-600" :
                            "text-white/40"
                          )}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-white uppercase tracking-wider">{player.displayName}</div>
                            <div className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">ID: {player.uid?.slice(0, 6)}...</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-emerald-400 text-base">{player.points || 0}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-white/30">PTS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20 text-white"
          >
            {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer border border-white/20 text-white">
            <Settings className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* 3. Game Info */}
      <div className="absolute top-28 md:top-40 left-6 md:left-16 right-6 md:right-auto z-40 max-w-2xl text-left">
        <AnimatePresence mode="wait">
          {activeItem ? (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <img src={activeItem.iconUrl} alt="logo" className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-zinc-900 border-2 border-white/10 mb-4 md:mb-6 shadow-2xl" />
              <h1 className="text-3xl md:text-6xl font-black tracking-tighter mb-2 md:mb-4">{activeItem.title}</h1>
              <p className="text-sm md:text-lg text-white/70 font-medium mb-6 md:mb-8 leading-relaxed line-clamp-3 md:line-clamp-none">{activeItem.description}</p>
              <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() => handleLaunch(activeItem)}
                  className="px-8 py-3.5 md:px-10 md:py-4 bg-white text-black rounded-full font-black tracking-widest uppercase hover:scale-105 transition-all flex items-center gap-2.5 md:gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] text-xs md:text-sm"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-black" /> Play
                </button>
                <div className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-white/50 bg-white/10 px-4 py-3 md:py-4 rounded-full backdrop-blur-md border border-white/10">
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
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-indigo-600 flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-6xl font-black tracking-tighter mb-2 md:mb-4">Store</h1>
              <p className="text-sm md:text-lg text-white/70 font-medium mb-6 md:mb-8 leading-relaxed">Discover your next favorite game. Expand your library with native 3D, retro emulators, and top-down adventures.</p>
              <button 
                onClick={() => router.push('/games/store')}
                className="px-8 py-3.5 md:px-10 md:py-4 bg-indigo-600 text-white rounded-full font-black tracking-widest uppercase hover:scale-105 transition-all flex items-center gap-2.5 md:gap-3 shadow-[0_0_40px_rgba(79,70,229,0.4)] text-xs md:text-sm"
              >
                Browse Catalog
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. The 1-Line Carousel (Bottom) */}
      <div className="absolute bottom-6 md:bottom-20 left-0 right-0 z-40">
        <div 
          ref={carouselRef}
          className="flex items-end gap-3 md:gap-4 px-[8vw] md:px-[10vw] overflow-x-auto no-scrollbar scroll-smooth pb-8 pt-4"
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
                  width: focusedIndex === idx ? (isMobile ? 180 : 280) : (isMobile ? 80 : 120),
                  height: focusedIndex === idx ? (isMobile ? 180 : 280) : (isMobile ? 80 : 120),
                  y: focusedIndex === idx ? -10 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer shadow-2xl transition-colors duration-300",
                  focusedIndex === idx ? "border-2 md:border-4 border-white" : "border border-white/20 bg-white/5 hover:bg-white/20 hover:border-white/40"
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
                <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-bold tracking-widest uppercase text-white/50 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                  {game.title}
                </div>
              )}
            </div>
          ))}

          {/* "Store" Card at the end of the line */}
          <div
            onClick={() => setFocusedIndex(libraryGames.length)}
            className="shrink-0 relative group outline-none ml-2 md:ml-4"
          >
            <motion.div
              animate={{
                width: focusedIndex === libraryGames.length ? (isMobile ? 180 : 280) : (isMobile ? 80 : 120),
                height: focusedIndex === libraryGames.length ? (isMobile ? 180 : 280) : (isMobile ? 80 : 120),
                y: focusedIndex === libraryGames.length ? -10 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "rounded-2xl md:rounded-3xl cursor-pointer shadow-2xl flex items-center justify-center transition-colors duration-300",
                focusedIndex === libraryGames.length ? "bg-indigo-600 border-2 md:border-4 border-white" : "bg-white/5 border border-white/20 hover:bg-white/20 hover:border-white/40"
              )}
            >
              <ShoppingBag className={cn(
                "transition-all duration-300",
                focusedIndex === libraryGames.length ? (isMobile ? "w-12 h-12 text-white" : "w-20 h-20 text-white") : (isMobile ? "w-6 h-6 text-white/50" : "w-10 h-10 text-white/50 group-hover:text-white")
              )} />
            </motion.div>
            {focusedIndex !== libraryGames.length && (
              <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-bold tracking-widest uppercase text-white/50 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
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