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
  Calendar,
  Play,
  ChevronDown,
  ArrowUp,
  Calculator,
  Award
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
  { id: 'aim', name: 'Aim Trainer', type: 'Arcade', icon: Target, color: 'text-red-500', creator: 'xakteir' },
  { id: 'balance', name: 'Balance Board', type: 'Puzzle', icon: Activity, color: 'text-green-500', creator: 'xakteir' },
  { id: 'basketball', name: 'Basketball Shoot', type: 'Sports', icon: Trophy, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'breaker', name: 'Brick Breaker', type: 'Arcade', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'bubble', name: 'Bubble Shooter', type: 'Puzzle', icon: Palette, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'clickSpeed', name: 'Click Speed', type: 'Arcade', icon: Zap, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'clicker', name: 'Idle Clicker', type: 'Strategy', icon: Award, color: 'text-amber-500', creator: 'xakteir' },
  { id: 'colorMatch', name: 'Color Match', type: 'Puzzle', icon: Palette, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'connectFour', name: 'Connect Four', type: 'Strategy', icon: Code2, color: 'text-red-500', creator: 'xakteir' },
  { id: 'dodge', name: 'Dodge Objects', type: 'Arcade', icon: Flame, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'drawing', name: 'Drawing Canvas', type: 'Discovery', icon: Palette, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'fishing', name: 'Fishing Game', type: 'Arcade', icon: Heart, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'flappy', name: 'Flappy Bird', type: 'Arcade', icon: Gamepad2, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'football3D', name: 'Football 3D', type: '3D', icon: Trophy, color: 'text-green-500', creator: 'xakteir' },
  { id: 'frogger', name: 'Frogger Cross', type: 'Arcade', icon: Activity, color: 'text-emerald-500', creator: 'xakteir' },
  { id: 'golf', name: 'Mini Golf', type: 'Sports', icon: Trophy, color: 'text-green-600', creator: 'xakteir' },
  { id: 'gravity', name: 'Gravity Flip', type: 'Arcade', icon: Zap, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'invaders', name: 'Space Invaders', type: 'Arcade', icon: Sword, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'jump', name: 'Infinite Jump', type: 'Arcade', icon: ArrowUp, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'knife', name: 'Knife Hit', type: 'Arcade', icon: Target, color: 'text-zinc-500', creator: 'xakteir' },
  { id: 'match3', name: 'Match 3', type: 'Puzzle', icon: Sparkles, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'math', name: 'Math Quiz', type: 'Puzzle', icon: Calculator, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'maze', name: 'Maze Solver', type: 'Puzzle', icon: Map, color: 'text-green-500', creator: 'xakteir' },
  { id: 'memory', name: 'Memory Cards', type: 'Puzzle', icon: Clock, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'minesweeper', name: 'Minesweeper', type: 'Strategy', icon: Target, color: 'text-red-500', creator: 'xakteir' },
  { id: 'paint', name: 'Paint & Draw', type: 'Discovery', icon: Palette, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'parking', name: 'Car Parking', type: 'Puzzle', icon: Code2, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'pinball', name: 'Pinball Classic', type: 'Arcade', icon: Zap, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'plinko', name: 'Plinko Drop', type: 'Arcade', icon: Sparkles, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'pong', name: 'Classic Pong', type: 'Arcade', icon: Activity, color: 'text-white', creator: 'xakteir' },
  { id: 'rps', name: 'Rock Paper Scissors', type: 'Strategy', icon: Sword, color: 'text-zinc-500', creator: 'xakteir' },
  { id: 'reaction', name: 'Reaction Time', type: 'Arcade', icon: Zap, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'sequence', name: 'Memory Sequence', type: 'Puzzle', icon: Code2, color: 'text-cyan-500', creator: 'xakteir' },
  { id: 'snake', name: 'Snake Game', type: 'Arcade', icon: Activity, color: 'text-green-500', creator: 'xakteir' },
  { id: 'spinWheel', name: 'Spin The Wheel', type: 'Discovery', icon: Sparkles, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'stack', name: 'Tower Stacker', type: 'Arcade', icon: Award, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'sudoku', name: 'Sudoku Classic', type: 'Puzzle', icon: Code2, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'tictactoe', name: 'Tic Tac Toe', type: 'Strategy', icon: Target, color: 'text-red-500', creator: 'xakteir' },
  { id: 'towerDefense', name: 'Tower Defense', type: 'Strategy', icon: Sword, color: 'text-emerald-500', creator: 'xakteir' },
  { id: 'trivia', name: 'Trivia Quiz', type: 'Discovery', icon: Heart, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'tunnel3D', name: 'Tunnel 3D', type: '3D', icon: Zap, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'twoZeroFourEight', name: '2048 Puzzle', type: 'Puzzle', icon: Target, color: 'text-amber-500', creator: 'xakteir' },
  { id: 'typing', name: 'Typing Test', type: 'Discovery', icon: Clock, color: 'text-zinc-500', creator: 'xakteir' },
  { id: 'whack', name: 'Whack-a-Mole', type: 'Arcade', icon: Flame, color: 'text-red-500', creator: 'xakteir' },
  { id: 'word', name: 'Word Search', type: 'Puzzle', icon: Target, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'xbr', name: 'XBR Arena', type: '3D', icon: Sword, color: 'text-indigo-500', creator: 'xakteir' }
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