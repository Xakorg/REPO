
"use client";

import { useState } from "react";
import { 
  Globe, 
  Plus, 
  ShieldCheck, 
  Activity, 
  BarChart3, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Loader2, 
  Trash2, 
  Settings,
  Info,
  Link as LinkIcon,
  Layout,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SearchConsolePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newSiteTitle, setNewSiteTitle] = useState("");
  const [newSiteDesc, setNewSiteDesc] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [verifyingSite, setVerifyingSite] = useState<any>(null);

  const sitesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "indexedSites"), where("ownerId", "==", user.uid));
  }, [firestore, user]);

  const { data: mySites, isLoading } = useCollection(sitesQuery);

  const handleRegister = async () => {
    if (!user || !firestore || !newSiteUrl.trim()) return;
    setIsRegistering(true);
    try {
      await addDoc(collection(firestore, "indexedSites"), {
        url: newSiteUrl.toLowerCase().trim(),
        title: newSiteTitle || newSiteUrl,
        description: newSiteDesc || "A registered Xakteir Unit",
        ownerId: user.uid,
        status: 'pending',
        verified: false,
        indexedAt: serverTimestamp()
      });
      toast({ title: "Site Registered", description: "Verification protocol required to go live." });
      setNewSiteUrl("");
      setNewSiteTitle("");
      setNewSiteDesc("");
      setIsRegistering(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
      setIsRegistering(false);
    }
  };

  const handleVerify = async (site: any) => {
    setVerifyingSite(site);
    setTimeout(async () => {
      if (!firestore || !user) return;
      await updateDoc(doc(firestore, "indexedSites", site.id), {
        verified: true,
        status: 'active'
      });
      toast({ title: "Ownership Verified!", description: "Your site is now appearing in XakSearch." });
      setVerifyingSite(null);
    }, 2000);
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !user) return;
    await deleteDoc(doc(firestore, "indexedSites", id));
    toast({ title: "Site Removed" });
  };

  if (!user) return <div className="p-32 text-center text-4xl font-black uppercase italic text-foreground">Sign in to access Search Console!</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-12 animate-fade-in px-6 text-foreground">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 glass-card p-12 rounded-[4rem] border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <Settings className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-8 mb-4">
            <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl animate-float">
              <Globe className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-7xl font-black text-foreground tracking-tighter uppercase italic leading-none">Console</h1>
              <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mt-4 flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" /> Index Management System
              </p>
            </div>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 h-16 px-10 rounded-[1.8rem] font-black uppercase text-xs tracking-widest text-white shadow-xl relative z-10 transition-all active:scale-95">
              <Plus className="w-5 h-5 mr-3" /> Register Site
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-xl text-foreground p-10">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Index New Site</DialogTitle></DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Unit URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input value={newSiteUrl} onChange={(e) => setNewSiteUrl(e.target.value)} placeholder="https://my-app.xakteir.com" className="bg-secondary/30 border-white/5 pl-14 h-14 rounded-2xl font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Search Title</label>
                <Input value={newSiteTitle} onChange={(e) => setNewSiteTitle(e.target.value)} placeholder="Display Name in Search" className="bg-secondary/30 border-white/5 h-14 rounded-2xl font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Description Snippet</label>
                <Input value={newSiteDesc} onChange={(e) => setNewSiteDesc(e.target.value)} placeholder="What is this site about?" className="bg-secondary/30 border-white/5 h-14 rounded-2xl font-bold" />
              </div>
              <Button onClick={handleRegister} disabled={isRegistering || !newSiteUrl} className="w-full h-16 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-xl">
                {isRegistering ? <Loader2 className="animate-spin w-6 h-6" /> : "Authorize Registration"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
              <Layout className="w-8 h-8 text-primary" /> Managed Shards
            </h3>
            <Badge variant="outline" className="border-white/10 text-[10px] font-black px-4 py-1">{mySites?.length || 0} Sites Indexed</Badge>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" /></div>
            ) : !mySites || mySites.length === 0 ? (
              <div className="p-20 text-center glass-card rounded-[3rem] border-white/10 opacity-30 flex flex-col items-center space-y-6">
                <Search className="w-20 h-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">No sites registered in the Hub index.</p>
              </div>
            ) : (
              mySites.map(site => (
                <Card key={site.id} className="glass-card rounded-[3rem] p-8 border-white/10 hover:border-primary/30 transition-all group overflow-hidden relative">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                      <div className={cn(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 shadow-lg text-xl font-black italic",
                        site.verified ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      )}>
                        {site.url[0].toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-2xl font-black uppercase italic tracking-tight">{site.title}</h4>
                          {site.verified && <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in-95" />}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <LinkIcon className="w-3 h-3" /> {site.url}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {!site.verified ? (
                        <Button 
                          onClick={() => handleVerify(site)} 
                          disabled={!!verifyingSite}
                          className="bg-amber-600 hover:bg-amber-500 rounded-xl h-12 px-8 font-black uppercase text-[10px] shadow-lg"
                        >
                          {verifyingSite?.id === site.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Logic"}
                        </Button>
                      ) : (
                        <div className="bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-xl flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-green-500" />
                          <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">LIVE IN INDEX</span>
                        </div>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(site.id)} className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="w-5 h-5" /></Button>
                    </div>
                  </div>
                  {!site.verified && (
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-4 animate-in slide-in-from-top-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center"><Info className="w-4 h-4 text-amber-500" /></div>
                      <p className="text-[10px] font-bold text-amber-500/60 uppercase italic">Ownership verification required before indexing begins.</p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 bg-gradient-to-br from-primary/10 to-transparent shadow-2xl">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" /> Hub Stats
            </h3>
            <div className="space-y-8">
              {[
                { label: "Total Queries", val: "1.2M", icon: Search, color: "text-blue-400" },
                { label: "Search Index", val: "42.8k", icon: Globe, color: "text-green-400" },
                { label: "Active Bots", val: "156", icon: Activity, color: "text-rose-400" },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/20 transition-all">
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-xl font-black italic text-foreground">{stat.val}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="space-y-6 text-center relative z-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-secondary flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Analytics Pro</h2>
              <p className="text-xs text-muted-foreground font-bold leading-relaxed uppercase tracking-widest opacity-60">Unlock deep neural analytics for your indexed units.</p>
              <Button className="w-full bg-primary h-12 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl text-white">Upgrade</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
