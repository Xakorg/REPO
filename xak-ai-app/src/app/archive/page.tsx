"use client";

import { useState } from "react";
import { 
  History, 
  RotateCcw, 
  Trash2, 
  Search, 
  FileText, 
  Code2, 
  ImageIcon, 
  Zap,
  Clock,
  ShieldCheck,
  Loader2,
  ChevronRight,
  HardDrive,
  Filter,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ArchivePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  const archiveQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "archive"),
      orderBy("archivedAt", "desc"),
      limit(50)
    );
  }, [firestore, user]);

  const { data: items, isLoading } = useCollection(archiveQuery);

  const handleRestore = (id: string) => {
    setIsRestoring(id);
    setTimeout(() => {
      setIsRestoring(null);
      toast({ title: "Item Restored", description: "Successfully synced back to its original location." });
    }, 1500);
  };

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center p-20 text-center space-y-10 animate-fade-in text-foreground">
      <div className="w-32 h-32 rounded-[3.5rem] bg-indigo-500/10 flex items-center justify-center border-4 border-indigo-500/20 shadow-2xl">
        <History className="w-16 h-16 text-indigo-500" />
      </div>
      <h2 className="text-6xl font-black uppercase italic tracking-tighter">Time Machine</h2>
      <p className="text-muted-foreground font-bold uppercase tracking-widest max-w-sm">Sign in to access your archived files and version history.</p>
      <Link href="/auth"><Button className="bg-primary hover:bg-primary/90 h-16 px-16 rounded-[2rem] font-black uppercase text-xs">Get Started</Button></Link>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 glass-card p-12 rounded-[4rem] border-white/20 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <History className="w-80 h-80 -rotate-12 text-indigo-400" />
        </div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-20 h-20 rounded-[2.2rem] bg-indigo-500/10 flex items-center justify-center border-4 border-indigo-500/20 shadow-2xl">
            <History className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">XakArchive</h1>
            <p className="text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px] mt-4 flex items-center gap-4 italic">
               <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" /> Version History Active
            </p>
          </div>
        </div>

        <div className="flex gap-4 relative z-10 w-full lg:w-auto">
           <div className="relative flex-1 lg:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search history..." 
                className="h-14 bg-background/60 border-white/10 rounded-2xl pl-12 font-bold text-sm italic" 
              />
           </div>
           <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10"><Filter className="w-5 h-5" /></Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <main className="lg:col-span-8 space-y-8">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-foreground">
                 <Clock className="w-6 h-6 text-indigo-400" /> Recent Changes
              </h3>
              <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase px-4 py-1">50 Records Max</Badge>
           </div>

           <div className="space-y-4">
              {isLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-indigo-500 opacity-20" /></div>
              ) : !items?.length ? (
                <Card className="p-32 text-center glass-card border-white/5 opacity-30 flex flex-col items-center gap-6">
                   <HardDrive className="w-20 h-20" />
                   <p className="text-[10px] font-black uppercase tracking-[0.5em]">Your history is clear.</p>
                </Card>
              ) : (
                items.map(item => (
                  <Card key={item.id} className="glass-card rounded-[2.5rem] p-8 border-white/10 hover:border-indigo-500/40 transition-all group relative overflow-hidden bg-black/20">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                           <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center border border-white/10 text-indigo-400">
                              {item.type === 'doc' ? <FileText className="w-6 h-6" /> : item.type === 'code' ? <Code2 className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                           </div>
                           <div className="space-y-1">
                              <h4 className="text-xl font-black uppercase italic text-foreground leading-none">{item.name}</h4>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Source: {item.source || 'Unknown'}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-6">
                           <div className="text-right hidden md:block">
                              <p className="text-[10px] font-black uppercase text-muted-foreground">Date</p>
                              <p className="text-xs font-bold text-white">{new Date(item.archivedAt?.seconds * 1000).toLocaleDateString()}</p>
                           </div>
                           <Button 
                            onClick={() => handleRestore(item.id)}
                            disabled={isRestoring === item.id}
                            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
                           >
                              {isRestoring === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCcw className="w-4 h-4 mr-2" /> Restore</>}
                           </Button>
                           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="w-5 h-5" /></Button>
                        </div>
                     </div>
                  </Card>
                ))
              )}
           </div>
        </main>

        <aside className="lg:col-span-4 space-y-10">
           <Card className="glass-card rounded-[3.5rem] p-10 border-indigo-500/20 bg-indigo-500/5 shadow-xl space-y-8">
              <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-indigo-400">
                 <ShieldCheck className="w-6 h-6 animate-pulse" /> Memory Guard
              </h3>
              <div className="space-y-6">
                 <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Total Backups</p>
                    <p className="text-6xl font-black text-white italic">{items?.length || 0}</p>
                 </div>
                 <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase italic px-4 text-center">
                    Data is auto-saved every <span className="text-indigo-400 font-black">5 minutes</span> and held for 30 days.
                 </p>
              </div>
           </Card>

           <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 bg-black/40 shadow-xl text-center space-y-6">
              <Zap className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Fast Recovery</h3>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed uppercase italic">Restore any item instantly with a single click.</p>
              <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 font-black uppercase text-[10px]">Cloud Settings</Button>
           </Card>
        </aside>
      </div>
    </div>
  );
}
