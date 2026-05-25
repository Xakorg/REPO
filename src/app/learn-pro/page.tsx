
"use client";

import { useState } from "react";
import { 
  Zap, 
  Gamepad2, 
  Plus, 
  Play, 
  Users, 
  Trophy, 
  Sparkles, 
  Cat, 
  Dog, 
  Rabbit, 
  Ghost,
  Loader2,
  Settings,
  Search,
  LayoutGrid,
  ShoppingBag,
  Flame,
  Star,
  ChevronRight,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

const BLOOKS = [
  { id: 'cat', icon: Cat, name: 'Xak-Cat', color: 'text-primary', rarity: 'Common' },
  { id: 'dog', icon: Dog, name: 'Xak-Dog', color: 'text-blue-400', rarity: 'Common' },
  { id: 'rabbit', icon: Rabbit, name: 'Xak-Bunny', color: 'text-pink-400', rarity: 'Rare' },
  { id: 'ghost', icon: Ghost, name: 'Xak-Ghost', color: 'text-emerald-400', rarity: 'Legendary' },
];

export default function XakteirQuestPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("discover");
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!joinCode.trim() || isJoining) return;
    setIsJoining(true);
    setTimeout(() => {
      toast({ title: "Connecting...", description: `Joining session ${joinCode}` });
      setIsJoining(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-8 animate-fade-in px-6 text-foreground">
      {/* Blooket Style Top Bar */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6 glass-card p-6 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Quest</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">Ecosystem Arena</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-sm font-black italic">1,240 Energy</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black italic">Level 12</span>
          </div>
          <div className="w-px h-8 bg-white/10 mx-2" />
          <div className="flex gap-2">
            <Input 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Join Code..." 
              className="w-32 bg-secondary/30 border-white/10 h-10 rounded-lg font-black text-center text-xs tracking-widest" 
            />
            <Button onClick={handleJoin} disabled={isJoining} className="bg-primary h-10 px-6 rounded-lg font-black uppercase text-[10px] shadow-lg">
              {isJoining ? <Loader2 className="animate-spin w-4 h-4" /> : "Join"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Navigation */}
      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-64 space-y-4">
          {[
            { id: 'discover', label: 'Discover', icon: Search },
            { id: 'my-kits', label: 'My Kits', icon: LayoutGrid },
            { id: 'market', label: 'Blooks', icon: ShoppingBag },
            { id: 'stats', label: 'Stats', icon: Trophy },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-5 rounded-2xl transition-all border-4 font-black uppercase text-[10px] tracking-widest",
                activeTab === item.id 
                  ? "bg-primary border-white/20 text-white shadow-xl scale-105" 
                  : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          <Button className="w-full h-16 mt-10 bg-rose-600 hover:bg-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl border-b-4 border-rose-800">
            <Plus className="w-5 h-5 mr-2" /> Create Kit
          </Button>
        </aside>

        <main className="flex-1">
          {activeTab === 'discover' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Explore Kits</h2>
                <div className="flex gap-4">
                  <Badge className="bg-blue-500/20 text-blue-400 border-none px-4 py-1.5 font-black">All Subjects</Badge>
                  <Badge variant="outline" className="border-white/10 px-4 py-1.5 font-black">Newest</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[
                  { title: 'Global Capitals', plays: '4.2M', author: 'XakAdmin', color: 'bg-blue-500' },
                  { title: 'Neural Logic 101', plays: '1.5M', author: 'ApexDev', color: 'bg-primary' },
                  { title: 'History of Mars', plays: '850K', author: 'StarLord', color: 'bg-rose-500' },
                  { title: 'Space Science', plays: '2.1M', author: 'Nova', color: 'bg-amber-500' },
                  { title: 'Language Arts', plays: '1.1M', author: 'Lyric', color: 'bg-emerald-500' },
                  { title: 'Math Wizards', plays: '3.4M', author: 'Calculus', color: 'bg-indigo-500' },
                ].map((kit, i) => (
                  <Card key={i} className="glass-card rounded-[2.5rem] border-white/10 overflow-hidden hover:border-primary/40 transition-all cursor-pointer group">
                    <div className={cn("h-32 p-6 relative flex items-center justify-center", kit.color)}>
                      <div className="absolute inset-0 arcade-grid opacity-20" />
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/20">
                        <Gamepad2 className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-8 space-y-4">
                      <h3 className="text-xl font-black uppercase italic truncate">{kit.title}</h3>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>@{kit.author}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {kit.plays}</span>
                      </div>
                      <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest mt-4">Host Game</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 bg-amber-500/10 p-8 rounded-[3rem] border-4 border-amber-500/20">
                <ShoppingBag className="w-12 h-12 text-amber-500" />
                <div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Blook Market</h2>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Collect 'em all! Next box in 2h 42m</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {BLOOKS.map(blook => (
                  <Card key={blook.id} className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center gap-6 group hover:border-primary transition-all">
                    <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-xl transition-transform group-hover:scale-110">
                      <blook.icon className={cn("w-12 h-12", blook.color)} />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-black uppercase italic">{blook.name}</h4>
                      <Badge className={cn(
                        "mt-2 text-[8px] font-black uppercase border-none",
                        blook.rarity === 'Legendary' ? 'bg-amber-500 text-white' : 
                        blook.rarity === 'Rare' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'
                      )}>{blook.rarity}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'my-kits' && (
            <div className="h-[600px] flex flex-col items-center justify-center space-y-6 opacity-20 border-4 border-dashed border-white/10 rounded-[4rem]">
              <LayoutGrid className="w-20 h-20" />
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase italic">No Kits Yet</h3>
                <p className="text-[10px] font-black uppercase tracking-widest">Create your first question set to start hosting!</p>
              </div>
              <Button className="bg-primary px-8 h-12 rounded-xl font-black uppercase text-[10px]">Create Kit</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
