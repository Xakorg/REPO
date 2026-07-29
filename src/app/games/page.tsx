"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GAMES_DB, GameMeta } from "@/lib/games-db";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ShoppingBag, Settings, Sparkles, Gamepad2, Trophy, Sun, Moon, Search, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function PlayStationGamesLibrary() {
  const router = useRouter();
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activeItem, setActiveItem] = useState<GameMeta | null>(null);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const firestore = useFirestore();

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
    const storedTheme = localStorage.getItem("games_theme");
    if (storedTheme === "light") setIsLightMode(true);

    const storedFavs = localStorage.getItem("xakteir_favorite_games");
    if (storedFavs) setFavoriteIds(JSON.parse(storedFavs));

    const storedRecent = localStorage.getItem("xakteir_recent_games");
    if (storedRecent) setRecentIds(JSON.parse(storedRecent));

    const storedLibs = localStorage.getItem("xakteir_game_library");
    if (storedLibs) {
      setLibraryIds(JSON.parse(storedLibs));
    } else {
      const defaultIds = ["cyber_quest_platformer", "cyber_dungeon_rpg", "quantum_laser_puzzle", "neon_core_defense", "cyber_drift_runner", "cyber_leap_odyssey", "aetheria_realm_of_shadows", "aegis_protocol_td", "quantum_prism_puzzle", "synthwave_beat_rush", "cyber_runner_platformer", "synthwave_velocity_runner", "cyber_pinball_odyssey", "aether_pulse_2d", "sector_9_rpg", "gravity_racer_2d", "nexus_grid_defense_2d", "stellar_strike_2d", "shadow_blade_2d", "neon_ronin", "cyber_nexus_survivor", "aether_strike", "stellar_overlord", "chronos_protocol", "void_vanguard", "nexus_overdrive", "super_stick_battles", "aero_phantom", "solar_tempest", "hyper_horizon", "cyber_pulse", "xaksports", "retro_engine", "pixel_knight"];
      localStorage.setItem("xakteir_game_library", JSON.stringify(defaultIds));
      setLibraryIds(defaultIds);
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    localStorage.setItem("games_theme", nextMode ? "light" : "dark");
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoriteIds(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [id, ...prev];
      localStorage.setItem("xakteir_favorite_games", JSON.stringify(next));
      return next;
    });
  };

  const handleLaunch = (game: GameMeta | null) => {
    if (!game) {
      window.location.href = '/games/store';
      return;
    }
    
    // Add to recent
    setRecentIds(prev => {
      const next = [game.id, ...prev.filter(id => id !== game.id)].slice(0, 10);
      localStorage.setItem("xakteir_recent_games", JSON.stringify(next));
      return next;
    });

    setLaunchingGame(game.id);
    setTimeout(() => {
      window.location.href = game.route;
    }, 2000);
  };

  const libraryGames = GAMES_DB.filter(g => libraryIds.includes(g.id));
  const recentGames = recentIds.map(id => GAMES_DB.find(g => g.id === id)).filter(Boolean) as GameMeta[];
  const favoriteGames = favoriteIds.map(id => GAMES_DB.find(g => g.id === id)).filter(Boolean) as GameMeta[];
  
  const filteredGames = libraryGames.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.genre.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase())));

  // Generate a dynamic gradient based on the active item ID length as a pseudo-random seed
  const getGradient = (id: string = "") => {
    const colors = [
      "from-blue-600 via-indigo-900",
      "from-rose-600 via-red-900",
      "from-emerald-600 via-teal-900",
      "from-amber-500 via-orange-900",
      "from-purple-600 via-fuchsia-900"
    ];
    return colors[id.length % colors.length];
  };

  useEffect(() => {
    // If no active item, default to first filtered game or null
    if (!activeItem && filteredGames.length > 0) {
      setActiveItem(filteredGames[0]);
    }
  }, [filteredGames, activeItem]);

  const GameCard = ({ game }: { game: GameMeta }) => (
    <div
      onClick={() => setActiveItem(game)}
      className="shrink-0 relative group outline-none"
    >
      <motion.div
        animate={{
          width: activeItem?.id === game.id ? (isMobile ? 180 : 220) : (isMobile ? 100 : 140),
          height: activeItem?.id === game.id ? (isMobile ? 180 : 220) : (isMobile ? 100 : 140),
          y: activeItem?.id === game.id ? -10 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer shadow-xl transition-colors duration-300",
          activeItem?.id === game.id ? "border-2 md:border-4 border-white z-10 shadow-[0_0_30px_rgba(255,255,255,0.2)]" : "border border-white/20 bg-white/5 hover:bg-white/20 hover:border-white/40"
        )}
      >
        <img 
          src={game.iconUrl} 
          alt={game.title} 
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            activeItem?.id === game.id ? "opacity-100" : "opacity-60 group-hover:opacity-100"
          )} 
        />
        <button 
          onClick={(e) => toggleFavorite(e, game.id)}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md bg-black/40 border border-white/10 hover:scale-110 transition-transform z-20",
            favoriteIds.includes(game.id) ? "text-rose-500" : "text-white/50 hover:text-white"
          )}
        >
          <Heart className="w-4 h-4" fill={favoriteIds.includes(game.id) ? "currentColor" : "none"} />
        </button>
      </motion.div>
      <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] md:text-xs font-bold tracking-widest uppercase text-white/70 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
        {game.title}
      </div>
    </div>
  );

  return (
    <div className={cn(
      "w-full h-screen font-sans overflow-hidden relative selection:bg-white/20 transition-colors duration-500",
      isLightMode ? "light-theme" : "bg-black text-white"
    )}>
      
      {/* 1. Dynamic Fullscreen Background (PS5 Style) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeItem?.id || "empty"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "absolute inset-0 bg-gradient-to-br to-black pointer-events-none transition-colors duration-1000",
            getGradient(activeItem?.id)
          )}
        >
          {activeItem && (
            <>
              <img 
                src={activeItem.bannerUrl} 
                alt="bg" 
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50 md:opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />

      {/* 2. Top Status Bar & Search */}
      <header className="absolute top-0 left-0 right-0 p-4 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
            <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input 
              type="text" 
              placeholder="Search Games..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all backdrop-blur-md font-medium tracking-wide"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 ml-auto md:ml-0 mr-2 md:mr-4">
          <Link 
            href="/games"
            className="hidden md:flex px-4 py-2 bg-white/20 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2"
          >
            <Play className="w-4 h-4" /> Play
          </Link>
          <Link 
            href="/games/store"
            className="hidden md:flex px-4 py-2 bg-white/5 hover:bg-white/20 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2 text-white/70 hover:text-white"
          >
            <ShoppingBag className="w-4 h-4" /> Store
          </Link>
          <Link 
            href="/games/create"
            className="hidden md:flex px-4 py-2 bg-white/5 hover:bg-white/20 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2 text-white/70 hover:text-white"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Create
          </Link>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
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
                      <div key={player.id || idx} className="p-4 rounded-2xl flex items-center justify-between border bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-black w-5 text-center text-white/40">{idx + 1}</span>
                          <div>
                            <div className="font-bold text-xs text-white uppercase tracking-wider">{player.displayName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-emerald-400 text-base">{player.points || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20 text-white">
            {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 3. Game Info Overlay */}
      <div className="absolute top-28 md:top-32 left-6 md:left-12 z-40 max-w-[90vw] md:max-w-xl text-left pointer-events-none">
        <AnimatePresence mode="wait">
          {activeItem && (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="pointer-events-auto"
            >
              <img src={activeItem.iconUrl} alt="logo" className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-zinc-900 border-2 border-white/10 mb-4 shadow-2xl" />
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-3 leading-tight">{activeItem.title}</h1>
              <p className="text-sm md:text-base text-white/70 font-medium mb-6 leading-relaxed line-clamp-3">{activeItem.description}</p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleLaunch(activeItem)}
                  className="px-8 py-3 bg-white text-black rounded-full font-black tracking-widest uppercase hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)] text-xs md:text-sm"
                >
                  <Play className="w-4 h-4 fill-black" /> Play
                </button>
                <div className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-white/60 bg-white/10 px-4 py-3 rounded-full backdrop-blur-md border border-white/10">
                  {activeItem.type}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Scrollable Multi-Row Library */}
      <div className="absolute top-[45vh] md:top-[50vh] bottom-0 left-0 right-0 z-40 overflow-y-auto pb-12 overflow-x-hidden no-scrollbar">
        <div className="flex flex-col gap-10 md:gap-14 pt-8 md:pt-12">
          
          {/* Favorites Row */}
          {favoriteGames.length > 0 && !searchQuery && (
            <div className="pl-6 md:pl-12">
              <h3 className="text-sm md:text-base font-black tracking-widest uppercase text-white/70 mb-4 md:mb-6 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Favorites
              </h3>
              <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 pr-12 no-scrollbar" style={{ scrollbarWidth: "none" }}>
                {favoriteGames.map(game => (
                  <GameCard key={`fav-${game.id}`} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Row */}
          {recentGames.length > 0 && !searchQuery && (
            <div className="pl-6 md:pl-12">
              <h3 className="text-sm md:text-base font-black tracking-widest uppercase text-white/70 mb-4 md:mb-6">Recently Played</h3>
              <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 pr-12 no-scrollbar" style={{ scrollbarWidth: "none" }}>
                {recentGames.map(game => (
                  <GameCard key={`rec-${game.id}`} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* All Games Row */}
          <div className="pl-6 md:pl-12">
            <h3 className="text-sm md:text-base font-black tracking-widest uppercase text-white/70 mb-4 md:mb-6">
              {searchQuery ? "Search Results" : "All Games"}
            </h3>
            <div className="flex flex-wrap gap-4 md:gap-8 pb-12 pr-6">
              {filteredGames.length > 0 ? filteredGames.map(game => (
                <GameCard key={`all-${game.id}`} game={game} />
              )) : (
                <div className="text-white/40 text-sm font-bold uppercase tracking-widest py-8">No games found.</div>
              )}
            </div>
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
              <h2 className="text-4xl font-black tracking-widest uppercase text-white mb-12 text-center px-4">
                {GAMES_DB.find(g => g.id === launchingGame)?.title}
              </h2>
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