
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Plus, 
  Search, 
  MessageSquare, 
  Flame, 
  Globe, 
  ShieldCheck, 
  Zap, 
  TrendingUp,
  LayoutGrid,
  Loader2,
  Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function GroupsDiscoveryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [search, setSearch] = useState("");

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "groups"), limit(20));
  }, [firestore]);

  const { data: groups, isLoading } = useCollection(groupsQuery);

  return (
    <div className="max-w-7xl mx-auto py-12 space-y-12 animate-fade-in px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 glass-card p-10 rounded-[3.5rem] border-white/10 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-[1.8rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/20">
            <LayoutGrid className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">Hub Communities</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1 uppercase text-[9px] tracking-widest"><Globe className="w-3 h-3 text-primary" /> Discover Community Groups</p>
          </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto relative z-10">
           <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a group..." className="h-12 pl-11 bg-secondary/30 border-white/5 rounded-2xl italic font-bold text-xs" />
           </div>
           <Button className="h-12 px-8 bg-primary rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Create Group</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
         {isLoading ? (
           <div className="col-span-full py-40 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" /></div>
         ) : groups?.map(group => (
           <Card key={group.id} className="glass-card rounded-[3rem] border-white/10 overflow-hidden hover:border-primary/40 transition-all group cursor-pointer shadow-2xl flex flex-col">
              <div className="h-32 bg-gradient-to-br from-primary/30 to-accent/30 p-8 flex justify-between items-start relative">
                 <div className="absolute inset-0 arcade-grid opacity-20" />
                 <Badge className="bg-black/60 border-none text-[8px] px-3 font-black z-10 uppercase tracking-widest">{group.category || 'General'}</Badge>
                 <Users className="w-10 h-10 text-white/40 group-hover:text-white transition-colors z-10" />
              </div>
              <CardContent className="p-8 flex-1 space-y-6">
                 <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">{group.name}</h3>
                 <p className="text-sm font-medium italic text-muted-foreground line-clamp-3 leading-relaxed">{group.description}</p>
                 <div className="pt-4 flex justify-between items-center border-t border-white/5">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">{group.memberCount || 1} Members</span>
                    <Button variant="ghost" className="h-9 px-6 rounded-xl font-black uppercase text-[9px] text-primary hover:bg-primary/10">Launch Zone</Button>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>
    </div>
  );
}
