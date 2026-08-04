"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GAMES_DB, GameMeta } from "@/lib/games-db";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Download, Play, Search, Gamepad2, Users, Flame, Compass, Crosshair } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { XakchatSidebar } from "@/components/game/XakchatSidebar";
import { cn } from "@/lib/utils";

export default function GamesStorePage() {
  const router = useRouter();
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("xakteir_game_library");
    if (stored) {
      try { setLibraryIds(JSON.parse(stored)); } catch (e) { console.error(e); }
    }
  }, []);

  const addToLibrary = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newLibrary = [...libraryIds, id];
    setLibraryIds(newLibrary);
    localStorage.setItem("xakteir_game_library", JSON.stringify(newLibrary));
  };

  const firestore = useFirestore();
  const publishedProjectsQuery = useMemoFirebase(() => {
    return firestore ? collection(firestore, "publishedProjects") : null;
  }, [firestore]);
  const { data: publishedGamesRaw } = useCollection(publishedProjectsQuery);

  const customGames: GameMeta[] = publishedGamesRaw?.map((g: any) => ({
    id: g.id,
    title: g.name,
    description: g.description,
    developer: "Community",
    genre: ["Web", "Custom"],
    type: "App",
    price: "Free",
    route: `/game/${g.id}`,
    bannerUrl: g.thumbnailUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    iconUrl: g.thumbnailUrl || "",
    releaseDate: "TBA"
  })) || [];

  const ALL_GAMES = [...GAMES_DB, ...customGames];

  const featuredGame = ALL_GAMES[0] || null; 

  const adventureGames = ALL_GAMES.filter(g => g.genre.some(cat => cat.toLowerCase().includes("adventure") || cat.toLowerCase().includes("rpg")));
  const actionGames = ALL_GAMES.filter(g => g.genre.some(cat => cat.toLowerCase().includes("action") || cat.toLowerCase().includes("shooter") || cat.toLowerCase().includes("defense")));
  
  // "Friends Played" can be a pseudo-random selection to simulate social features
  const friendsPlayedGames = ALL_GAMES.slice(4, 12).sort(() => 0.5 - Math.random());
  const trendingGames = ALL_GAMES.slice(0, 10);

  const filteredGames = ALL_GAMES.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.genre.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
    g.developer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StoreGameCard = ({ game }: { game: GameMeta }) => {
    const isOwned = libraryIds.includes(game.id);
    return (
      <motion.div
        onMouseEnter={() => setHoveredGame(game.id)}
        onMouseLeave={() => setHoveredGame(null)}
        whileHover={{ y: -8 }}
        className="group relative min-w-[280px] md:min-w-[340px] bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.12)] shrink-0"
      >
        <div className="aspect-[16/9] relative overflow-hidden">
          <img 
            src={game.bannerUrl} 
            alt={game.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-white border border-white/10">
            {game.price}
          </div>
          <img 
            src={game.iconUrl} 
            alt="icon" 
            className="absolute -bottom-6 left-6 w-16 h-16 rounded-2xl border-2 border-white/20 bg-black/50 backdrop-blur-md shadow-xl"
          />
        </div>

        <div className="p-6 pt-10">
          <h4 className="text-xl font-black tracking-tight mb-1 truncate">{game.title}</h4>
          <p className="text-sm font-bold text-indigo-400 mb-4 truncate">{game.developer}</p>
          <div className="flex gap-2 mb-6 overflow-hidden">
            {game.genre?.slice(0,3).map((g, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 border border-white/5 whitespace-nowrap">
                {g}
              </span>
            )) || null}
          </div>

          {isOwned ? (
            <button 
              onClick={() => window.location.href = game.route}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
            >
              <Play className="w-5 h-5 fill-black" />
              Play!
            </button>
          ) : (
            <button 
              onClick={(e) => addToLibrary(e, game.id)}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              Get Game Now!
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden pb-32">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-6 bg-gradient-to-b from-black/90 via-black/60 to-transparent backdrop-blur-md">
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => window.location.href = '/games'}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter italic flex items-center gap-2 drop-shadow-lg">
            XAKTEIR<span className="text-indigo-500">STORE</span>
          </h1>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex relative flex-1 max-w-xl mx-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input 
            type="text" 
            placeholder="Search games, genres, developers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all backdrop-blur-xl font-medium tracking-wide shadow-inner"
          />
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => router.push('/games')}
            onMouseEnter={() => router.prefetch('/games')}
            className="hidden md:flex px-5 py-2.5 bg-white/5 hover:bg-white/20 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all items-center gap-2 text-white/70 hover:text-white hover:scale-105"
          >
            <Play className="w-4 h-4" /> Library
          </button>
          <button 
            onClick={() => router.push('/games/store')}
            className="hidden md:flex px-5 py-2.5 bg-indigo-600 rounded-full border border-indigo-500 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
          >
            <Sparkles className="w-4 h-4" /> Store
          </button>
          
          <div className="ml-2">
            <XakchatSidebar />
          </div>
        </div>
      </header>

      {/* Search Results Overlay View */}
      {searchQuery ? (
        <div className="pt-32 px-6 md:px-10 max-w-[1800px] mx-auto min-h-[80vh]">
          <h2 className="text-4xl font-black tracking-tighter mb-8 flex items-center gap-4">
            <Search className="w-8 h-8 text-indigo-500" /> 
            Search Results for "{searchQuery}"
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredGames.length > 0 ? (
              filteredGames.map((game) => (
                <StoreGameCard key={game.id} game={game} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-2xl font-black tracking-widest uppercase text-white/30 mb-4">No results found.</p>
                <p className="text-white/50">Try searching for something else like "Action" or "Cyber".</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Featured Hero */}
          {featuredGame && (
            <div className="relative w-full h-[85vh] min-h-[700px] flex items-end pb-24 px-6 md:px-16 mt-0">
              <div className="absolute inset-0">
                <img src={featuredGame.bannerUrl} alt="Featured" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay pointer-events-none" />
              </div>

              <div className="relative z-10 max-w-4xl">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-black tracking-widest uppercase rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]">Featured</span>
                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-black tracking-widest uppercase rounded-full border border-white/20">{featuredGame.type}</span>
                  </div>
                  <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none drop-shadow-2xl">{featuredGame.title}</h2>
                  <p className="text-lg md:text-2xl text-zinc-300 mb-10 max-w-3xl leading-relaxed drop-shadow-lg font-medium">{featuredGame.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    {libraryIds.includes(featuredGame.id) ? (
                      <button 
                        onClick={() => window.location.href = featuredGame.route}
                        className="flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black rounded-full font-black tracking-widest uppercase hover:scale-105 transition-all shadow-[0_0_40px_rgba(16,185,129,0.5)] text-sm md:text-base w-full sm:w-auto"
                      >
                        <Play className="w-6 h-6 fill-black" />
                        Play!
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => addToLibrary(e, featuredGame.id)}
                        className="flex items-center justify-center gap-3 px-10 py-5 bg-white text-black rounded-full font-black tracking-widest uppercase hover:bg-indigo-500 hover:text-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] text-sm md:text-base w-full sm:w-auto"
                      >
                        <Download className="w-6 h-6" />
                        Get Game Now!
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Categorized Lanes */}
          <div className="px-6 md:px-12 py-10 max-w-[2000px] mx-auto space-y-20">
            
            {/* Trending Now */}
            <section>
              <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-6 flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-500" /> Trending Now
              </h3>
              <div className="flex gap-6 overflow-x-auto pb-8 pr-12 no-scrollbar snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
                {trendingGames.map((game) => (
                  <div className="snap-start" key={game.id}>
                    <StoreGameCard game={game} />
                  </div>
                ))}
              </div>
            </section>

            {/* Friends Played */}
            <section>
              <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-6 flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-400" /> Friends Played
              </h3>
              <div className="flex gap-6 overflow-x-auto pb-8 pr-12 no-scrollbar snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
                {friendsPlayedGames.map((game) => (
                  <div className="snap-start" key={game.id}>
                    <StoreGameCard game={game} />
                  </div>
                ))}
              </div>
            </section>

            {/* Adventure! */}
            <section>
              <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-6 flex items-center gap-3">
                <Compass className="w-8 h-8 text-emerald-400" /> Adventure!
              </h3>
              <div className="flex gap-6 overflow-x-auto pb-8 pr-12 no-scrollbar snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
                {adventureGames.map((game) => (
                  <div className="snap-start" key={game.id}>
                    <StoreGameCard game={game} />
                  </div>
                ))}
              </div>
            </section>

            {/* Action & Combat */}
            <section>
              <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-6 flex items-center gap-3">
                <Crosshair className="w-8 h-8 text-rose-500" /> Action & Combat
              </h3>
              <div className="flex gap-6 overflow-x-auto pb-8 pr-12 no-scrollbar snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
                {actionGames.map((game) => (
                  <div className="snap-start" key={game.id}>
                    <StoreGameCard game={game} />
                  </div>
                ))}
              </div>
            </section>

          </div>
        </>
      )}

    </div>
  );
}
