"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GAMES_DB, GameMeta } from "@/lib/games-db";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Download, Check, Play, Globe } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function GamesStorePage() {
  const router = useRouter();
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("xakteir_game_library");
    if (stored) {
      try { setLibraryIds(JSON.parse(stored)); } catch (e) {}
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

  const customGames = publishedGamesRaw?.map(g => ({
    id: g.id,
    title: g.name,
    description: g.description,
    developer: "Community",
    genre: ["Web", "Custom"],
    type: "App",
    price: "Free",
    route: `/projects/${g.id}`,
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    iconUrl: "",
    videoUrl: ""
  })) || [];

  const featuredGame = GAMES_DB[0]; // XakSports
  const otherGames = [...GAMES_DB.slice(1), ...customGames];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.location.href = '/games'}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black tracking-tighter italic flex items-center gap-2">
            XAKTEIR<span className="text-indigo-500">STORE</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => router.push('/games')}
            onMouseEnter={() => router.prefetch('/games')}
            className="hidden md:flex px-4 py-2 bg-white/5 hover:bg-white/20 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2 text-white/70 hover:text-white"
          >
            <Play className="w-4 h-4" /> Play
          </button>
          <button 
            onClick={() => router.push('/games/store')}
            onMouseEnter={() => router.prefetch('/games/store')}
            className="hidden md:flex px-4 py-2 bg-white/20 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Store
          </button>
          <button 
            onClick={() => router.push('/games/create')}
            onMouseEnter={() => router.prefetch('/games/create')}
            className="hidden md:flex px-4 py-2 bg-white/5 hover:bg-white/20 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2 text-white/70 hover:text-white"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Create
          </button>
        </div>
      </header>

      {/* Featured Hero */}
      <div className="relative w-full h-[70vh] min-h-[600px] flex items-end pb-20 px-10">
        <div className="absolute inset-0">
          <img src={featuredGame.bannerUrl} alt="Featured" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase rounded">Featured</span>
            <span className="px-3 py-1 bg-white/10 backdrop-blur text-white text-xs font-bold tracking-widest uppercase rounded">{featuredGame.type}</span>
          </div>
          <h2 className="text-7xl font-black tracking-tighter mb-4">{featuredGame.title}</h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl">{featuredGame.description}</p>
          
          <div className="flex items-center gap-4">
            {libraryIds.includes(featuredGame.id) ? (
              <button 
                onClick={() => window.location.href = featuredGame.route}
                className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black tracking-widest uppercase hover:scale-105 transition-transform"
              >
                <Play className="w-5 h-5 fill-black" />
                Play Now
              </button>
            ) : (
              <button 
                onClick={(e) => addToLibrary(e, featuredGame.id)}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-full font-black tracking-widest uppercase hover:bg-indigo-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)]"
              >
                <Download className="w-5 h-5" />
                Get - {featuredGame.price}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Store Grid */}
      <div className="px-10 py-20 max-w-[1800px] mx-auto">
        <h3 className="text-3xl font-black tracking-tighter mb-8">Discover More</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {otherGames.map((game) => {
            const isOwned = libraryIds.includes(game.id);
            return (
              <div
                key={game.id}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
                className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-colors"
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <img 
                    src={game.bannerUrl} 
                    alt={game.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {game.genre?.slice(0,2).map(g => (
                      <span key={g} className="px-2 py-1 rounded bg-black/60 backdrop-blur text-[10px] font-bold text-zinc-300">
                        {g}
                      </span>
                    )) || null}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-xl font-black">{game.title}</h4>
                      <p className="text-sm text-zinc-500">{game.developer}</p>
                    </div>
                    <span className="text-sm font-bold text-white bg-white/10 px-2 py-1 rounded">{game.price}</span>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-6 h-10">{game.description}</p>

                  {isOwned ? (
                    <button 
                      onClick={() => window.location.href = game.route}
                      className="w-full py-3 rounded-xl bg-white/10 text-white font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      In Library
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => addToLibrary(e, game.id)}
                      className="w-full py-3 rounded-xl bg-white text-black font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-indigo-500 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Get
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
