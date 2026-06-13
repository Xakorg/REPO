"use client";

import React from "react";
import { useXakCode, type EditorTheme } from "../context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Palette, 
  Type, 
  Files, 
  Save, 
  Users, 
  Keyboard, 
  Sparkles, 
  ChevronRight, 
  BadgeHelp 
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
    multiplayerActive,
    setMultiplayerActive
  } = useXakCode();

  const themes: { id: EditorTheme; name: string; bg: string; color: string; desc: string }[] = [
    { id: "dracula", name: "Dracula Midnight", bg: "bg-[#282a36]", color: "text-[#ff79c6]", desc: "Vampire cybersecurity palette" },
    { id: "cyberpunk", name: "Cyberpunk Neon", bg: "bg-[#0c051a]", color: "text-[#00ffcc]", desc: "Vibrant retro neon grid synthwave" },
    { id: "vscode", name: "VS Dark Modern", bg: "bg-[#1e1e1e]", color: "text-[#569cd6]", desc: "Standard production developer layout" },
    { id: "monokai", name: "Monokai Retro", bg: "bg-[#272822]", color: "text-[#a6e22e]", desc: "Legendary high-contrast classic theme" },
    { id: "nord", name: "Nord Arctic Frost", bg: "bg-[#2e3440]", color: "text-[#88c0d0]", desc: "Clean, ice-cold Nordic design aesthetics" },
    { id: "github-light", name: "GitHub Bright", bg: "bg-[#ffffff] border border-black/10", color: "text-[#0969da]", desc: "Pristine white repository format" }
  ];

  const fontFamilies = ["JetBrains Mono", "Fira Code", "Source Code Pro", "Courier Prime"];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-zinc-950/20">
      <div className="max-w-4xl mx-auto space-y-8 pb-16 text-left">
        
        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">IDE Preferences</h2>
          <p className="text-xs text-muted-foreground italic leading-relaxed">Customize editor interfaces, auto-save parameters, typography layers, and simulated team pipelines.</p>
        </div>

        {/* Section 1: Themes */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
            <Palette className="w-4.5 h-4.5" /> Color Schemes & Themes
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map(t => {
              const active = theme === t.id;
              return (
                <Card 
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl flex flex-col justify-between h-28 ${t.bg} border-2 ${active ? "border-sky-500 shadow-lg" : "border-white/5 bg-opacity-40"}`}
                >
                  <div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${t.color}`}>{t.name}</h3>
                    <p className="text-[9px] text-white/50 italic mt-1 font-medium">{t.desc}</p>
                  </div>
                  <span className="text-[8px] font-black uppercase text-white/30 self-end select-none">
                    {active ? "ACTIVE" : "SELECT"}
                  </span>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Section 2: Editor Formatting */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Typography */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-2.5xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
              <Type className="w-4.5 h-4.5" /> Editor Typography
            </div>
            
            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-white/80">
                <span>Font Size</span>
                <span className="text-sky-400 font-black">{fontSize}px</span>
              </div>
              <Slider 
                value={[fontSize]}
                onValueChange={(val) => setFontSize(val[0])}
                min={10} 
                max={20} 
                step={1}
                className="cursor-pointer"
              />
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block">Font Family</label>
              <div className="grid grid-cols-2 gap-2">
                {fontFamilies.map(font => {
                  const selected = fontFamily === font;
                  return (
                    <Button
                      key={font}
                      onClick={() => setFontFamily(font)}
                      variant={selected ? "default" : "outline"}
                      className={`h-10 text-[9px] font-bold uppercase rounded-xl border-white/10 ${selected ? "bg-sky-600 text-white" : "text-white/60 hover:text-white"}`}
                    >
                      {font}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Formatting Rules */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-2.5xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
              <Files className="w-4.5 h-4.5" /> Syntax & Tabs
            </div>

            {/* Word Wrap */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-white/85 block">Word Wrap</span>
                <span className="text-[9px] text-white/40 italic font-medium">Wrap long lines to fit the editor container.</span>
              </div>
              <Switch checked={wordWrap} onCheckedChange={setWordWrap} />
            </div>

            {/* Tab Spacing */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block">Tab Size (Spaces)</label>
              <div className="flex gap-2">
                {[2, 4, 8].map(size => {
                  const selected = tabSize === size;
                  return (
                    <Button
                      key={size}
                      onClick={() => setTabSize(size)}
                      variant={selected ? "default" : "outline"}
                      className={`flex-1 h-9 text-[9px] font-bold uppercase rounded-xl border-white/10 ${selected ? "bg-sky-600 text-white" : "text-white/60 hover:text-white"}`}
                    >
                      {size} Spaces
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Auto-Save & Team Collaboration */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cloud Auto-save */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-2.5xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
              <Save className="w-4.5 h-4.5" /> Auto-Save Intervals
            </div>
            <p className="text-[9px] text-white/40 italic font-medium">Auto-commit active file buffer to Cloud Firestore storage on background timer.</p>
            
            <div className="flex gap-2 pt-2">
              {[
                { label: "Off", val: 0 },
                { label: "10s", val: 10 },
                { label: "30s", val: 30 },
                { label: "60s", val: 60 }
              ].map(item => {
                const selected = autoSaveInterval === item.val;
                return (
                  <Button
                    key={item.label}
                    onClick={() => setAutoSaveInterval(item.val)}
                    variant={selected ? "default" : "outline"}
                    className={`flex-1 h-9 text-[9px] font-bold uppercase rounded-xl border-white/10 ${selected ? "bg-sky-600 text-white" : "text-white/60 hover:text-white"}`}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Multiplayer Typing Simulation */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-2.5xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
              <Users className="w-4.5 h-4.5" /> Multiplayer Coding Emulation
            </div>
            <p className="text-[9px] text-white/40 italic font-medium">Simulates active keystrokes, diagnostics, and cursor movements from mock collaborators in the workspace.</p>
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] uppercase font-bold text-white/85">Enable Mock Collaborators</span>
              <Switch checked={multiplayerActive} onCheckedChange={setMultiplayerActive} />
            </div>
          </div>
        </section>

        {/* Section 4: Keyboard Cheat Sheet */}
        <section className="bg-zinc-900/40 border border-white/5 rounded-2.5xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
            <Keyboard className="w-4.5 h-4.5" /> Keyboard Shortcuts & Actions
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] font-mono">
            <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center">
              <span className="text-white/40 font-sans">Indent spacing</span>
              <kbd className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-sky-400 border border-white/15">Tab</kbd>
            </div>
            <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center">
              <span className="text-white/40 font-sans">Toggle comment</span>
              <kbd className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-sky-400 border border-white/15">Ctrl + /</kbd>
            </div>
            <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center">
              <span className="text-white/40 font-sans">Search code</span>
              <kbd className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-sky-400 border border-white/15">Ctrl + F</kbd>
            </div>
            <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center">
              <span className="text-white/40 font-sans">Quick format</span>
              <kbd className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-sky-400 border border-white/15">Ctrl + Alt + F</kbd>
            </div>
            <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center">
              <span className="text-white/40 font-sans">Undo history</span>
              <kbd className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-sky-400 border border-white/15">Ctrl + Z</kbd>
            </div>
            <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center">
              <span className="text-white/40 font-sans">Redo state</span>
              <kbd className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-sky-400 border border-white/15">Ctrl + Y</kbd>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
