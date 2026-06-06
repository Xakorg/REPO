"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, User, Zap, Sparkles, Loader2, Info, ChevronRight, Calendar, Bookmark } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewsPage() {
  const firestore = useFirestore();

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "news"), orderBy("publishDateTime", "desc"), limit(20));
  }, [firestore]);

  const { data: newsItems, isLoading } = useCollection(newsQuery);

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-12 animate-fade-in px-6 text-foreground">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
            <Newspaper className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none">Hub Broadcast</h1>
          <p className="text-sm font-bold uppercase tracking-[0.4em] text-muted-foreground/60">Official Ecosystem Updates & Technical Insights</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          {isLoading ? (
            <div className="p-20 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" /></div>
          ) : !newsItems || newsItems.length === 0 ? (
            <Card className="glass-card rounded-[3.5rem] p-20 text-center border-white/5 bg-white/5">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-6 opacity-20" />
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">All systems silent. Transmissions pending.</p>
            </Card>
          ) : (
            newsItems.map((item) => (
              <Card key={item.id} className="glass-card rounded-[3.5rem] overflow-hidden border-white/5 hover:border-primary/30 transition-all duration-500 shadow-2xl group">
                <div className="p-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      {item.isOfficial && <Badge className="bg-primary text-white font-black uppercase text-[10px] px-4 py-1 tracking-widest">Official Update</Badge>}
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {new Date(item.publishDateTime).toLocaleDateString()}
                      </span>
                    </div>
                    <button className="text-muted-foreground hover:text-primary transition-colors"><Bookmark className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black tracking-tight uppercase italic leading-tight group-hover:text-primary transition-colors">{item.title}</h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed line-clamp-4">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shadow-lg border border-white/5">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-black italic text-foreground uppercase">@{item.authorName || 'Administrator'}</p>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Master Authority</p>
                      </div>
                    </div>
                    <Link href={`/news/${item.id}`}>
                      <button className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-primary hover:scale-105 transition-all">
                        Full Transmission <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-4 space-y-10">
          <Card className="glass-card rounded-[3.5rem] p-10 border-white/5 bg-gradient-to-br from-primary/10 to-transparent shadow-xl">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <Sparkles className="w-8 h-8 text-amber-400" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">System Health</h3>
              </div>
              <div className="space-y-6">
                {[
                  { label: "Core Runtime", status: "Operational", color: "text-green-500" },
                  { label: "Web Search", status: "Operational", color: "text-green-500" },
                  { label: "Link Layer", status: "Operational", color: "text-green-500" },
                  { label: "XakGuard 4.0", status: "Secured", color: "text-blue-500" },
                ].map(svc => (
                  <div key={svc.label} className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{svc.label}</span>
                    <span className={cn("text-[10px] font-black uppercase italic tracking-tighter", svc.color)}>{svc.status}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">System Layer V4.2.8 // Last Sync: Just Now</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card rounded-[3.5rem] p-10 border-white/5 shadow-xl overflow-hidden relative group cursor-pointer">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="space-y-6 text-center relative z-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-secondary flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                <Info className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">About Transmissions</h3>
              <p className="text-xs text-muted-foreground font-bold leading-relaxed uppercase tracking-widest opacity-60">The Official Broadcast hub is where the Xakteir Creators share the progress of the ecosystem.</p>
              <Link href="/about">
                <button className="text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:underline">Learn more about our Vision</button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
