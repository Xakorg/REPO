"use client";

import { useUIStore, type HeaderStyle } from "@/lib/store";
import { Header } from "@/components/layout/Header";
import { Settings as SettingsIcon, LayoutTemplate, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const HEADER_LAYOUTS: { id: HeaderStyle; label: string; desc: string }[] = [
  { id: 'default', label: 'Default', desc: 'Balanced layout with Apps on the left and Profile on the right.' },
  { id: 'google', label: 'Google Style', desc: 'Minimalist layout with Logo on the left, Apps and Profile on the right.' },
  { id: 'right', label: 'Everything Right', desc: 'Logo on the left, all controls grouped on the right.' },
  { id: 'left', label: 'Everything Left', desc: 'All controls on the left, Logo on the right.' },
  { id: 'hamburger', label: 'Compact (Hamburger)', desc: 'Logo on the left, a single menu button on the right containing all features.' },
];

export default function SettingsPage() {
  const { headerStyle, setHeaderStyle } = useUIStore();

  return (
    <div className="min-h-screen bg-[#0a0a15] text-white flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-8 pt-12">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border-2 border-white/10 flex items-center justify-center shadow-xl">
            <SettingsIcon className="w-8 h-8 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">Settings</h1>
            <p className="text-white/40 text-sm tracking-widest uppercase font-black mt-1">Configure your Xakteir experience</p>
          </div>
        </div>

        <div className="grid gap-8">
          <section className="glass-card rounded-[2rem] p-8 border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3 mb-8">
              <LayoutTemplate className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-primary">Global Navigation Style</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {HEADER_LAYOUTS.map((layout) => {
                const isActive = headerStyle === layout.id;
                return (
                  <button
                    key={layout.id}
                    onClick={() => setHeaderStyle(layout.id)}
                    className={cn(
                      "text-left p-6 rounded-2xl border-2 transition-all group relative overflow-hidden",
                      isActive 
                        ? "bg-primary/10 border-primary shadow-[0_0_30px_rgba(var(--primary),0.2)]" 
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={cn("text-lg font-black uppercase italic tracking-tighter transition-colors", isActive ? "text-primary" : "text-white group-hover:text-primary")}>
                        {layout.label}
                      </h3>
                      {isActive && <Check className="w-5 h-5 text-primary" />}
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                      {layout.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
