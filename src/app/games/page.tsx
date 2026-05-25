"use client";

import { useState, Suspense, useMemo, useRef } from "react";
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
  Users, 
  X,
  Flame,
  ChevronRight,
  Code2,
  Activity,
  Target,
  Palette,
  Maximize,
  Minimize
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

// Games Components
import { SnakeGame } from "./components/SnakeGame";
import { MemoryGame } from "./components/MemoryGame";
import { TicTacToeGame } from "./components/TicTacToeGame";
import { Tunnel3DGame } from "./components/Tunnel3DGame";
import { ClickerGame } from "./components/ClickerGame";
import { Football3DGame } from "./components/Football3DGame";
import { XbrGame } from "./components/XbrGame";
import { BubbleGame } from "./components/BubbleGame";
import { MathGame } from "./components/MathGame";
import { ColorMatchGame } from "./components/ColorMatchGame";
import { ReactionGame } from "./components/ReactionGame";
import { WhackGame } from "./components/WhackGame";
import { JumpGame } from "./components/JumpGame";
import { DodgeGame } from "./components/DodgeGame";

const CATEGORIES = ["Discovery", "Arcade", "Strategy", "Puzzle", "3D", "Sports"];

const BUILT_IN_GAMES = [
  { id: 'xbr', name: 'XBR', type: 'Sports', icon: Flame, color: 'text-rose-500', featured: true, creator: 'xakteir' },
  { id: 'football', name: 'Pro Football 3D', type: 'Sports', icon: Trophy, color: 'text-green-400', featured: true, creator: 'xakteir' },
  { id: 'jump', name: 'Void Runner', type: 'Arcade', icon: Zap, color: 'text-amber-500', creator: 'xakteir' },
  { id: 'math', name: 'Math Quest', type: 'Puzzle', icon: Code2, color: 'text-sky-400', creator: 'xakteir' },
  { id: 'dodge', name: 'Shard Dodge', type: 'Arcade', icon: Target, color: 'text-emerald-400', creator: 'xakteir' },
  { id: 'bubble', name: 'Bubble Pop', type: 'Arcade', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'whack', name: 'Whack Buddy', type: 'Arcade', icon: Activity, color: 'text-rose-400', creator: 'xakteir' },
  { id: 'reaction', name: 'Reaction Test', type: 'Puzzle', icon: Zap, color: 'text-yellow-400', creator: 'xakteir' },
  { id: 'color', name: 'Color Rush', type: 'Puzzle', icon: Palette, color: 'text-indigo-400', creator: 'xakteir' },
  { id: 'snake', name: 'Snake Zone', type: 'Arcade', icon: Zap, color: 'text-green-500', creator: 'xakteir' },
  { id: 'memory', name: 'Memory Match', type: 'Puzzle', icon: Sparkles, color: 'text-blue-500', creator: 'xakteir' },
  { id: 'tictactoe', name: 'Magic Toe', type: 'Strategy', icon: StarIcon, color: 'text-purple-500', creator: 'xakteir' },
];

function ArcadeHubContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialPlay = searchParams.get('play');
  
  const [activeCategory, setActiveCategory] = useState("Discovery");
  const [playingGame, setPlayingGame] = useState<string | null>(initialPlay);
  const [isLobbyActive, setIsLobbyActive] = useState(true);
  const [search, setSearch] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

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
    (activeCategory === "Discovery" || g.type.includes(activeCategory)) &&
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeGameInfo = allGames.find(g => g.id === playingGame);

  const handleToggleFullscreen = () => {
    if (!gameContainerRef.current) return;
    if (!document.fullscreenElement) {
      gameContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        toast({ variant: "destructive", title: "Fullscreen failed" });
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

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
              <Card key={game.id} onClick={() => { setPlayingGame(game.id); setIsLobbyActive(true); }} className="glass-card group hover:-translate-y-6 transition-all duration-500 rounded-[4rem] overflow-hidden border-4 border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex flex-col cursor-pointer bg-zinc-950/40">
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

      {playingGame && (
        <div ref={gameContainerRef} className="fixed inset-0 z-[1000] bg-black animate-in fade-in duration-500 overflow-hidden flex flex-col">
          <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
          {isLobbyActive ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-20 relative z-10">
              <Button size="icon" variant="ghost" onClick={() => setPlayingGame(null)} className="absolute top-12 right-12 rounded-full h-20 w-20 bg-white/5 border-4 border-white/10 text-white hover:bg-rose-600 transition-all"><X className="w-10 h-10" /></Button>
              <div className="space-y-12 animate-in zoom-in-95 duration-1000">
                <div className={cn("w-64 h-64 md:w-80 md:h-80 rounded-[5rem] md:rounded-[7rem] mx-auto flex items-center justify-center border-8 border-white/20 shadow-[0_0_150px_rgba(var(--primary),0.3)] bg-zinc-900/50")}>
                  {activeGameInfo && <activeGameInfo.icon className={cn("w-32 h-32 md:w-48 md:h-48 animate-float", activeGameInfo.color)} />}
                </div>
                <div className="space-y-6">
                  <h2 className="text-7xl md:text-[10rem] font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-[0_0_60px_rgba(255,255,255,0.4)]">{activeGameInfo?.name}</h2>
                  <p className="text-muted-foreground font-black uppercase tracking-[1em] text-xs italic">Awaiting Player Synchronization...</p>
                </div>
                <Button onClick={() => setIsLobbyActive(false)} className="h-28 px-24 bg-primary hover:bg-primary/90 text-white rounded-[3.5rem] font-black text-3xl uppercase tracking-widest shadow-[0_40px_100px_rgba(var(--primary),0.6)] border-b-[16px] border-primary/20 active:border-b-0 active:translate-y-4 transition-all">START GAME</Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col relative w-full h-full bg-transparent">
              <div className="absolute top-10 right-10 z-[1100] flex gap-4">
                 <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleToggleFullscreen} 
                  className="rounded-full h-16 w-16 bg-black/60 backdrop-blur-xl border-4 border-white/10 hover:bg-primary transition-all shadow-2xl"
                 >
                    {isFullscreen ? <Minimize className="w-8 h-8" /> : <Maximize className="w-8 h-8" />}
                 </Button>
                 <Button size="icon" variant="ghost" onClick={() => setPlayingGame(null)} className="rounded-full h-16 w-16 bg-black/60 backdrop-blur-xl border-4 border-white/10 hover:bg-rose-600 transition-all shadow-2xl"><X className="w-8 h-8" /></Button>
              </div>
              <div className="flex-1 w-full h-full flex items-center justify-center p-0">
                {(() => {
                  const props = { onExit: () => setPlayingGame(null) };
                  switch(playingGame) {
                    case 'xbr': return <XbrGame {...props} />;
                    case 'football': return <Football3DGame {...props} />;
                    case 'snake': return <SnakeGame {...props} />;
                    case 'memory': return <MemoryGame {...props} />;
                    case 'tictactoe': return <TicTacToeGame {...props} />;
                    case 'bubble': return <BubbleGame {...props} />;
                    case 'math': return <MathGame {...props} />;
                    case 'color': return <ColorMatchGame {...props} />;
                    case 'reaction': return <ReactionGame {...props} />;
                    case 'whack': return <WhackGame {...props} />;
                    case 'jump': return <JumpGame {...props} />;
                    case 'dodge': return <DodgeGame {...props} />;
                    case 'clicker': return <ClickerGame {...props} />;
                    default: return (
                      <div className="text-center space-y-12 animate-in zoom-in-95">
                         <div className="w-40 h-40 rounded-[3.5rem] bg-zinc-900 border-8 border-white/10 flex items-center justify-center mx-auto shadow-2xl">
                            <Code2 className="w-20 h-20 text-primary" />
                         </div>
                         <div className="space-y-4">
                           <h3 className="text-7xl font-black text-white uppercase italic tracking-tighter">Compiled App</h3>
                           <p className="text-xl text-muted-foreground font-bold uppercase tracking-widest">Logic from creator: @{activeGameInfo?.creator}</p>
                         </div>
                         <Button onClick={() => setPlayingGame(null)} variant="outline" className="h-20 px-16 rounded-[2.5rem] border-8 border-white/10 font-black uppercase text-xs text-white hover:bg-white/10 transition-all">Return to Hub</Button>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      )}
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