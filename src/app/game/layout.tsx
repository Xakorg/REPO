"use client";

import { usePathname } from "next/navigation";
import { GAMES_DB, GameMeta } from "@/lib/games-db";
import { Maximize, ChevronLeft, Gamepad2, Info, Clock, Star, MessageSquare, Trophy, Send } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { XakchatSidebar } from "@/components/game/XakchatSidebar";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentGame, setCurrentGame] = useState<GameMeta | null>(null);
  const [otherGames, setOtherGames] = useState<GameMeta[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "achievements">("overview");
  const [reviewText, setReviewText] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const firestore = useFirestore();

  const publishedProjectsQuery = useMemoFirebase(() => {
    return firestore ? collection(firestore, "publishedProjects") : null;
  }, [firestore]);
  const { data: publishedGamesRaw } = useCollection(publishedProjectsQuery);

  useEffect(() => {
    // Generate custom games list
    const customGames: GameMeta[] = publishedGamesRaw?.map(g => ({
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
      releaseDate: "TBA",
    })) || [];

    const ALL_GAMES = [...GAMES_DB, ...customGames];

    // Determine which game we are currently playing based on the route
    if (pathname) {
      const found = ALL_GAMES.find(g => g.route === pathname || pathname.startsWith(g.route));
      if (found) {
        setCurrentGame(found);
      }
      
      // Get some random "other games" for the sidebar
      const others = ALL_GAMES.filter(g => g.route !== pathname).sort(() => 0.5 - Math.random()).slice(0, 10);
      setOtherGames(others);
    }
  }, [pathname, publishedGamesRaw]);

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
        <div className="flex items-center gap-4">
          <XakchatSidebar activeGameId={currentGame.id} activeGameTitle={currentGame.title} />
        </div>
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

          {/* Tabs Navigation */}
          <div className="mt-8 flex gap-6 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab("overview")} className={`text-sm font-black uppercase tracking-widest whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'text-white border-b-2 border-primary pb-4 -mb-[18px]' : 'text-white/40 hover:text-white'}`}>
              <Info className="w-4 h-4" /> Overview
            </button>
            <button onClick={() => setActiveTab("reviews")} className={`text-sm font-black uppercase tracking-widest whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'reviews' ? 'text-white border-b-2 border-primary pb-4 -mb-[18px]' : 'text-white/40 hover:text-white'}`}>
              <MessageSquare className="w-4 h-4" /> Reviews
            </button>
            <button onClick={() => setActiveTab("achievements")} className={`text-sm font-black uppercase tracking-widest whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'achievements' ? 'text-white border-b-2 border-primary pb-4 -mb-[18px]' : 'text-white/40 hover:text-white'}`}>
              <Trophy className="w-4 h-4" /> Achievements
            </button>
          </div>

          {activeTab === "overview" && (
            <>
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

              {/* Updates Section */}
              {currentGame.updates && currentGame.updates.length > 0 && (
                <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                  <h2 className="text-lg font-black tracking-widest uppercase flex items-center gap-2 mb-6 text-white/90">
                    <Clock className="w-5 h-5 text-indigo-400" /> Recent Updates
                  </h2>
                  <div className="space-y-4">
                    {currentGame.updates.map((update, idx) => (
                      <div key={idx} className="flex gap-4 items-start relative before:absolute before:left-[3px] before:top-6 before:bottom-[-24px] last:before:hidden before:w-[2px] before:bg-white/10">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10" />
                        <div>
                          <div className="text-xs font-black tracking-widest uppercase text-white/40 mb-1">{update.time}</div>
                          <div className="text-sm font-medium text-white/80">{update.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "reviews" && (
            <div className="mt-8 space-y-6">
              {/* Write Review */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest mb-4">Write a Review</h3>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewStars(star)}>
                      <Star className={`w-6 h-6 ${star <= reviewStars ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <textarea 
                    placeholder="What do you think about this game?" 
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[100px] resize-y"
                  />
                  <button className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <Send className="w-3.5 h-3.5" /> Submit
                  </button>
                </div>
              </div>

              {/* Read Reviews (Mock) */}
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-xs">P</div>
                      <span className="font-bold text-sm">PlayerOne</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                  <p className="text-sm text-white/70">Absolutely amazing experience. The graphics are stunning and gameplay is super smooth.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs">G</div>
                      <span className="font-bold text-sm">GamerGuy99</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                      <Star className="w-3 h-3 text-white/20" />
                    </div>
                  </div>
                  <p className="text-sm text-white/70">Great game, but I wish there were more levels. Can't wait for the next update!</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="mt-8 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0 border-4 border-black shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight mb-1 text-white">First Blood</h3>
                  <p className="text-sm text-white/60 font-medium">Complete the tutorial and win your first match.</p>
                </div>
                <div className="ml-auto text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                  Unlocked
                </div>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border-4 border-black">
                  <Trophy className="w-8 h-8 text-zinc-500" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight mb-1 text-white">Master of the Realm</h3>
                  <p className="text-sm text-white/60 font-medium">Reach level 50 and defeat the final boss.</p>
                </div>
                <div className="ml-auto text-xs font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
                  Locked
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Other Games */}
        <div className="w-full lg:w-80 flex flex-col shrink-0 gap-4 mt-8 lg:mt-0 overflow-hidden">
          <h3 className="text-sm font-black tracking-widest uppercase text-white/40 flex items-center gap-2 px-2 shrink-0">
            <Gamepad2 className="w-4 h-4" /> Recommended
          </h3>
          <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x snap-mandatory hide-scrollbar">
            {otherGames.map(game => (
              <div 
                key={game.id}
                onClick={() => window.location.href = game.route}
                className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 p-3 bg-white/5 border border-white/10 hover:border-white/30 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group shrink-0 w-[140px] lg:w-auto snap-start"
              >
                <img src={game.iconUrl} alt="icon" className="w-16 h-16 rounded-xl object-cover bg-black shrink-0" />
                <div className="flex-1 min-w-0 text-center lg:text-left">
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
