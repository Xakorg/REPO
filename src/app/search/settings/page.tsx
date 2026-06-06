"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Bell, Eye, History, Sparkles, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "rose", label: "Rose Neon", color: "bg-rose-500", border: "border-rose-500/50" },
  { id: "blue", label: "Cyber Blue", color: "bg-blue-500", border: "border-blue-500/50" },
  { id: "green", label: "Matrix Green", color: "bg-emerald-500", border: "border-emerald-500/50" },
  { id: "indigo", label: "Retro Indigo", color: "bg-indigo-500", border: "border-indigo-500/50" },
  { id: "amber", label: "Amber Glow", color: "bg-amber-500", border: "border-amber-500/50" },
  { id: "violet", label: "Synth Violet", color: "bg-violet-500", border: "border-violet-500/50" }
];

export default function SearchSettingsPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Settings state
  const [safeSearch, setSafeSearch] = useState(true);
  const [theme, setTheme] = useState("rose");
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [newTab, setNewTab] = useState(true);
  const [pauseHistory, setPauseHistory] = useState(false);

  useEffect(() => {
    // Load current values
    try {
      setSafeSearch(localStorage.getItem("xaksearch_safesearch") !== "false");
      setTheme(localStorage.getItem("xaksearch_theme") || "rose");
      setResultsPerPage(Number(localStorage.getItem("xaksearch_results_per_page") || "10"));
      setNewTab(localStorage.getItem("xaksearch_new_tab") !== "false");
      setPauseHistory(localStorage.getItem("xaksearch_pause_history") === "true");
    } catch (e) {
      console.warn("Failed to load settings from localStorage", e);
    }
    setMounted(false);
    setTimeout(() => setMounted(true), 50);
  }, []);

  const saveSetting = (key: string, value: string | boolean | number) => {
    try {
      localStorage.setItem(key, String(value));
      toast({
        title: "Settings Updated",
        description: "Your search preferences have been saved locally.",
        duration: 2000,
      });
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  };

  const handleReset = () => {
    localStorage.setItem("xaksearch_safesearch", "true");
    localStorage.setItem("xaksearch_theme", "rose");
    localStorage.setItem("xaksearch_results_per_page", "10");
    localStorage.setItem("xaksearch_new_tab", "true");
    localStorage.setItem("xaksearch_pause_history", "false");

    setSafeSearch(true);
    setTheme("rose");
    setResultsPerPage(10);
    setNewTab(true);
    setPauseHistory(false);

    toast({
      title: "Settings Reset",
      description: "Preferences have been restored to defaults.",
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-rose-500/30">
      <div className="absolute inset-0 arcade-grid opacity-[0.03] pointer-events-none" />

      <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 animate-fade-in relative z-10">
        <header className="flex items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-6">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                XakSearch Settings
              </h1>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                Customize your search experience
              </p>
            </div>
          </div>

          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider h-10 px-4 flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Privacy & Filtering */}
          <Card className="glass-card p-8 border-zinc-800 bg-zinc-900/20 rounded-[2.5rem] space-y-6 shadow-2xl">
            <h3 className="text-lg font-black uppercase italic flex items-center gap-3 text-rose-400">
              <Shield className="w-5 h-5 text-rose-500" /> Filtering & Safety
            </h3>

            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold uppercase tracking-wide text-zinc-200">SafeSearch Filter</div>
                  <p className="text-[11px] text-zinc-500 leading-normal font-medium max-w-[240px]">
                    Hide explicit content and aggressive terms from search results.
                  </p>
                </div>
                <Switch
                  checked={safeSearch}
                  onCheckedChange={(checked) => {
                    setSafeSearch(checked);
                    saveSetting("xaksearch_safesearch", checked);
                  }}
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>

              <div className="h-px bg-zinc-800" />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold uppercase tracking-wide text-zinc-200">Pause Search History</div>
                  <p className="text-[11px] text-zinc-500 leading-normal font-medium max-w-[240px]">
                    Stop saving search terms to history logs in this browser session.
                  </p>
                </div>
                <Switch
                  checked={pauseHistory}
                  onCheckedChange={(checked) => {
                    setPauseHistory(checked);
                    saveSetting("xaksearch_pause_history", checked);
                  }}
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>
            </div>
          </Card>

          {/* Theme & Design Settings */}
          <Card className="glass-card p-8 border-zinc-800 bg-zinc-900/20 rounded-[2.5rem] space-y-6 shadow-2xl">
            <h3 className="text-lg font-black uppercase italic flex items-center gap-3 text-rose-400">
              <Sparkles className="w-5 h-5 text-rose-500" /> Design & Accents
            </h3>

            <div className="space-y-4 pt-2">
              <div className="text-sm font-bold uppercase tracking-wide text-zinc-200 mb-2">Accent Theme Color</div>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      saveSetting("xaksearch_theme", t.id);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border bg-zinc-900/50 hover:bg-zinc-800/80 transition-all text-[10px] font-black uppercase tracking-wider relative",
                      theme === t.id ? cn("border-zinc-500", t.border) : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <div className={cn("w-6 h-6 rounded-full shadow-inner", t.color)} />
                    <span>{t.label.split(" ")[1]}</span>
                    {theme === t.id && (
                      <span className="absolute top-1 right-1 w-3 h-3 bg-white text-black rounded-full flex items-center justify-center p-[2px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Search Results Preference */}
          <Card className="glass-card p-8 border-zinc-800 bg-zinc-900/20 rounded-[2.5rem] space-y-6 shadow-2xl md:col-span-2">
            <h3 className="text-lg font-black uppercase italic flex items-center gap-3 text-rose-400">
              <Eye className="w-5 h-5 text-rose-500" /> Results Display
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold uppercase tracking-wide text-zinc-200">Open Links in New Tab</div>
                  <p className="text-[11px] text-zinc-500 leading-normal font-medium max-w-[280px]">
                    Clicking on websites opens them in a separate browser window.
                  </p>
                </div>
                <Switch
                  checked={newTab}
                  onCheckedChange={(checked) => {
                    setNewTab(checked);
                    saveSetting("xaksearch_new_tab", checked);
                  }}
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold uppercase tracking-wide text-zinc-200">Results Per Page</div>
                  <p className="text-[11px] text-zinc-500 leading-normal font-medium max-w-[280px]">
                    The default number of website search results to display per query.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setResultsPerPage(num);
                        saveSetting("xaksearch_results_per_page", num);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-black transition-all",
                        resultsPerPage === num ? "bg-rose-500 text-white" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
