"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Ghost, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  Dice1 as Dice,
  Bomb,
  ChevronLeft,
  X,
  Orbit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function RietkaxPage() {
  const [gravity, setGravity] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const randomItems = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      icon: [Ghost, Zap, Sparkles, Bomb, Dice, Orbit][Math.floor(Math.random() * 6)],
      x: Math.random() * 95,
      y: Math.random() * 90,
      rot: Math.random() * 360,
      size: 20 + Math.random() * 60,
      delay: Math.random() * 2000
    }));
    setItems(randomItems);
  }, []);

  const toggleGravity = () => {
    setGravity(!gravity);
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-black overflow-hidden flex flex-col items-center justify-center selection:bg-rose-500">
      {/* Background Glitch - Global Reversed State */}
      <div className="absolute inset-0 scale-x-[-1] scale-y-[-1] pointer-events-none opacity-40">
        <div className="mesh-background absolute inset-0 !opacity-100" />
        <div className="arcade-grid absolute inset-0" />
      </div>

      <header className="absolute top-10 flex flex-col items-center space-y-4 z-[6000]">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/")}
          className="text-rose-500 hover:bg-rose-500/10 font-black uppercase text-[10px] tracking-[0.5em] h-14 px-12 rounded-full border-4 border-rose-500/20 scale-x-[-1] transition-all active:scale-95 bg-black/40 backdrop-blur-xl"
        >
          <ChevronLeft className="w-6 h-6 ml-4" /> Escape Mirror Dimension
        </Button>
        <div className="relative">
          <h1 className="text-8xl md:text-[12rem] font-black text-white italic tracking-tighter uppercase leading-none scale-x-[-1] animate-pulse drop-shadow-[0_0_80px_rgba(255,255,255,0.4)]">
            Rietkax
          </h1>
          <div className="absolute -top-10 -right-10 bg-rose-600 text-white text-[10px] font-black px-6 py-2 rounded-xl shadow-2xl rotate-12 scale-x-[-1] border-4 border-white/20">MIRROR_ROOT_AUTH</div>
        </div>
      </header>

      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {items.map((item) => (
          <div 
            key={item.id}
            className={cn(
              "absolute transition-all duration-[3500ms] ease-in-out",
              gravity ? "translate-y-[130vh] rotate-[1440deg]" : "animate-float"
            )}
            style={{ 
              left: `${item.x}%`, 
              top: `${item.y}%`, 
              transform: gravity ? `translateY(130vh) rotate(${item.rot + 1440}deg)` : `rotate(${item.rot}deg)`,
              opacity: 0.5,
              animationDelay: `${item.delay}ms`
            }}
          >
            <item.icon size={item.size} className="text-white" />
          </div>
        ))}

        <div className="z-[6000] space-y-12 flex flex-col items-center animate-in zoom-in-95 duration-700">
          <Card className="w-full max-w-[700px] glass-card border-8 border-rose-500/40 rounded-[6rem] p-12 md:p-24 text-center space-y-12 bg-black/60 shadow-[0_0_200px_rgba(225,29,72,0.5)] backdrop-blur-3xl scale-x-[-1]">
            <div className="space-y-8">
              <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl leading-none">Phase 0.0 Inverse</h2>
              <p className="text-lg md:text-xl text-muted-foreground font-bold italic leading-relaxed opacity-90">
                Logic has encountered a critical inverse error. You are observing the <span className="text-rose-500 underline decoration-rose-500 underline-offset-8">Rietkax Dimension</span>. 
                <br /><br />
                Gravity protocol is optional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8">
              <Button 
                onClick={toggleGravity}
                className={cn(
                  "h-20 md:h-28 rounded-[3rem] font-black uppercase text-sm tracking-widest transition-all shadow-2xl border-4",
                  gravity ? "bg-white text-black border-white" : "bg-rose-600 text-white border-rose-500 animate-pulse"
                )}
              >
                {gravity ? "Restore Anti-G" : "Toggle Gravity"}
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="h-20 md:h-28 rounded-[3rem] border-4 border-white/10 text-white font-black uppercase text-sm tracking-widest hover:bg-white/10 active:scale-95 transition-all">
                Sync Projects
              </Button>
            </div>
          </Card>

          <div className="flex flex-col md:flex-row gap-8 scale-x-[-1]">
            <div className="bg-black/80 backdrop-blur-xl px-12 py-6 rounded-[3rem] border-4 border-rose-500/60 flex items-center gap-6 shadow-2xl">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
              <span className="text-[14px] font-black uppercase text-rose-500 tracking-[0.5em]">LOGIC: CORRUPTED</span>
            </div>
            <div className="bg-black/80 backdrop-blur-xl px-12 py-6 rounded-[3rem] border-4 border-blue-500/60 flex items-center gap-6 shadow-2xl">
              <RotateCcw className="w-8 h-8 text-blue-400 animate-spin-slow" />
              <span className="text-[14px] font-black uppercase text-blue-400 tracking-[0.5em]">STATE: REVERSED</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-10 text-center opacity-30 scale-x-[-1]">
        <p className="text-[12px] font-black uppercase tracking-[2em] text-white">XAKTEIR MIRROR PROTOCOL V4.2.8</p>
      </footer>
    </div>
  );
}