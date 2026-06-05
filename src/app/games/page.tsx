"use client";

import { useState, Suspense, useMemo } from "react";
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

const CATEGORIES = ["Discovery", "Arcade", "Strategy", "Puzzle", "3D", "Sports"];

const BUILT_IN_GAMES = [
  { id: 'xbr', name: 'XBR', type: 'Sports', icon: Flame, color: 'text-rose-500', featured: true, creator: 'xakteir' },
  { id: 'football3D', name: 'Pro Football 3D', type: 'Sports/3D', icon: Trophy, color: 'text-green-400', featured: true, creator: 'xakteir' },
  { id: 'jump', name: 'Void Runner', type: 'Arcade', icon: Zap, color: 'text-amber-500', creator: 'xakteir' },
  { id: 'math', name: 'Math Quest', type: 'Puzzle', icon: Code2, color: 'text-sky-400', creator: 'xakteir' },
  { id: 'dodge', name: 'Shard Dodge', type: 'Arcade', icon: Target, color: 'text-emerald-400', creator: 'xakteir' },
  { id: 'bubble', name: 'Bubble Pop', type: 'Arcade', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'whack', name: 'Whack Buddy', type: 'Arcade', icon: Activity, color: 'text-rose-400', creator: 'xakteir' },
  { id: 'reaction', name: 'Reaction Test', type: 'Puzzle', icon: Zap, color: 'text-yellow-400', creator: 'xakteir' },
  { id: 'colorMatch', name: 'Color Rush', type: 'Puzzle', icon: Palette, color: 'text-indigo-400', creator: 'xakteir' },
  { id: 'snake', name: 'Snake Zone', type: 'Arcade', icon: Zap, color: 'text-green-500', creator: 'xakteir' },
  { id: 'memory', name: 'Memory Match', type: 'Puzzle', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'tictactoe', name: 'Magic Toe', type: 'Strategy', icon: StarIcon, color: 'text-purple-500', creator: 'xakteir' },
  { id: 'aim', name: 'Aim Master', type: 'Strategy', icon: Target, color: 'text-red-500', creator: 'xakteir' },
  { id: 'balance', name: 'Balance Ball', type: 'Strategy', icon: Activity, color: 'text-teal-400', creator: 'xakteir' },
  { id: 'basketball', name: 'Street Hoop', type: 'Sports', icon: Trophy, color: 'text-orange-500', creator: 'xakteir' },
  { id: 'breaker', name: 'Brick Breaker', type: 'Arcade', icon: Zap, color: 'text-indigo-500', creator: 'xakteir' },
  { id: 'clickSpeed', name: 'Click Frenzy', type: 'Arcade', icon: Flame, color: 'text-yellow-500', creator: 'xakteir' },
  { id: 'clicker', name: 'Pixel Clicker', type: 'Arcade', icon: Plus, color: 'text-lime-500', creator: 'xakteir' },
  { id: 'connectFour', name: 'Connect Four', type: 'Strategy', icon: Sword, color: 'text-red-400', creator: 'xakteir' },
  { id: 'drawing', name: 'Neon Canvas', type: 'Discovery', icon: Palette, color: 'text-pink-400', creator: 'xakteir' },
  { id: 'fishing', name: 'Deep Sea Fisher', type: 'Discovery', icon: Sparkles, color: 'text-cyan-400', creator: 'xakteir' },
  { id: 'flappy', name: 'Flappy Shard', type: 'Arcade', icon: Zap, color: 'text-yellow-400', creator: 'xakteir' },
  { id: 'frogger', name: 'Road Crosser', type: 'Arcade', icon: Activity, color: 'text-green-400', creator: 'xakteir' },
  { id: 'golf', name: 'Mini Golf', type: 'Sports', icon: Trophy, color: 'text-emerald-500', creator: 'xakteir' },
  { id: 'gravity', name: 'Gravity Flip', type: 'Strategy', icon: Zap, color: 'text-fuchsia-500', creator: 'xakteir' },
  { id: 'invaders', name: 'Space Defender', type: 'Arcade', icon: Sword, color: 'text-purple-400', creator: 'xakteir' },
  { id: 'knife', name: 'Knife Throw', type: 'Arcade', icon: Target, color: 'text-gray-400', creator: 'xakteir' },
  { id: 'match3', name: 'Shard Match 3', type: 'Puzzle', icon: Sparkles, color: 'text-rose-400', creator: 'xakteir' },
  { id: 'maze', name: 'Neon Labyrinth', type: 'Puzzle', icon: Target, color: 'text-amber-600', creator: 'xakteir' },
  { id: 'minesweeper', name: 'Logic Sweeper', type: 'Puzzle', icon: Code2, color: 'text-zinc-400', creator: 'xakteir' },
  { id: 'paint', name: 'Glow Paint', type: 'Discovery', icon: Palette, color: 'text-violet-400', creator: 'xakteir' },
  { id: 'parking', name: 'Jam Solver', type: 'Puzzle', icon: Activity, color: 'text-blue-600', creator: 'xakteir' },
  { id: 'pinball', name: 'Neon Pinball', type: 'Arcade', icon: Flame, color: 'text-pink-500', creator: 'xakteir' },
  { id: 'plinko', name: 'Plinko Board', type: 'Arcade', icon: Sparkles, color: 'text-emerald-400', creator: 'xakteir' },
  { id: 'pong', name: 'Cyber Pong', type: 'Sports', icon: Trophy, color: 'text-slate-300', creator: 'xakteir' },
  { id: 'rps', name: 'R-P-S Duel', type: 'Strategy', icon: Sword, color: 'text-orange-400', creator: 'xakteir' },
  { id: 'sequence', name: 'Echo Simon', type: 'Puzzle', icon: Code2, color: 'text-teal-500', creator: 'xakteir' },
  { id: 'spinWheel', name: 'Wheel of Luck', type: 'Discovery', icon: Sparkles, color: 'text-rose-400', creator: 'xakteir' },
  { id: 'stack', name: 'Stacker Tower', type: 'Strategy', icon: Activity, color: 'text-indigo-400', creator: 'xakteir' },
  { id: 'sudoku', name: 'Sudoku Mind', type: 'Puzzle', icon: Code2, color: 'text-sky-500', creator: 'xakteir' },
  { id: 'towerDefense', name: 'Grid Sentry', type: 'Strategy', icon: Sword, color: 'text-amber-500', creator: 'xakteir' },
  { id: 'trivia', name: 'Trivia Rush', type: 'Puzzle', icon: StarIcon, color: 'text-purple-400', creator: 'xakteir' },
  { id: 'tunnel3D', name: 'Warp Speed 3D', type: 'Arcade/3D', icon: Zap, color: 'text-red-500', creator: 'xakteir' },
  { id: 'twoZeroFourEight', name: '2048 Grid', type: 'Puzzle', icon: Trophy, color: 'text-yellow-600', creator: 'xakteir' },
  { id: 'typing', name: 'Word Sprint', type: 'Discovery', icon: Code2, color: 'text-green-400', creator: 'xakteir' },
  { id: 'word', name: 'Word Matrix', type: 'Puzzle', icon: StarIcon, color: 'text-blue-400', creator: 'xakteir' }
];

function ArcadeHubContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeCategory, setActiveCategory] = useState("Discovery");
  const [search, setSearch] = useState("");

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
      isCommunity: true
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
               <h1 className="text-8xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl">Games</h1>
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
              className="bg-card/40 backdrop-blur-3xl border-4 border-white/10 h-20 rounded-[2.5rem] pl-16 pr-8 text-xl font-bold italic shadow-inner focus:ring-primary uppercase" 
            />
          </div>
          <Link href="/games/studio">
            <Button className="bg-primary hover:bg-primary/90 h-20 px-12 rounded-[2.2rem] font-black uppercase text-xl italic tracking-widest shadow-2xl text-white border-b-8 border-primary/20 active:border-b-0 transition-all">STUDIO</Button>
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
              <Card key={game.id} onClick={() => { router.push(`/games/play/${game.id}`); }} className="glass-card group hover:-translate-y-6 transition-all duration-500 rounded-[4rem] overflow-hidden border-4 border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex flex-col cursor-pointer bg-zinc-950/40">
                <div className="aspect-[16/10] flex items-center justify-center relative overflow-hidden bg-black/60">
                  <game.icon className={cn("w-24 h-24 transition-transform duration-1000 group-hover:scale-150", game.color)} />
                  <div className="absolute inset-0 arcade-grid opacity-20" />
                  <div className="absolute top-8 left-8">
                    <Badge className="bg-black/80 backdrop-blur-xl border-2 border-white/10 text-[9px] font-black uppercase px-6 py-2 rounded-full shadow-2xl">by {game.creator}</Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-12 flex-1 space-y-8">
                   <h3 className="text-4xl font-black text-foreground uppercase tracking-tighter italic leading-none drop-shadow-lg group-hover:text-primary transition-colors">{game.name}</h3>
                   <Button className="w-full bg-primary hover:bg-primary/90 h-16 rounded-[2rem] font-black text-xs uppercase tracking-widest border-b-8 border-primary/20 shadow-2xl group-hover:scale-105 transition-all">Launch Game</Button>
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
                       <p className="text-xl font-black text-foreground uppercase italic group-hover:text-amber-400 transition-colors">{entry.name || 'Member'}</p>
                    </div>
                    <span className="text-xl font-black text-amber-500 italic tabular-nums">{entry.score.toLocaleString()}</span>
                  </div>
                ))}
             </div>
             <Button variant="outline" className="w-full h-14 mt-10 rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest text-white hover:bg-amber-500 hover:text-white">Full Registry</Button>
          </Card>

          <Card className="glass-card rounded-[4rem] p-12 border-white/10 bg-black/40 shadow-2xl text-center space-y-10">
             <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
                <Sparkles className="w-10 h-10 text-primary" />
             </div>
             <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Daily Bonus</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Login daily to earn 100 XP.</p>
             </div>
             <Button className="w-full h-16 bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Claim 100 XP</Button>
          </Card>
        </aside>
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