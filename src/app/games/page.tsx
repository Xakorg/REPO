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

      {/* Tabs */}
      <div className="flex justify-center border-b border-[#d9d9d9] bg-white">
        <div className="flex gap-8 px-4 h-12">
          <button className="flex items-center gap-2 border-b-4 border-[#4cb715] text-[#4cb715] font-bold px-2 text-[15px]">
             Projects
          </button>
          <button className="flex items-center gap-2 text-[#575e75] font-bold px-2 opacity-50 hover:opacity-100 transition-opacity text-[15px]">
             Studios
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
           <div className="flex flex-wrap gap-2">
             {["All", "Animations", "Art", "Games", "Music", "Stories", "Tutorials"].map(cat => (
               <button 
                 key={cat}
                 onClick={() => setActiveCategory(cat === "All" ? "Discovery" : cat)}
                 className={cn(
                   "px-4 py-1.5 rounded-full font-bold text-[13px] transition-colors border",
                   (activeCategory === cat || (activeCategory === "Discovery" && cat === "All")) 
                     ? "bg-[#855cd6] text-white border-[#855cd6]" 
                     : "bg-white text-[#855cd6] border-[#855cd6] hover:bg-[#f0eaff]"
                 )}
               >
                 {cat}
               </button>
             ))}
           </div>
           <div className="flex items-center gap-2 cursor-pointer border border-[#d9d9d9] rounded px-3 py-1.5 hover:bg-zinc-50">
             <span className="font-bold text-[13px] text-[#575e75]">Trending</span>
             <ChevronDown className="w-4 h-4 text-[#575e75]" />
           </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredGames.slice(0, 30).map(game => (
            <div key={game.id} onClick={() => router.push(`/games/play/${game.id}`)} className="bg-white rounded overflow-hidden border border-[#d9d9d9] hover:shadow-md transition-shadow cursor-pointer flex flex-col group">
               <div className="aspect-[4/3] bg-zinc-100 flex items-center justify-center border-b border-[#d9d9d9] relative p-4">
                 <game.icon className={cn("w-16 h-16", game.color)} />
                 <div className="absolute top-2 left-2 bg-[#855cd6] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                   {game.type}
                 </div>
               </div>
               <div className="p-3 bg-white">
                 <h3 className="font-bold text-[#575e75] text-sm truncate group-hover:text-[#4cb715] transition-colors">{game.name}</h3>
                 <div className="flex items-center gap-2 mt-2">
                   <div className="w-6 h-6 bg-[#4cb715] rounded flex items-center justify-center shrink-0">
                     <span className="text-[10px] text-white font-bold uppercase">{game.creator.charAt(0)}</span>
                   </div>
                   <span className="text-[11px] font-bold text-[#575e75] truncate hover:underline">{game.creator}</span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
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