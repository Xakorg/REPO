"use client";

import React, { useState } from "react";
import { useXakCode } from "../context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Settings,
  Palette,
  Type,
  Clock,
  Volume2,
  Shield,
  Save,
  Undo2,
  Eye,
  Sun,
  Moon,
  Monitor,
  Zap,
} from "lucide-react";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    wordWrap,
    setWordWrap,
    tabSize,
    setTabSize,
    autoSaveInterval,
    setAutoSaveInterval,
    customThemes,
    saveCustomTheme,
    deleteCustomTheme,
    ambientVolumes,
    setAmbientVolume,
  } = useXakCode();
  const { toast } = useToast();

  const [customThemeName, setCustomThemeName] = useState("");
  const [customBg, setCustomBg] = useState("#07070e");
  const [customText, setCustomText] = useState("#f8f8f2");
  const [customAccent, setCustomAccent] = useState("#38bdf8");

  const handleSaveTheme = async () => {
    if (!customThemeName.trim()) return;
    await saveCustomTheme({
      name: customThemeName,
      author: "You",
      bgColor: customBg,
      textColor: customText,
      accentColor: customAccent,
      syntaxColors: {},
      isCustom: true,
    });
    setCustomThemeName("");
    toast({ title: "Theme Saved!" });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-6 text-left">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-sky-400" /> IDE Settings
          </h2>
          <p className="text-[10px] text-muted-foreground italic leading-relaxed">
            Customize your XakCode IDE experience with themes, fonts, and preferences.
          </p>
        </div>

        {/* Editor Settings */}
        <Card className="bg-zinc-900/40 border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
            <Palette className="w-4 h-4" /> Editor Appearance
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Theme */}
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {["dracula", "cyberpunk", "vscode", "monokai", "nord", "github-light"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t as any)}
                    className={cn(
                      "h-8 rounded-lg text-[8px] font-black uppercase border transition-all",
                      theme === t ? "bg-sky-500/20 border-sky-500/30 text-sky-400" : "bg-white/5 border-white/10 text-white/40"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Font Size</label>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min="8"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-white">{fontSize}px</span>
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="bg-black border border-white/10 rounded-lg text-xs text-white p-2 font-bold outline-none"
              >
                <option>JetBrains Mono</option>
                <option>Fira Code</option>
                <option>Monaco</option>
                <option>Source Code Pro</option>
                <option>Inter</option>
              </select>
            </div>

            {/* Tab Size */}
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Tab Size</label>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min="1"
                  max="8"
                  value={tabSize}
                  onChange={(e) => setTabSize(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-white">{tabSize} spaces</span>
              </div>
            </div>

            {/* Word Wrap */}
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Word Wrap</label>
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={cn(
                  "h-8 rounded-lg text-[8px] font-black uppercase border transition-all",
                  wordWrap ? "bg-sky-500/20 border-sky-500/30 text-sky-400" : "bg-white/5 border-white/10 text-white/40"
                )}
              >
                {wordWrap ? "ON" : "OFF"}
              </button>
            </div>

            {/* Auto Save */}
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Auto Save Interval</label>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min="0"
                  max="60"
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-white">{autoSaveInterval}s</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Custom Themes */}
        <Card className="bg-zinc-900/40 border-white/5 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
            <Palette className="w-4 h-4" /> Custom Themes
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Create New */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
              <span className="text-[8px] font-black uppercase text-white/40 block">Create Custom Theme</span>
              <Input
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                placeholder="My Theme"
                className="bg-zinc-950 border-white/10 h-8 text-xs text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <input type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="h-8 cursor-pointer" />
                <input type="color" value={customText} onChange={(e) => setCustomText(e.target.value)} className="h-8 cursor-pointer" />
                <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="h-8 cursor-pointer" />
              </div>
              <Button onClick={handleSaveTheme} className="w-full bg-sky-600 hover:bg-sky-500 rounded-lg text-[9px] font-black uppercase h-8 text-white">Save Theme</Button>
            </div>

            {/* Saved Themes */}
            {customThemes.length > 0 && customThemes.map((ct) => (
              <div key={ct.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white">{ct.name}</p>
                  <p className="text-[8px] text-white/30">by {ct.author}</p>
                </div>
                <Button onClick={() => deleteCustomTheme(ct.id)} variant="ghost" className="h-6 w-6 text-rose-400 hover:text-rose-300">
                  <Zap className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Ambient Sounds */}
        <Card className="bg-zinc-900/40 border-white/5 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
            <Volume2 className="w-4 h-4" /> Ambient Sounds
          </div>
          <div className="space-y-3">
            {[
              { key: "lofi", label: "Lofi Beats" },
              { key: "rain", label: "Heavy Rain" },
              { key: "cafe", label: "Cozy Cafe" },
              { key: "keyboard", label: "Key Clicks" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-[9px] font-black uppercase text-white/40 w-24">{label}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ambientVolumes[key as keyof typeof ambientVolumes]}
                  onChange={(e) => setAmbientVolume(key, Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[9px] font-mono text-white/50 w-8 text-right">
                  {ambientVolumes[key as keyof typeof ambientVolumes]}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
