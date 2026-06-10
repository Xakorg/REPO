"use client";

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
  Palette
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORIES = ["Discovery", "Arcade", "Strategy", "Puzzle", "3D", "Sports", "Console"];

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
      isExternalConsole: false
    })) || [];

    return [...BUILT_IN_GAMES, ...formattedCommunity];
  }, [communityGames]);

  const filteredGames = allGames.filter(g => 
    (activeCategory === "Discovery" || g.type.toLowerCase().includes(activeCategory.toLowerCase())) &&
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-16 animate-fade-in py-12 max-w-[1800px] mx-auto px-8 text-foreground pb-40">
      <header className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-4 border-white/5 pb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl">
               <Gamepad2 className="w-10 h-10 text-primary" />
            </div>
            <div>
               <h1 className="text-8xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl text-white">Games</h1>
               <p className="text-xl font-bold uppercase tracking-[0.4em] text-primary/60 italic mt-4">Working Platform App</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="relative flex-1 md:w-[500px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Find a game..." 
              className="bg-card/40 backdrop-blur-3xl border-4 border-white/10 h-20 rounded-[2.5rem] pl-16 pr-8 text-xl font-bold italic shadow-inner focus:ring-primary uppercase text-white" 
            />
          </div>
          <Link href="/games/studio">
            <Button className="bg-primary hover:bg-primary/90 h-20 px-12 rounded-[2.2rem] font-black uppercase text-xl italic tracking-widest shadow-2xl text-white border-b-8 border-primary/20 active:border-b-0 transition-all border-none">STUDIO</Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <main className="lg:col-span-8 space-y-16">
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={cn(
                  "rounded-[2rem] px-12 h-16 font-black text-xs uppercase tracking-widest transition-all border-4 shadow-xl whitespace-nowrap", 
                  activeCategory === cat ? "bg-primary border-white/20 text-white scale-105" : "border-white/5 bg-card/40 text-muted-foreground hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {filteredGames.map(game => (
              <Card 
                key={game.id} 
                onClick={() => {
                  if (game.isExternalConsole) {
                    setSelectedConsoleGame(game);
                    setIsConsoleModalOpen(true);
                  } else {
                    router.push(`/games/play/${game.id}`);
                  }
                }} 
                className="glass-card group hover:-translate-y-6 transition-all duration-500 rounded-[4rem] overflow-hidden border-4 border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex flex-col cursor-pointer bg-zinc-950/40"
              >
                <div className="aspect-[16/10] flex items-center justify-center relative overflow-hidden bg-black/60">
                  <game.icon className={cn("w-24 h-24 transition-transform duration-1000 group-hover:scale-150", game.color)} />
                  <div className="absolute inset-0 arcade-grid opacity-20" />
                  <div className="absolute top-8 left-8">
                    <Badge className="bg-black/80 backdrop-blur-xl border-2 border-white/10 text-[9px] font-black uppercase px-6 py-2 rounded-full shadow-2xl border-none">
                      {game.isExternalConsole ? `Console / ${(game as any).platform}` : `by ${game.creator}`}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-12 flex-1 space-y-8">
                   <h3 className="text-4xl font-black text-foreground uppercase tracking-tighter italic leading-none drop-shadow-lg group-hover:text-primary transition-colors text-white">{game.name}</h3>
                   <Button className="w-full bg-primary hover:bg-primary/90 h-16 rounded-[2rem] font-black text-xs uppercase tracking-widest border-b-8 border-primary/20 shadow-2xl group-hover:scale-105 transition-all border-none">
                     {game.isExternalConsole ? "Launch Protocol" : "Launch Game"}
                   </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        <aside className="lg:col-span-4 space-y-16">
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

          <Card className="glass-card rounded-[4rem] p-12 border-white/10 bg-black/40 shadow-2xl text-center space-y-10">
             <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
                <Sparkles className="w-10 h-10 text-primary" />
             </div>
             <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Daily Bonus</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Login daily to earn 100 XP.</p>
             </div>
             <Button className="w-full h-16 bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-xl border-none">Claim 100 XP</Button>
          </Card>
        </aside>
      </div>

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