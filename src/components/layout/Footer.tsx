
"use client";

import Link from "next/link";
import { GlitchLogo } from "@/components/ui/glitch-logo";
import { 
  Github, 
  Twitter, 
  Youtube, 
  ShieldCheck, 
  Activity, 
  Users, 
  Zap,
  Globe,
  Heart
} from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export function Footer() {
  const firestore = useFirestore();
  
  const statsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "system_stats", "global");
  }, [firestore]);

  const { data: stats } = useDoc(statsRef);
  const userCount = stats?.userCount || 142;

  return (
    <footer className="w-full border-t-2 md:border-t-4 border-white/10 bg-background/60 backdrop-blur-3xl py-12 md:py-20 px-6 md:px-10 relative overflow-hidden">
      <div className="absolute inset-0 arcade-grid opacity-5 pointer-events-none" />
      
      <div className="max-w-7xl auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 relative z-10">
        <div className="space-y-6 md:space-y-8">
          <div className="flex items-center gap-4 group">
            <GlitchLogo className="scale-[0.4] md:scale-50 group-hover:rotate-12 transition-transform" />
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-foreground">Xakteir</h2>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed italic">
            The playground for creators, gamers, and builders. Everything in one place.
          </p>
          <div className="flex gap-4">
            {[Twitter, Youtube, Github].map((Icon, i) => (
              <button key={i} className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary">Apps</h3>
          <ul className="space-y-3 md:space-y-4">
            {['Mail', 'Games', 'XakView', 'Social', 'Code'].map(item => (
              <li key={item}>
                <a href={`https://xakteir.com/${item.toLowerCase()}`} className="text-xs md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors italic block">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6 md:space-y-8">
          <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary">Company</h3>
          <ul className="space-y-3 md:space-y-4">
            <li><a href="https://xakteir.com/about" className="text-xs md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors italic block">About Us</a></li>
            <li><a href="https://xakteir.com/terms" className="text-xs md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors italic block">Terms of Service</a></li>
            <li><a href="https://xakteir.com/privacy" className="text-xs md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors italic block">Privacy Policy</a></li>
            <li><a href="https://xakteir.com/contact" className="text-xs md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors italic block">Contact Support</a></li>
            <li><a href="https://xakteir.com/download" className="text-xs md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors italic block">Downloads</a></li>
          </ul>
        </div>

        <div className="space-y-6 md:space-y-8">
          <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary">Founders</h3>
          <div className="space-y-4">
            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 group hover:border-primary/30 transition-all">
              <span className="text-xl md:text-2xl">😎</span>
              <div>
                <p className="text-[10px] md:text-xs font-black uppercase italic text-foreground">Ridwan</p>
                <p className="text-[7px] md:text-[8px] font-black uppercase text-primary tracking-widest">Founder / CEO</p>
              </div>
            </div>
            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 group hover:border-blue-500/30 transition-all">
              <span className="text-xl md:text-2xl">😁</span>
              <div>
                <p className="text-[10px] md:text-xs font-black uppercase italic text-foreground">Rayhan</p>
                <p className="text-[7px] md:text-[8px] font-black uppercase text-blue-400 tracking-widest">Co-Founder</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 md:mt-20 pt-8 md:pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 text-muted-foreground">
        <div className="flex items-center gap-4 md:gap-6">
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">© 2024 Xakteir</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-green-500" />
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Security Active</span>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-400" />
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">{userCount} Active Members</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Sync: 100%</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
