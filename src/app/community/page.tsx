
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Sparkles, MessageCircle, Heart, Share2, TrendingUp, Search, Plus, Trophy, Rocket, Play, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";

export default function CommunityPage() {
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "publishedProjects"), orderBy("publishedAt", "desc"), limit(20));
  }, [firestore]);

  const { data: projects, isLoading } = useCollection(projectsQuery);

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-12 animate-fade-in px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 glass-card p-10 rounded-[3.5rem] border-white/5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 rounded-[1.8rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">Community</h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2">Discover the Neural Multiverse</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search creators..." className="bg-background/60 border-white/10 h-12 rounded-2xl pl-11 focus:ring-blue-500 font-bold text-xs" />
          </div>
          <Link href="/games/studio">
            <Button className="bg-blue-600 hover:bg-blue-500 h-12 rounded-2xl px-8 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/20 text-white">
              <Plus className="w-4 h-4 mr-2" /> Post
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter italic">Neural Feed</h2>
          </div>
          
          <div className="space-y-8">
            {isLoading ? (
              <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
            ) : projects?.length === 0 ? (
              <div className="p-20 text-center glass-card rounded-[3rem] border-white/5">
                <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">No projects deployed yet. Be the first.</p>
              </div>
            ) : projects?.map((item) => (
              <Card key={item.id} className="glass-card rounded-[3rem] border-white/5 hover:border-primary/20 transition-all p-8 shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-5">
                    <Avatar className="w-14 h-14 rounded-2xl border-2 border-primary/20 shadow-lg">
                      <AvatarImage src={`https://picsum.photos/seed/${item.ownerId}/100/100`} />
                      <AvatarFallback>{item.ownerName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xl font-black text-foreground italic uppercase leading-none">{item.ownerName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[8px] font-black uppercase tracking-widest px-2 py-0">Project Published</Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">New</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full"><Share2 className="w-5 h-5 text-muted-foreground" /></Button>
                </div>
                
                <div className="bg-background/40 rounded-[2rem] p-8 border border-white/5 mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-black text-foreground tracking-tight uppercase italic">{item.name}</h3>
                    <Link href={`/projects/${item.path}`}>
                      <Button size="sm" variant="ghost" className="text-primary font-black uppercase text-[10px] tracking-widest">View Path <Play className="w-3 h-3 ml-2" /></Button>
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Synced with the Neural Registry. Project path: /projects/{item.path}</p>
                </div>

                <div className="flex gap-8">
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-rose-500 transition-colors group">
                    <Heart className="w-5 h-5 group-hover:fill-rose-500" />
                    <span className="text-xs font-black">42</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs font-black">12</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="lg:col-span-4 space-y-10">
          <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent shadow-2xl">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <Trophy className="w-8 h-8 text-amber-400" />
                <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Leaderboard</h3>
              </div>
              <div className="space-y-6">
                {[
                  { name: "Apex_Dev", score: "4.2M", rank: 1 },
                  { name: "Neural_Link", score: "3.8M", rank: 2 },
                  { name: "Cyber_X", score: "3.1M", rank: 3 },
                ].map((user) => (
                  <div key={user.name} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-muted-foreground tabular-nums">0{user.rank}</span>
                      <p className="text-sm font-black text-foreground uppercase italic group-hover:text-blue-400 transition-colors">{user.name}</p>
                    </div>
                    <span className="text-xs font-black text-blue-500">{user.score}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 font-black uppercase text-[10px] tracking-widest text-foreground">View Rankings</Button>
            </div>
          </Card>

          <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 bg-gradient-to-br from-primary/10 to-transparent shadow-2xl">
            <div className="space-y-6 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
              <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Creator Studio</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Your neural nodes reached <span className="text-primary font-black">12.4k</span> minds this week.</p>
              <Link href="/games/studio">
                <Button className="w-full bg-primary h-12 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 text-white">Dashboard</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
