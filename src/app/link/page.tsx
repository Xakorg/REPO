"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Plus, Copy, Trash2, ExternalLink, QrCode, TrendingUp, Zap, MousePointer2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, deleteDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

export default function XakLinkPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const linksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "shortlinks"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
  }, [firestore, user]);

  const { data: links, isLoading } = useCollection(linksQuery);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user || !firestore) return;
    
    setIsCreating(true);
    try {
      const finalSlug = slug || Math.random().toString(36).substring(2, 7);
      await addDoc(collection(firestore, "users", user.uid, "shortlinks"), {
        title: url.replace(/^https?:\/\//, "").split('/')[0],
        url,
        slug: finalSlug,
        clicks: 0,
        timestamp: serverTimestamp()
      });
      toast({ title: "Neural Link Created", description: `Link live at xak.io/${finalSlug}` });
      setUrl("");
      setSlug("");
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !user) return;
    await deleteDoc(doc(firestore, "users", user.uid, "shortlinks", id));
    toast({ title: "Link Deregistered" });
  };

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-fade-in text-foreground px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-card/40 backdrop-blur-xl p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Link2 className="w-80 h-80 -rotate-12" /></div>
        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 rounded-[1.8rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-xl shadow-emerald-900/20">
            <Link2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">XakLink</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-3 mt-2">
            <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" /> Digital Identity & Shortlinks
          </p>
        </div>
        
        <form onSubmit={handleCreate} className="w-full md:w-[500px] space-y-4 relative z-10">
          <div className="flex gap-3">
            <Input 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste long URL..." 
              className="bg-black/40 border-white/10 h-14 rounded-xl font-bold text-sm italic" 
            />
            <Input 
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug..." 
              className="w-32 bg-black/40 border-white/10 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest text-emerald-500 text-center" 
            />
          </div>
          <Button disabled={isCreating || !url} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl">
            {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : <><Plus className="w-5 h-5 mr-2" /> Generate Neural Slug</>}
          </Button>
        </form>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center gap-3 px-4">
            <MousePointer2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">My Active Stations</h2>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary opacity-20" /></div>
            ) : !links || links.length === 0 ? (
              <Card className="p-20 text-center opacity-20 font-black uppercase tracking-[0.4em] italic glass-card rounded-[3rem] border-white/10">No Shards Mapped</Card>
            ) : (
              links.map(link => (
                <Card key={link.id} className="glass-card rounded-[2.5rem] p-8 border-white/5 hover:border-emerald-500/20 transition-all group">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-foreground uppercase italic tracking-tight">{link.title}</h3>
                      <div className="flex items-center gap-3">
                        <p className="text-emerald-500 font-black text-sm italic">xak.io/{link.slug}</p>
                        <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[8px] uppercase">{link.clicks} CLICKS</Badge>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="icon" onClick={async () => { const { copyToClipboard } = await import('@/lib/clipboard'); const ok = await copyToClipboard(`xak.io/${link.slug}`); if (ok) toast({ title: "Slug Copied" }); else toast({ variant: 'destructive', title: 'Copy Failed' }); }} className="rounded-xl border-white/10 hover:bg-white/5"><Copy className="w-4 h-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(link.id)} className="rounded-xl border-white/10 hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <Card className="glass-card rounded-[3.5rem] p-10 border-emerald-500/20 bg-emerald-500/5 shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Zap className="w-32 h-32 text-emerald-500 rotate-12" /></div>
            <div className="relative z-10 space-y-8">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Analytics Unit</h3>
              <div className="space-y-6">
                <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Total Reach</p>
                    <p className="text-3xl font-black text-white italic">{links?.reduce((acc, l) => acc + (l.clicks || 0), 0) || 0}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Identity Registry</p>
                  <p className="text-xs font-bold text-muted-foreground italic px-4">All links are secured with high-fidelity logic and tied to your professional identity.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}