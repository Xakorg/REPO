"use client";
import React from "react";

import { useState, Suspense, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Gamepad2, 
  Search, 
  Star as StarIcon, 
  Zap, 
  Sparkles, 
  Sword, 
  Trophy, 
  Plus, 
  Loader2, 
  Flame, 
  Code2, 
  Activity, 
  Target, 
  Palette,
  Heart,
  Mic,
  MicOff,
  Monitor,
  Settings,
  Users,
  Share2,
  Clock,
  PlaySquare,
  Save,
  Sliders,
  Map,
  Video,
  FastForward,
  Wrench,
  Crown,
  Calendar,
  Play,
  ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORIES = ["Discovery", "Arcade", "Strategy", "Puzzle", "3D", "Sports", "Console", "Favorites"];

const BUILT_IN_GAMES = [
  { id: 'game_0', name: 'Aqua Knight', type: 'Arcade', icon: Zap, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_1', name: 'Crystal Knight', type: 'Arcade', icon: Trophy, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_2', name: 'Neon Knight', type: 'Sports', icon: Target, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_3', name: 'Retro Pulse', type: 'Arcade', icon: Zap, color: 'text-rose-500', creator: 'xakteir' },
  { id: 'game_4', name: 'Space Fighter', type: 'Strategy', icon: Palette, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_5', name: 'Magic Maze', type: 'Strategy', icon: Trophy, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'game_6', name: 'Crystal Rush', type: 'Arcade', icon: Target, color: 'text-rose-500', creator: 'xakteir' },
  { id: 'game_7', name: 'Crystal Strike', type: '3D', icon: Activity, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_8', name: 'Mega Dash', type: '3D', icon: Sparkles, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_9', name: 'Shadow Pulse', type: 'Discovery', icon: Flame, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_10', name: 'Neon Hunter', type: 'Arcade', icon: Activity, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_11', name: 'Aero Pulse', type: '3D', icon: StarIcon, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_12', name: 'Mega Dash', type: 'Discovery', icon: Activity, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_13', name: 'Space Rider', type: 'Sports', icon: Palette, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_14', name: 'Mega Knight', type: 'Discovery', icon: Trophy, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_15', name: 'Hyper Ninja', type: 'Sports', icon: Code2, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_16', name: 'Mega Quest', type: 'Arcade', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_17', name: 'Plasma Rush', type: 'Puzzle', icon: Flame, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'game_18', name: 'Plasma Puzzler', type: 'Sports', icon: Code2, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_19', name: 'Crystal Hunter', type: 'Sports', icon: Trophy, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_20', name: 'Cosmic Runner', type: 'Puzzle', icon: Trophy, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'game_21', name: 'Hyper Builder', type: 'Strategy', icon: Zap, color: 'text-green-500', creator: 'xakteir' },
  { id: 'game_22', name: 'Quantum Pulse', type: '3D', icon: Activity, color: 'text-rose-500', creator: 'xakteir' },
  { id: 'game_23', name: 'Cosmic Survivor', type: 'Strategy', icon: Flame, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_24', name: 'Crystal Pulse', type: 'Discovery', icon: Zap, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_25', name: 'Pixel Ninja', type: 'Discovery', icon: Activity, color: 'text-rose-500', creator: 'xakteir' },
  { id: 'game_26', name: 'Quantum Maze', type: '3D', icon: Sparkles, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_27', name: 'Mega Builder', type: 'Puzzle', icon: Sword, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_28', name: 'Super Builder', type: 'Arcade', icon: Activity, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_29', name: 'Aqua Ninja', type: 'Arcade', icon: Gamepad2, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_30', name: 'Cosmic Quest', type: 'Strategy', icon: Activity, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'game_31', name: 'Pixel Hunter', type: 'Strategy', icon: Activity, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_32', name: 'Quantum Ninja', type: 'Sports', icon: StarIcon, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_33', name: 'Neon Knight', type: 'Discovery', icon: Palette, color: 'text-green-500', creator: 'xakteir' },
  { id: 'game_34', name: 'Ultra Puzzler', type: 'Sports', icon: Flame, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_35', name: 'Pixel Fighter', type: 'Arcade', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_36', name: 'Shadow Dash', type: '3D', icon: Sword, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_37', name: 'Space Pilot', type: 'Arcade', icon: Activity, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_38', name: 'Magic Maze', type: 'Discovery', icon: Target, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_39', name: 'Space Runner', type: 'Sports', icon: Palette, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_40', name: 'Magic Pilot', type: 'Strategy', icon: Target, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_41', name: 'Iron Rider', type: 'Arcade', icon: StarIcon, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_42', name: 'Crystal Knight', type: 'Discovery', icon: Flame, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_43', name: 'Space Pilot', type: '3D', icon: Zap, color: 'text-rose-500', creator: 'xakteir' },
  { id: 'game_44', name: 'Terra Rush', type: 'Discovery', icon: Activity, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_45', name: 'Ultra Drifter', type: 'Strategy', icon: Activity, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'game_46', name: 'Ultra Breaker', type: 'Strategy', icon: Gamepad2, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_47', name: 'Retro Runner', type: '3D', icon: StarIcon, color: 'text-rose-500', creator: 'xakteir' },
  { id: 'game_48', name: 'Plasma Maze', type: '3D', icon: Sword, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_49', name: 'Magic Maze', type: 'Arcade', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_50', name: 'Quantum Hunter', type: 'Strategy', icon: Gamepad2, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_51', name: 'Hyper Knight', type: 'Strategy', icon: Sparkles, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_52', name: 'Aqua Strike', type: '3D', icon: Palette, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_53', name: 'Retro Pulse', type: '3D', icon: Sparkles, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_54', name: 'Aqua Quest', type: 'Strategy', icon: Activity, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_55', name: 'Ultra Puzzler', type: 'Sports', icon: Trophy, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_56', name: 'Retro Builder', type: '3D', icon: Flame, color: 'text-green-500', creator: 'xakteir' },
  { id: 'game_57', name: 'Neon Pilot', type: 'Arcade', icon: Gamepad2, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_58', name: 'Ultra Maze', type: 'Strategy', icon: Target, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_59', name: 'Space Maze', type: 'Puzzle', icon: Sword, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_60', name: 'Gravity Builder', type: 'Sports', icon: Gamepad2, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_61', name: 'Cosmic Drifter', type: '3D', icon: Flame, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_62', name: 'Aero Pulse', type: 'Strategy', icon: Sparkles, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_63', name: 'Plasma Rider', type: 'Puzzle', icon: Gamepad2, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_64', name: 'Terra Knight', type: '3D', icon: StarIcon, color: 'text-rose-500', creator: 'xakteir' },
  { id: 'game_65', name: 'Cyber Builder', type: '3D', icon: Palette, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_66', name: 'Magic Puzzler', type: 'Strategy', icon: Sword, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_67', name: 'Gravity Hunter', type: '3D', icon: Target, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_68', name: 'Hyper Dash', type: 'Discovery', icon: Palette, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_69', name: 'Crystal Master', type: 'Discovery', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_70', name: 'Cyber Dash', type: '3D', icon: Activity, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_71', name: 'Terra Master', type: 'Discovery', icon: Sparkles, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_72', name: 'Aero Drifter', type: 'Arcade', icon: Target, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_73', name: 'Quantum Fighter', type: 'Discovery', icon: Sword, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'game_74', name: 'Super Master', type: 'Strategy', icon: StarIcon, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_75', name: 'Ultra Pilot', type: '3D', icon: Target, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'game_76', name: 'Aqua Knight', type: 'Strategy', icon: Palette, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'game_77', name: 'Pixel Maze', type: 'Sports', icon: Sword, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_78', name: 'Quantum Master', type: 'Puzzle', icon: Zap, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_79', name: 'Retro Quest', type: '3D', icon: StarIcon, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'game_80', name: 'Aqua Knight', type: 'Sports', icon: Sword, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'game_81', name: 'Magic Pilot', type: 'Strategy', icon: Trophy, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'game_82', name: 'Terra Pilot', type: 'Sports', icon: Target, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_83', name: 'Quantum Dash', type: 'Discovery', icon: Sword, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'game_84', name: 'Aero Quest', type: 'Strategy', icon: Zap, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'game_85', name: 'Terra Defender', type: 'Strategy', icon: Sword, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_86', name: 'Aqua Fighter', type: 'Arcade', icon: Trophy, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'game_87', name: 'Magic Pilot', type: 'Discovery', icon: Palette, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_88', name: 'Quantum Breaker', type: 'Puzzle', icon: Gamepad2, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_89', name: 'Ultra Pulse', type: 'Arcade', icon: Sparkles, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_90', name: 'Super Defender', type: 'Arcade', icon: Sword, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_91', name: 'Neon Builder', type: '3D', icon: Target, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_92', name: 'Shadow Knight', type: 'Arcade', icon: Code2, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_93', name: 'Magic Drifter', type: '3D', icon: Sparkles, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'game_94', name: 'Neon Puzzler', type: 'Sports', icon: Zap, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_95', name: 'Cosmic Rush', type: 'Arcade', icon: Sparkles, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'game_96', name: 'Mega Puzzler', type: 'Strategy', icon: Code2, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'game_97', name: 'Gravity Drifter', type: '3D', icon: Sword, color: 'text-red-500', creator: 'xakteir' },
  { id: 'game_98', name: 'Magic Fighter', type: 'Discovery', icon: Sword, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'game_99', name: 'Mega Fighter', type: '3D', icon: Sword, color: 'text-orange-500', creator: 'xakteir' }
];

function ArcadeHubContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeCategory, setActiveCategory] = useState("Discovery");
  const [search, setSearch] = useState("");

  // New Global State Features
  const [favorites, setFavorites] = useState<string[]>([]);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [controllerEnabled, setControllerEnabled] = useState(false);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [devConsole, setDevConsole] = useState(false);
  const [retroCore, setRetroCore] = useState(false);

  // Pre-Game Lobby Modal States
  const [selectedLobbyGame, setSelectedLobbyGame] = useState<any>(null);
  const [lobbyTab, setLobbyTab] = useState("play");
  const [difficulty, setDifficulty] = useState("Normal");
  const [sandboxMode, setSandboxMode] = useState(false);
  const [coopPlayers, setCoopPlayers] = useState(1);
  const [minimap, setMinimap] = useState(true);
  const [speedrun, setSpeedrun] = useState(false);
  const [replay, setReplay] = useState(false);
  const [modsEnabled, setModsEnabled] = useState(false);

  // Console Modal States
  const [selectedConsoleGame, setSelectedConsoleGame] = useState<any>(null);
  const [isConsoleModalOpen, setIsConsoleModalOpen] = useState(false);
  const [epicConnected, setEpicConnected] = useState(false);
  const [epicEmail, setEpicEmail] = useState("");
  const [epicPassword, setEpicPassword] = useState("");

  const leaderboardQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "leaderboard"), orderBy("score", "desc"), limit(10));
  }, [firestore]);
  const { data: leaderboard } = useCollection(leaderboardQuery);

  const communityGamesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "publishedProjects"), where("type", "==", "game"), limit(50));
  }, [firestore]);
  const { data: communityGames } = useCollection(communityGamesQuery);

  const allGames = useMemo(() => {
    const formattedCommunity = communityGames?.map(g => ({
      id: g.id,
      name: g.name,
      type: 'Arcade',
      icon: Code2,
      color: 'text-sky-400',
      creator: g.ownerName,
      isCommunity: true,
      isExternalConsole: false,
      rating: (Math.random() * 2 + 3).toFixed(1),
      playtime: Math.floor(Math.random() * 100)
    })) || [];

    return [...BUILT_IN_GAMES.map(g => ({...g, rating: (Math.random() * 2 + 3).toFixed(1), playtime: Math.floor(Math.random() * 100)})), ...formattedCommunity];
  }, [communityGames]);

  const filteredGames = allGames.filter(g => 
    (activeCategory === "Discovery" || 
     (activeCategory === "Favorites" ? favorites.includes(g.id) : g.type.toLowerCase().includes(activeCategory.toLowerCase()))) &&
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#575e75] font-sans">
      {/* Green Header */}
      <header className="h-14 bg-[#4cb715] flex items-center justify-center relative shadow-sm">
        <h1 className="text-3xl font-black text-white tracking-wide">Explore</h1>
      </header>

                  } else {
                    setSelectedLobbyGame(game);
                  }
                }} 
                className="glass-card group hover:-translate-y-6 transition-all duration-500 rounded-[4rem] overflow-hidden border-4 border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex flex-col cursor-pointer bg-zinc-950/40"
              >
                <div className="aspect-[16/10] flex items-center justify-center relative overflow-hidden bg-black/60">
                  <game.icon className={cn("w-24 h-24 transition-transform duration-1000 group-hover:scale-150", game.color)} />
                  <div className="absolute inset-0 arcade-grid opacity-20" />
                  <div className="absolute top-8 left-8 flex gap-2">
                    <Badge className="bg-black/80 backdrop-blur-xl border-2 border-white/10 text-[9px] font-black uppercase px-6 py-2 rounded-full shadow-2xl border-none">
                      {(game as any).isExternalConsole ? `Console / ${(game as any).platform}` : `by ${game.creator}`}
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-400 border-none px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                      <StarIcon className="w-3 h-3 fill-current" /> {game.rating}
                    </Badge>
                  </div>
                  <button 
                    onClick={(e) => toggleFavorite(e, game.id)}
                    className="absolute top-8 right-8 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors z-10"
                  >
                    <Heart className={cn("w-5 h-5", favorites.includes(game.id) ? "text-rose-500 fill-rose-500" : "text-white")} />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-12 flex-1 space-y-8">
                   <h3 className="text-4xl font-black text-foreground uppercase tracking-tighter italic leading-none drop-shadow-lg group-hover:text-primary transition-colors text-white">{game.name}</h3>
                   <div className="flex gap-2 flex-wrap">
                     <Badge variant="outline" className="border-white/10 text-muted-foreground uppercase text-[9px] font-bold">{game.type}</Badge>
                     {game.playtime > 50 && <Badge variant="outline" className="border-amber-500/30 text-amber-500 uppercase text-[9px] font-bold">Popular</Badge>}
                   </div>
                   <Button className="w-full bg-primary hover:bg-primary/90 h-16 rounded-[2rem] font-black text-xs uppercase tracking-widest border-b-8 border-primary/20 shadow-2xl group-hover:scale-105 transition-all border-none">
                     {(game as any).isExternalConsole ? "Launch Protocol" : "Enter Lobby"}
                   </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        <aside className="lg:col-span-4 space-y-10">
          {/* Global Hall Leaderboard */}
          <Card className="glass-card rounded-[4.5rem] p-12 border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Trophy className="w-48 h-48 -rotate-12" /></div>
             <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-6 text-amber-400 mb-12 relative z-10">
               <Trophy className="w-10 h-10" /> Global Hall
             </h3>
             <div className="space-y-8 relative z-10">
                {(leaderboard || [
                  { name: "Ridwan", score: 14280 },
                  { name: "Rayhan", score: 12500 },
                  { name: "CreatorX", score: 10200 }
                ]).map((entry: any, i) => (
                  <div key={i} className="flex items-center justify-between group p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-amber-500/40 transition-all">
                    <div className="flex items-center gap-6">
                       <span className="text-lg font-black text-muted-foreground w-6 italic">0{i+1}</span>
                       <p className="text-xl font-black text-foreground uppercase italic group-hover:text-amber-400 transition-colors text-white">{entry.name || 'Member'}</p>
                    </div>
                    <span className="text-xl font-black text-amber-500 italic tabular-nums">{entry.score.toLocaleString()}</span>
                  </div>
                ))}
             </div>
             <Button variant="outline" className="w-full h-14 mt-10 rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest text-white hover:bg-amber-500 hover:text-white bg-white/5">Full Registry</Button>
          </Card>

          {/* Achievements & Trophies */}
          <Card className="glass-card rounded-[3rem] p-10 border-white/10 bg-black/40 shadow-2xl space-y-8">
             <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
               <Crown className="w-6 h-6 text-yellow-400" /> Recent Trophies
             </h3>
             <div className="grid grid-cols-4 gap-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-yellow-400/20 hover:border-yellow-400/50 transition-all cursor-help" title={`Achievement ${i}`}>
                   <Trophy className="w-6 h-6 text-yellow-400/50" />
                 </div>
               ))}
             </div>
          </Card>

          {/* Tournaments Widget */}
          <Card className="glass-card rounded-[3rem] p-10 border-white/10 bg-black/40 shadow-2xl space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="w-32 h-32" /></div>
             <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3 relative z-10">
               <Target className="w-6 h-6 text-rose-500" /> Active Tournaments
             </h3>
             <div className="space-y-4 relative z-10">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/50 transition-all">
                 <h4 className="text-sm font-black text-white uppercase">Neon Strike Championship</h4>
                 <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">Ends in 2d 14h</p>
               </div>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/50 transition-all">
                 <h4 className="text-sm font-black text-white uppercase">Puzzle Master League</h4>
                 <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">Ends in 5d 02h</p>
               </div>
             </div>
          </Card>

          {/* Daily Challenges */}
          <Card className="glass-card rounded-[4rem] p-12 border-white/10 bg-primary/5 shadow-2xl text-center space-y-10 border border-primary/20">
             <div className="w-20 h-20 rounded-[2rem] bg-primary/20 border-4 border-primary/40 flex items-center justify-center mx-auto shadow-2xl animate-float">
                <Flame className="w-10 h-10 text-primary" />
             </div>
             <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Daily Streak: 5</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Complete 3 games today.</p>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-primary w-2/3 rounded-full" />
                </div>
             </div>
             <Button className="w-full h-16 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase tracking-widest shadow-xl border-none">Claim 100 XP</Button>
          </Card>
        </aside>
      </div>

      {/* Pre-Game Lobby Modal */}
      <Dialog open={!!selectedLobbyGame} onOpenChange={(open) => !open && setSelectedLobbyGame(null)}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-3xl border-4 border-white/10 rounded-[3rem] text-white p-0 max-w-5xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-hidden flex flex-col">
          {selectedLobbyGame && (
            <>
              {/* Header */}
              <div className="p-10 pb-6 border-b border-white/5 flex gap-8 items-center bg-black/40 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 arcade-grid opacity-10" />
                <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center border-2 border-white/10 relative z-10">
                  <selectedLobbyGame.icon className={cn("w-12 h-12", selectedLobbyGame.color)} />
                </div>
                <div className="flex-1 relative z-10">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{selectedLobbyGame.name}</h2>
                  <div className="flex gap-4 mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1"><StarIcon className="w-4 h-4 text-amber-400" /> {selectedLobbyGame.rating} Rating</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4 text-blue-400" /> 1.2k Playing</span>
                    <span className="flex items-center gap-1"><Save className="w-4 h-4 text-emerald-400" /> Synced</span>
                  </div>
                </div>
                <Button className="bg-white/10 hover:bg-white/20 border-none rounded-2xl h-12 px-6 font-black uppercase text-xs">
                  <Save className="w-4 h-4 mr-2" /> Force Cloud Sync
                </Button>
              </div>

              {/* Lobby Tabs */}
              <div className="flex px-10 border-b border-white/5 bg-black/20 shrink-0">
                {['play', 'leaderboards', 'matchmaking', 'settings'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setLobbyTab(tab)}
                    className={cn(
                      "px-8 py-6 font-black uppercase text-sm tracking-widest border-b-4 transition-all",
                      lobbyTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-10 overflow-y-auto flex-1">
                {lobbyTab === 'play' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase text-muted-foreground">Game Mode</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="h-20 rounded-2xl border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 font-black uppercase flex flex-col gap-2">
                            <Gamepad2 className="w-6 h-6" /> Solo Play
                          </Button>
                          <Button variant="outline" className="h-20 rounded-2xl border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 font-black uppercase flex flex-col gap-2">
                            <Users className="w-6 h-6" /> Co-op
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase text-muted-foreground">Local Co-op Players</h4>
                        <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10 h-20">
                          {[1,2,3,4].map(num => (
                            <button 
                              key={num} 
                              onClick={() => setCoopPlayers(num)}
                              className={cn("w-12 h-12 rounded-xl font-black text-lg transition-all", coopPlayers === num ? "bg-primary text-white" : "bg-white/10 text-muted-foreground hover:bg-white/20")}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-8 border-t border-white/5">
                      <Button onClick={() => router.push(`/games/play/${selectedLobbyGame.id}`)} className="flex-1 h-20 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase text-2xl tracking-widest border-none shadow-[0_0_40px_rgba(var(--primary),0.3)]">
                        Launch Game
                      </Button>
                      <Button variant="outline" className="w-20 h-20 rounded-[2rem] border-white/10 bg-white/5 hover:bg-white/10" title="Spectate Mode">
                        <Video className="w-8 h-8 text-white" />
                      </Button>
                    </div>
                  </div>
                )}

                {lobbyTab === 'leaderboards' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black uppercase italic">Top Scores</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 uppercase text-[10px] font-bold">Global</Button>
                        <Button variant="outline" size="sm" className="bg-transparent border-white/10 uppercase text-[10px] font-bold text-muted-foreground">Friends</Button>
                        <Button variant="outline" size="sm" className="bg-white/5 border-white/10" title="Share High Score"><Share2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-black text-muted-foreground">#{i}</span>
                            <span className="font-bold uppercase text-white">Player_{Math.floor(Math.random()*9000)+1000}</span>
                          </div>
                          <span className="font-black text-amber-400 font-mono">{(10000 - i*500).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lobbyTab === 'matchmaking' && (
                  <div className="space-y-8 animate-fade-in flex flex-col items-center justify-center py-10">
                    <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <Users className="w-12 h-12 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black uppercase italic text-white">Looking for Players</h3>
                      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estimated Wait: 0:45</p>
                    </div>
                    <Button variant="outline" className="h-12 px-8 rounded-xl border-rose-500/50 text-rose-400 hover:bg-rose-500/10 font-black uppercase text-xs">Cancel Search</Button>
                  </div>
                )}

                {lobbyTab === 'settings' && (
                  <div className="grid grid-cols-2 gap-8 animate-fade-in">
                    <div className="space-y-6">
                      <h4 className="text-sm font-black uppercase text-primary border-b border-white/10 pb-2">Gameplay</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-muted-foreground">AI Difficulty</span>
                          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold uppercase text-white outline-none">
                            <option>Easy</option>
                            <option>Normal</option>
                            <option>Hard</option>
                            <option>Extreme</option>
                          </select>
                        </div>
                        <label className="flex justify-between items-center cursor-pointer">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Sandbox Mode</span>
                          <input type="checkbox" checked={sandboxMode} onChange={(e) => setSandboxMode(e.target.checked)} className="accent-primary w-4 h-4" />
                        </label>
                        <label className="flex justify-between items-center cursor-pointer">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Speedrun Timer</span>
                          <input type="checkbox" checked={speedrun} onChange={(e) => setSpeedrun(e.target.checked)} className="accent-primary w-4 h-4" />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-sm font-black uppercase text-primary border-b border-white/10 pb-2">Interface & Mods</h4>
                      <div className="space-y-4">
                        <label className="flex justify-between items-center cursor-pointer">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Mini-map Overlay</span>
                          <input type="checkbox" checked={minimap} onChange={(e) => setMinimap(e.target.checked)} className="accent-primary w-4 h-4" />
                        </label>
                        <label className="flex justify-between items-center cursor-pointer">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Replay Recording</span>
                          <input type="checkbox" checked={replay} onChange={(e) => setReplay(e.target.checked)} className="accent-primary w-4 h-4" />
                        </label>
                        <label className="flex justify-between items-center cursor-pointer">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Enable Mods / Custom Levels</span>
                          <input type="checkbox" checked={modsEnabled} onChange={(e) => setModsEnabled(e.target.checked)} className="accent-primary w-4 h-4" />
                        </label>
                      </div>
                    </div>
                    <div className="col-span-2 pt-4 border-t border-white/10">
                      <Button variant="outline" className="w-full h-12 bg-white/5 border-white/10 font-black uppercase text-xs tracking-widest hover:bg-white/10">
                        <Sliders className="w-4 h-4 mr-2" /> Customize Keybinds
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cloud Gaming Console Launcher Dialog */}
      <Dialog open={isConsoleModalOpen} onOpenChange={setIsConsoleModalOpen}>
        <DialogContent className="bg-zinc-950 border-4 border-white/10 rounded-[3rem] text-white p-10 max-w-xl shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-purple-500">
              {selectedConsoleGame?.name} Launcher
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Target Platform</p>
                <p className="text-sm font-black text-white uppercase italic mt-1">{selectedConsoleGame?.platform}</p>
              </div>
              <Badge className="bg-purple-600 text-white font-black text-[9px] px-3 py-1 uppercase rounded-full border-none">
                Web OS Direct Integration
              </Badge>
            </div>

            {selectedConsoleGame?.platform === 'Epic Games' && (
              <div className="space-y-4 p-6 bg-purple-950/10 border border-purple-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className={cn("w-2.5 h-2.5 rounded-full", epicConnected ? "bg-green-500 animate-pulse" : "bg-zinc-500")} />
                  <h4 className="text-xs font-black uppercase text-zinc-300">Epic Games Authentication</h4>
                </div>
                {epicConnected ? (
                  <div>
                    <p className="text-[10px] text-zinc-400 font-medium">Link Status: Connected</p>
                    <p className="text-xs font-bold text-white mt-1">user: {epicEmail || user?.email || "admin@epicgames.com"}</p>
                    <Button 
                      variant="link" 
                      onClick={() => setEpicConnected(false)} 
                      className="text-xs text-rose-500 font-bold p-0 h-auto mt-2 uppercase"
                    >
                      Disconnect Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      value={epicEmail}
                      onChange={(e) => setEpicEmail(e.target.value)}
                      placeholder="Epic Games Email..."
                      className="bg-zinc-900 border-white/5 h-10 rounded-xl text-xs font-bold text-white"
                    />
                    <Input
                      type="password"
                      value={epicPassword}
                      onChange={(e) => setEpicPassword(e.target.value)}
                      placeholder="Password..."
                      className="bg-zinc-900 border-white/5 h-10 rounded-xl text-xs font-bold text-white"
                    />
                    <Button 
                      onClick={() => {
                        if (epicEmail.trim()) {
                          setEpicConnected(true);
                          toast({ title: "Epic Account Connected!" });
                        }
                      }}
                      className="w-full h-10 bg-purple-600 rounded-xl font-black text-[10px] uppercase border-none"
                    >
                      Connect Epic Games Account
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-zinc-400 font-bold leading-relaxed italic">
                This console application will be triggered on your host environment using secure protocol URI schemas. No client installation or downloads required.
              </p>
              <Button 
                onClick={() => {
                  toast({ title: "Initializing Game Node...", description: "Connecting and forwarding protocol request." });
                  setTimeout(() => {
                    if (selectedConsoleGame.platform === 'Epic Games') {
                      window.open(selectedConsoleGame.urlScheme, "_blank");
                    } else {
                      window.location.href = selectedConsoleGame.urlScheme;
                    }
                  }, 800);
                }}
                disabled={selectedConsoleGame?.platform === 'Epic Games' && !epicConnected}
                className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest border-none"
              >
                Launch Game Node
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GamesHubPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-20 h-20 animate-spin text-primary opacity-20" /></div>}>
      <ArcadeHubContent />
    </Suspense>
  );
}