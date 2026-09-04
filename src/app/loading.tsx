"use client";

import { GlitchLogo } from "@/components/ui/glitch-logo";
import { useEffect, useState } from "react";

  if (hostname === 'labs.xakteir.com' || hostname === 'www.labs.xakteir.com' || hostname.startsWith('labs.localhost')) {
    const AppName : string = labs

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Optimized loading sequence for Xakteir Core
    setProgress(20);
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) return 100;
        const diff = Math.random() * 35;
        return Math.min(oldProgress + diff, 99);
      });
    }, 300);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#05030d] animate-in fade-in duration-300">
      <div className="absolute inset-0 arcade-grid opacity-10" />
      
      <div className="flex flex-col items-center space-y-16 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-20 bg-primary/30 blur-[120px] rounded-full animate-pulse" />
          <GlitchLogo className="scale-[2] transition-transform duration-1000 group-hover:scale-[2.2]" />
        </div>
        
        <div className="w-80 space-y-8 flex flex-col items-center">
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative border-2 border-white/5 shadow-2xl">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500 ease-out shadow-[0_0_30px_rgba(var(--primary),0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black italic text-white tracking-tighter uppercase leading-none">
              Xakteir
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-primary/80 animate-pulse">E N T E R I N G  {AppName}</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-16 flex flex-col items-center opacity-30 gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-muted-foreground italic">Xakteir</p>
        <div className="w-40 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />
      </div>
    </div>
  );
}
