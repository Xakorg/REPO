
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen,
  Zap,
  Star,
  Lock,
  Flame,
  ChevronRight,
  Globe,
  Trophy,
  Brain,
  Sparkles,
  CheckCircle2,
  Loader2,
  Volume2,
  Wand2
} from "lucide-react";
import { teachCode, type AiCodeTeacherOutput } from "@/ai/flows/ai-code-teacher-flow";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

const PATH_STATIONS = [
  { id: 1, title: "Basics of Logic", unit: 1, icon: Brain, status: 'completed' },
  { id: 2, title: "Smart Greetings", unit: 1, icon: Globe, status: 'completed' },
  { id: 3, title: "Part 1 Checkpoint", unit: 1, icon: Trophy, status: 'current' },
  { id: 4, title: "Variables & Hubs", unit: 2, icon: Zap, status: 'locked' },
  { id: 5, title: "Smart Loops", unit: 2, icon: Sparkles, status: 'locked' },
  { id: 6, title: "Part 2 Checkpoint", unit: 2, icon: Star, status: 'locked' },
];

export default function XakLearnPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);

  const [loading, setLoading] = useState(false);
  const [aiLesson, setAiLesson] = useState<AiCodeTeacherOutput | null>(null);

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const startLesson = async (title: string) => {
    setLoading(true);
    try {
      const res = await teachCode({ topic: title });
      setAiLesson(res);
      toast({ title: "Lesson Synchronized" });
    } catch (err) { toast({ variant: "destructive", title: "Sync Failed" }); }
    finally { setLoading(false); }
  };

  const completeLesson = async () => {
    if (!user || !firestore) return;
    await updateDoc(doc(firestore, "users", user.uid), {
      xp: increment(100),
      streakCount: increment(1),
      currencyBalance: increment(50),
      updatedAt: serverTimestamp()
    });
    setAiLesson(null);
    toast({ title: "Mastery Confirmed!", description: "+100 XP added to identity registry." });
  };

  if (!user) return <div className="p-32 text-center font-black uppercase italic">Sign in for Knowledge Path access.</div>;

  return (
    <div className="max-w-[1400px] mx-auto py-6 animate-fade-in px-6 h-[calc(100vh-140px)] flex gap-10">
      <aside className="w-80 flex flex-col gap-6">
        <Card className="glass-card rounded-[3rem] p-10 border-white/10 space-y-8 bg-black/40 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Flame className="w-8 h-8 text-orange-500 fill-orange-500 animate-pulse" />
              <span className="text-3xl font-black italic">{userData?.streakCount || 0}</span>
            </div>
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-amber-400" />
              <span className="text-3xl font-black italic">{userData?.xp || 0}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>Hub Mastery</span><span className="text-primary">85%</span></div>
            <Progress value={85} className="h-2 bg-white/5 shadow-inner" />
          </div>
        </Card>

        <Card className="flex-1 glass-card rounded-[3rem] p-8 border-white/10 bg-black/20 flex flex-col gap-8 shadow-2xl">
           <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-4"><Sparkles className="w-5 h-5" /> Path Selection</h3>
           <div className="space-y-4">
              {['Smart Logic', 'German Bridge', 'App Design'].map((subj, i) => (
                <button key={subj} className={cn("w-full p-6 rounded-[1.8rem] border-4 transition-all text-left group", i === 0 ? "bg-primary/10 border-primary shadow-xl" : "bg-white/5 border-transparent opacity-40")}>
                   <p className="text-[10px] font-black uppercase italic tracking-widest">{subj}</p>
                   <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Level {i === 0 ? '12' : 'Locked'}</p>
                </button>
              ))}
           </div>
        </Card>
      </aside>

      <main className="flex-1 flex flex-col items-center relative h-full">
        {aiLesson ? (
          <div className="w-full max-w-4xl animate-in slide-in-from-bottom-10 duration-700">
            <Button variant="ghost" onClick={() => setAiLesson(null)} className="mb-8 font-black uppercase text-[10px] tracking-[0.4em] text-primary hover:bg-primary/10 px-8 rounded-full"><ChevronRight className="w-4 h-4 rotate-180 mr-3" /> ABORT PATH</Button>
            <Card className="glass-card rounded-[4rem] border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] bg-black/60">
              <div className="p-16 space-y-10">
                <div className="flex justify-between items-start">
                   <h2 className="text-5xl font-black uppercase italic tracking-tighter border-l-8 border-primary pl-10 leading-tight">{aiLesson.explanation.split('.')[0]}</h2>
                   <Button onClick={() => handleSpeak(aiLesson.explanation)} variant="outline" size="icon" className="h-16 w-16 rounded-full border-4 border-primary/20 bg-primary/10 text-primary"><Volume2 className="w-8 h-8" /></Button>
                </div>
                <p className="text-xl leading-relaxed text-foreground/90 font-medium italic pl-2">{aiLesson.explanation}</p>
                <div className="p-10 bg-zinc-950 rounded-[2.5rem] font-mono text-sm border-4 border-white/5 shadow-inner relative group">
                   <div className="absolute top-4 right-6 text-[8px] font-black text-white/20 uppercase tracking-widest">Logic Snippet</div>
                   <pre className="text-sky-400 select-all">{aiLesson.exampleCode}</pre>
                </div>
                <div className="space-y-8 pt-10 border-t border-white/5">
                  <div className="flex items-center gap-4"><Wand2 className="w-8 h-8 text-amber-400" /><h3 className="text-2xl font-black uppercase italic tracking-tighter">Daily Challenge</h3></div>
                  <p className="text-2xl font-bold italic text-white/80">"{aiLesson.quizQuestion}"</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiLesson.quizOptions.map((opt, i) => (
                      <Button key={i} onClick={() => {
                        if(opt === aiLesson.correctAnswer) completeLesson();
                        else toast({ variant: "destructive", title: "Incompatible Logic", description: "The AI Tutor suggests re-evaluating the snippet." });
                      }} variant="outline" className="h-20 justify-start px-10 rounded-[1.8rem] border-4 border-white/5 hover:border-primary font-black uppercase text-xs tracking-widest transition-all">
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <ScrollArea className="w-full pr-4 custom-scrollbar">
            <div className="max-w-md mx-auto py-20 flex flex-col items-center gap-20 relative">
              <div className="absolute top-0 bottom-0 w-2 bg-white/5 border-l-8 border-dashed border-white/5 -z-10" />
              {PATH_STATIONS.map((station, i) => (
                <div key={station.id} className={cn("relative group", i % 2 === 0 ? "mr-32" : "ml-32")}>
                  <button
                    onClick={() => station.status !== 'locked' && startLesson(station.title)}
                    disabled={station.status === 'locked' || loading}
                    className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center border-b-[12px] transition-all duration-500 relative shadow-2xl",
                      station.status === 'completed' ? "bg-emerald-500 border-emerald-700 hover:scale-110 active:translate-y-2" :
                      station.status === 'current' ? "bg-primary border-primary/20 animate-bounce shadow-[0_0_60px_rgba(var(--primary),0.5)]" :
                      "bg-zinc-800 border-zinc-900 opacity-40 grayscale cursor-not-allowed"
                    )}
                  >
                    {station.status === 'locked' ? <Lock className="w-10 h-10 text-zinc-500" /> : <station.icon className="w-14 h-14 text-white" />}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-20 opacity-0 group-hover:opacity-100 transition-all bg-black/90 backdrop-blur-xl border-4 border-white/10 px-6 py-3 rounded-2xl whitespace-nowrap z-20 shadow-2xl">
                      <p className="text-xs font-black uppercase italic text-white tracking-widest">{station.title}</p>
                    </div>
                  </button>
                </div>
              ))}
              <div className="pt-20 opacity-10 text-center space-y-6">
                <BookOpen className="w-20 h-20 mx-auto" /><p className="text-sm font-black uppercase tracking-[0.8em]">Advanced Learning Sectors Locked</p>
              </div>
            </div>
          </ScrollArea>
        )}
      </main>

      <aside className="w-80 space-y-8">
        <Card className="glass-card rounded-[3rem] p-10 border-white/10 bg-gradient-to-br from-primary/10 to-transparent shadow-2xl text-center">
          <div className="w-20 h-20 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center mx-auto border-4 border-amber-500/20 shadow-xl mb-6"><Trophy className="w-10 h-10 text-amber-500" /></div>
          <h4 className="text-2xl font-black uppercase italic tracking-tighter">Leaderboard</h4>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2 mb-8">Ranked Global #428</p>
          <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 font-black uppercase text-[10px] tracking-widest">Global Standings</Button>
        </Card>

        <Card className="glass-card rounded-[3rem] p-10 border-white/10 text-center space-y-6 shadow-2xl">
             <div className="flex items-center justify-center gap-4 text-primary"><Sparkles className="w-8 h-8 animate-pulse" /><h3 className="text-xl font-black uppercase italic">Shop Rewards</h3></div>
             <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">Your XP points can be traded for premium Hub decorations.</p>
             <Link href="/shop"><Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase text-[10px] shadow-lg">Enter Market</Button></Link>
        </Card>
      </aside>
    </div>
  );
}
