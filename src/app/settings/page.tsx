"use client";

import { useUIStore, type HeaderStyle } from "@/lib/store";
import { Header, APPS } from "@/components/layout/Header";
import { Settings as SettingsIcon, LayoutTemplate, Check, GripVertical, Plus, X, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Reorder, motion } from "framer-motion";
import { AnimatedAppIcon } from "@/components/ui/AnimatedAppIcon";
import { useState } from "react";

const HEADER_LAYOUTS: { id: HeaderStyle; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'default', label: 'Default', desc: 'Balanced layout with Apps on the left and Profile on the right.', icon: <LayoutTemplate /> },
  { id: 'macos', label: 'macOS Style', desc: 'Sleek top menu bar style with dense icons and a unified glass effect.', icon: <MonitorSmartphone /> },
  { id: 'floating', label: 'Floating Pill', desc: 'Detached pill-shaped floating header in the top center.', icon: <LayoutTemplate className="scale-75" /> },
  { id: 'centered', label: 'Centered Logo', desc: 'Logo in the middle, controls split symmetrically on the sides.', icon: <LayoutTemplate /> },
  { id: 'google', label: 'Google Style', desc: 'Minimalist layout with Logo on the left, Apps and Profile on the right.', icon: <LayoutTemplate /> },
  { id: 'right', label: 'Everything Right', desc: 'Logo on the left, all controls grouped on the right.', icon: <LayoutTemplate /> },
  { id: 'left', label: 'Everything Left', desc: 'All controls on the left, Logo on the right.', icon: <LayoutTemplate /> },
  { id: 'hamburger', label: 'Compact', desc: 'Logo on the left, a single menu button on the right containing all features.', icon: <LayoutTemplate /> },
];

export default function SettingsPage() {
  const { headerStyle, setHeaderStyle, showLogo, setShowLogo, pinnedApps, setPinnedApps } = useUIStore();
  
  // Local state for the drag editor to make it feel smooth before syncing globally
  const [localPinnedApps, setLocalPinnedApps] = useState<string[]>(pinnedApps);
  const [appSearch, setAppSearch] = useState("");

  // Sync to global store when reordering finishes
  const handleReorder = (newOrder: string[]) => {
    setLocalPinnedApps(newOrder);
    setPinnedApps(newOrder);
  };

  const removePinnedApp = (appName: string) => {
    const next = localPinnedApps.filter(n => n !== appName);
    setLocalPinnedApps(next);
    setPinnedApps(next);
  };

  const addPinnedApp = (appName: string) => {
    if (localPinnedApps.includes(appName)) return;
    if (localPinnedApps.length >= 8) return; // Limit to 8 pinned apps
    const next = [...localPinnedApps, appName];
    setLocalPinnedApps(next);
    setPinnedApps(next);
  };

  const availableApps = APPS.filter(a => !localPinnedApps.includes(a.name) && a.name.toLowerCase().includes(appSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0a0a15] text-white flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 pt-12 pb-32">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border-2 border-white/10 flex items-center justify-center shadow-xl">
            <SettingsIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">Settings</h1>
            <p className="text-white/40 text-sm tracking-widest uppercase font-black mt-1">Configure your Xakteir experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <section className="glass-card rounded-[2rem] p-8 border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3 mb-8">
                <LayoutTemplate className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-primary">Global Navigation Style</h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
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
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-xl", isActive ? "bg-primary/20 text-primary" : "bg-white/10 text-white/50")}>
                            {layout.icon}
                          </div>
                          <h3 className={cn("text-lg font-black uppercase italic tracking-tighter transition-colors", isActive ? "text-primary" : "text-white group-hover:text-primary")}>
                            {layout.label}
                          </h3>
                        </div>
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

          <div className="space-y-8">
            <section className="glass-card rounded-[2rem] p-8 border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Header Logo</h2>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Show Xakteir Logo</p>
                </div>
                <Switch checked={showLogo} onCheckedChange={setShowLogo} />
              </div>
            </section>

            <section className="glass-card rounded-[2rem] p-8 border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col h-[600px]">
              <div className="mb-6">
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-emerald-400">Pinned Header Apps</h2>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Drag to reorder ({localPinnedApps.length}/8)</p>
              </div>

              <div className="bg-black/40 rounded-3xl p-4 border-2 border-white/5 mb-6 min-h-[120px]">
                <Reorder.Group axis="y" values={localPinnedApps} onReorder={handleReorder} className="space-y-2">
                  {localPinnedApps.map((appName) => {
                    const app = APPS.find(a => a.name === appName);
                    if (!app) return null;
                    return (
                      <Reorder.Item key={appName} value={appName} className="relative z-10">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group/item">
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-white/30 group-hover/item:text-white/60" />
                            <AnimatedAppIcon iconName={app.iconName} className="w-8 h-8 bg-white rounded-lg" size={32} />
                            <span className="text-sm font-black uppercase tracking-widest">{app.name}</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removePinnedApp(app.name); }}
                            className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                  {localPinnedApps.length === 0 && (
                    <div className="text-center py-6 text-white/30 text-xs font-black uppercase tracking-widest border-2 border-dashed border-white/10 rounded-2xl">
                      No pinned apps
                    </div>
                  )}
                </Reorder.Group>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-4">
                  <input 
                    type="text" 
                    placeholder="Search apps to add..." 
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all font-medium"
                  />
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {availableApps.map(app => (
                    <div key={app.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-transparent hover:border-white/10 transition-colors group/avail">
                      <div className="flex items-center gap-3">
                        <AnimatedAppIcon iconName={app.iconName} className="w-8 h-8 bg-white/80 rounded-lg opacity-50 group-hover/avail:opacity-100 transition-opacity" size={32} />
                        <span className="text-sm font-bold text-white/50 group-hover/avail:text-white transition-colors">{app.name}</span>
                      </div>
                      <button 
                        onClick={() => addPinnedApp(app.name)}
                        disabled={localPinnedApps.length >= 8}
                        className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-colors disabled:opacity-30"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
