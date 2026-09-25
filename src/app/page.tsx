"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Loader2, 
  Sparkles,
  Zap,
  Target,
  BadgeCheck,
  ChevronRight,
  HelpCircle,
  Smile
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, updateDoc, serverTimestamp, query, collection, orderBy, limit, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

const getDailyHash = () => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  };

  const DAILY_JOKE_KEY = "xakteir_daily_joke";
  const DAILY_RIDDLE_KEY = "xakteir_daily_riddle";

  async function fetchDailyJoke(): Promise<{ question: string; answer: string }> {
    const hash = getDailyHash();
    const cached = localStorage.getItem(DAILY_JOKE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.hash === hash) return parsed.data;
      } catch {}
    }
    try {
      const res = await fetch("https://v2.jokeapi.dev/joke/Programming?type=single");
      const data = await res.json();
      const joke = data.error ? { question: "Why did the developer go broke?", answer: "Because he used up all his cache!" } : { question: data.joke, answer: "" };
      localStorage.setItem(DAILY_JOKE_KEY, JSON.stringify({ hash, data: joke }));
      return joke;
    } catch {
      return { question: "Why did the developer go broke?", answer: "Because he used up all his cache!" };
    }
  }

  async function fetchDailyRiddle(): Promise<{ question: string; answer: string }> {
    const hash = getDailyHash();
    const cached = localStorage.getItem(DAILY_RIDDLE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.hash === hash) return parsed.data;
      } catch {}
    }
    try {
      const res = await fetch("https://v2.jokeapi.dev/joke/Dark?type=single");
      const data = await res.json();
      const riddle = data.error ? { question: "What has keys but can't open locks?", answer: "A piano" } : { question: data.joke, answer: "" };
      localStorage.setItem(DAILY_RIDDLE_KEY, JSON.stringify({ hash, data: riddle }));
      return riddle;
    } catch {
      return { question: "What has keys but can't open locks?", answer: "A piano" };
    }
  }

export default function XakteirEntry() {


  return <XakteirDashboard />;
}

function XakteirDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const [searchInput, setSearchInput] = useState("");
  const [migrationEmail, setMigrationEmail] = useState("");
  const [isMigrating, setIsMigrating] = useState(false);
  const [showRiddleAnswer, setShowRiddleAnswer] = useState(false);
  const [dailyJoke, setDailyJoke] = useState<{ question: string; answer: string }>({ question: "", answer: "" });
  const [dailyRiddle, setDailyRiddle] = useState<{ question: string; answer: string }>({ question: "", answer: "" });
  const [dailyContentLoading, setDailyContentLoading] = useState(true);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);

  const systemSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "system_settings", "global");
  }, [firestore]);
  const { data: systemSettings } = useDoc(systemSettingsRef);

  const feedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "globalMessages"), where("type", "==", "broadcast"), limit(50));
  }, [firestore]);
  const { data: feedItems, isLoading: feedLoading } = useCollection(feedQuery);

  const sortedFeedItems = useMemo(() => {
    if (!feedItems) return [];
    return [...feedItems].sort((a: any, b: any) => {
      const tsA = a.timestamp?.seconds || 0;
      const tsB = b.timestamp?.seconds || 0;
      return tsB - tsA;
    });
  }, [feedItems]);

  const isSuperAdmin = useMemo(() => SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || ""), [user]);
  const needsMigration = useMemo(() => !!(user?.email?.toLowerCase().endsWith("@xakteir.com") && userData !== undefined && !userData?.personalEmail && !isSuperAdmin), [user, userData, isSuperAdmin]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDailyContentLoading(true);
      const [joke, riddle] = await Promise.all([fetchDailyJoke(), fetchDailyRiddle()]);
      if (!cancelled) {
        setDailyJoke(joke);
        setDailyRiddle(riddle);
        setDailyContentLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  const handleMigration = async () => {
    if (!migrationEmail.trim() || !user || !firestore) return;
    setIsMigrating(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        personalEmail: migrationEmail.toLowerCase().trim(),
        migrationCompletedAt: serverTimestamp()
      });
      setIsMigrating(false);
    } catch (e) {
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center animate-fade-in relative overflow-x-hidden text-white pb-32 px-4 md:px-0">
      <main className="flex-1 w-full max-w-7xl px-2 md:px-8 flex flex-col items-center pt-[6vh] md:pt-[12vh] space-y-12 md:space-y-20 relative z-10">
        <div className="flex flex-col items-center gap-6 md:gap-10 group cursor-pointer" onClick={() => window.location.reload()}>
          <img src="/favicon.ico" alt="Xakteir" className="w-20 h-20 object-contain scale-[0.7] md:scale-[2] group-hover:scale-110 transition-transform drop-shadow-[0_0_60px_rgba(255,255,255,0.4)]" />
          <div className="text-center space-y-3 md:space-y-4">
            <h1 className="text-4xl md:text-9xl font-black tracking-tighter uppercase italic leading-none text-white flex items-center justify-center gap-4 md:gap-8 drop-shadow-[0_0_80px_rgba(255,255,255,0.4)]">
              XAKTEIR <BadgeCheck className="w-6 h-6 md:w-12 md:h-12 text-blue-500 fill-current animate-pulse shadow-2xl" />
            </h1>
            <p className="text-[8px] md:text-[11px] font-black uppercase tracking-[1.2em] text-white/40 italic">Apps & Data</p>
          </div>
        </div>

        <div className="w-full max-w-4xl relative group space-y-6">
          {systemSettings?.welcomeMessage && (
            <div className="w-full text-center bg-primary/10 border-2 border-primary/20 rounded-3xl p-6 shadow-[0_0_40px_rgba(var(--primary),0.2)] animate-fade-in backdrop-blur-xl">
               <p className="text-sm md:text-xl italic font-black text-white">{systemSettings.welcomeMessage}</p>
            </div>
          )}
          <form onSubmit={handleSearch} className="relative flex items-center w-full shadow-2xl rounded-full">
            <Input 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search apps and files..." 
              className="h-16 md:h-24 w-full bg-black/60 backdrop-blur-3xl border-4 md:border-8 border-white/10 hover:border-primary hover:shadow-[0_0_100px_rgba(var(--primary),0.4)] focus:border-primary focus:shadow-[0_0_120px_rgba(var(--primary),0.5)] rounded-full text-base md:text-3xl pl-12 md:pl-20 pr-10 md:pr-12 font-black italic transition-all outline-none text-white placeholder:text-white/15"
            />
            <button type="submit" className="absolute left-4 md:left-8">
              <Search className="w-5 h-5 md:w-8 md:h-8 text-white/20 group-focus-within:text-primary transition-all duration-500" />
            </button>
          </form>
          <div className="flex flex-wrap justify-center gap-3 md:gap-8 mt-8 md:mt-14 animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <Button onClick={() => window.location.href = '/search'} variant="ghost" className="rounded-full px-8 md:px-16 h-10 md:h-16 text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/50 hover:bg-primary/10 hover:text-primary border-2 border-white/5 transition-all shadow-xl italic">Search</Button>
             <Button onClick={() => window.location.href = '/ai-chat'} variant="ghost" className="rounded-full px-8 md:px-16 h-10 md:h-16 text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/50 hover:bg-primary/10 hover:text-primary border-2 border-white/5 transition-all shadow-xl italic">Xak AI</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 w-full">
          <Card className="glass-card rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 space-y-8 sm:col-span-2 shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-4 border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 italic animate-pulse">
                <Sparkles className="w-5 h-5 text-primary" /> Updates
              </h2>
              <Badge variant="outline" className="border-white/10 text-[7px] font-black opacity-30">LIVE</Badge>
            </div>
            {feedLoading ? (
              <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary opacity-20 w-12 h-12" /></div>
            ) : !sortedFeedItems?.length ? (
              <div className="text-center py-20 border-4 border-dashed border-white/5 rounded-3xl opacity-20">
                 <p className="text-[11px] font-black uppercase tracking-[1em] italic">No updates</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {sortedFeedItems.slice(0, 3).map(item => (
                  <div key={item.id} className="p-6 bg-white/5 rounded-[1.8rem] md:rounded-[2.2rem] border-2 border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer shadow-xl">
                    <h3 className="text-xs md:text-lg font-black text-white uppercase italic group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                    <p className="text-[9px] md:text-xs text-white/40 mt-2 line-clamp-1 italic font-medium tracking-wide">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="glass-card rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 space-y-6 md:space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] bg-indigo-600/5 border-4 border-indigo-500/20 group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center gap-4">
              <HelpCircle className="w-6 h-6 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <h2 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-indigo-400 italic">Daily Riddle</h2>
            </div>
            <div className="space-y-6 md:space-y-10">
              {dailyContentLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-indigo-400 w-8 h-8" /></div>
              ) : (
                <>
                  <p className="text-sm md:text-2xl font-black italic leading-tight text-white/90 drop-shadow-xl">"{dailyRiddle.question}"</p>
                  {showRiddleAnswer ? (
                    <div className="p-6 bg-indigo-500/10 rounded-2xl border-2 border-indigo-500/20 animate-in slide-in-from-top-2">
                       <p className="text-[10px] md:text-base font-black uppercase text-indigo-400 italic">
                         {dailyRiddle.answer ? `Solution: ${dailyRiddle.answer}` : "Reveal tomorrow for the answer!"}
                       </p>
                    </div>
                  ) : (
                    <Button onClick={() => setShowRiddleAnswer(true)} variant="ghost" className="h-12 md:h-14 px-8 rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] border-2 border-white/5 hover:bg-indigo-500/20 hover:text-white transition-all shadow-md">Show Answer</Button>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card className="glass-card rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 space-y-6 md:space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] bg-amber-600/5 border-4 border-amber-500/20 group hover:border-amber-500/40 transition-all">
            <div className="flex items-center gap-4">
              <Smile className="w-6 h-6 text-amber-400 group-hover:animate-bounce transition-transform" />
              <h2 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-amber-400 italic">Daily Joke</h2>
            </div>
            <div className="space-y-6 md:space-y-10">
              {dailyContentLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-amber-400 w-8 h-8" /></div>
              ) : (
                <>
                  <p className="text-sm md:text-2xl font-black italic leading-tight text-white/90 drop-shadow-xl">"{dailyJoke.question}"</p>
                  {dailyJoke.answer && (
                    <div className="p-6 bg-amber-500/10 rounded-2xl border-2 border-amber-500/20">
                       <p className="text-[10px] md:text-base font-black uppercase text-amber-400 italic leading-snug">{dailyJoke.answer}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </main>

      <Dialog open={needsMigration} onOpenChange={() => {}}>
        <DialogContent className="rounded-[2.5rem] md:rounded-[5rem] border-4 md:border-[12px] border-white/10 p-0 overflow-hidden bg-zinc-950 max-w-2xl shadow-[0_100px_200px_rgba(0,0,0,0.9)] text-white animate-in zoom-in-95">
           <div className="p-10 md:p-20 bg-zinc-900 border-b-8 border-white/10 text-center relative overflow-hidden">
              <div className="absolute inset-0 arcade-grid opacity-10" />
              <DialogTitle className="text-3xl md:text-7xl font-black uppercase italic tracking-tighter relative z-10 leading-none">Account Security</DialogTitle>
              <p className="text-[9px] md:text-[11px] text-primary font-black uppercase mt-6 tracking-[0.6em] italic relative z-10">Identity Verification</p>
           </div>
           <div className="p-10 md:p-20 space-y-8 md:space-y-16">
              <p className="text-sm md:text-2xl font-medium text-white/60 leading-relaxed italic text-center px-4">
                 Please add a personal email to secure your identity.
              </p>
              <div className="space-y-6 md:space-y-10">
                <Input 
                  value={migrationEmail}
                  onChange={(e) => setMigrationEmail(e.target.value)}
                  placeholder="name@email.com" 
                  className="h-16 md:h-24 bg-black/40 border-4 md:border-8 border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] px-8 md:px-12 font-black italic text-base md:text-3xl shadow-inner text-white placeholder:text-white/10 focus:border-primary transition-all" 
                />
                <Button 
                  onClick={handleMigration} 
                  disabled={!migrationEmail.includes("@") || isMigrating}
                  className="w-full h-20 md:h-32 bg-primary hover:bg-primary/90 text-white rounded-xl md:rounded-[2.5rem] font-black uppercase text-xl md:text-3xl italic shadow-[0_20px_60px_rgba(var(--primary),0.4)] border-b-[12px] md:border-b-[24px] border-primary/20 active:border-b-0 active:translate-y-4 transition-all"
                >
                  {isMigrating ? <Loader2 className="animate-spin w-10 h-10 md:w-16 md:h-16" /> : "Update Identity"}
                </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}