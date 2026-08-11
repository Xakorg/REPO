"use client";

import React, { useState } from "react";
import { ArrowLeft, Play, ExternalLink, ShieldCheck, Zap, Monitor, Gamepad2, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RobloxCloudPage() {
  const [provider, setProvider] = useState<"nowgg" | "web">("nowgg");

  const nowggUrl = "https://now.gg/play/roblox-corporation/5349/roblox";
  const webUrl = "https://www.roblox.com/home";

  return (
    <div className="min-h-screen bg-[#070514] text-white flex flex-col selection:bg-rose-500/30">
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="rounded-xl border border-white/10 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Games
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-black text-xs shadow-lg">RBX</div>
            <div>
              <h1 className="font-black uppercase tracking-tight text-sm flex items-center gap-2">
                Roblox <span className="bg-rose-500/20 text-rose-400 text-[9px] px-2 py-0.5 rounded-full border border-rose-500/30">100% Free Cloud</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Provider Switcher */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setProvider("nowgg")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              provider === "nowgg" ? "bg-rose-500 text-white shadow-lg" : "text-white/60 hover:text-white"
            }`}
          >
            Now.gg Cloud Stream (Free)
          </button>
          <button
            onClick={() => setProvider("web")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              provider === "web" ? "bg-red-600 text-white shadow-lg" : "text-white/60 hover:text-white"
            }`}
          >
            Roblox Web Launcher
          </button>
        </div>
      </header>

      {/* Main Cloud Workspace */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner Card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-rose-950/80 via-purple-950/40 to-black p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" /> Instant Browser & Cloud Stream
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
              Play Roblox Free on Xakteir
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Experience millions of user-created games, obstacle courses, and RPG worlds 100% FREE! Play directly inside your browser via Now.gg Cloud Gaming or launch with 1-click web protocol.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={provider === "nowgg" ? nowggUrl : webUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="h-14 px-8 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all scale-105 active:scale-95">
                  <Play className="w-5 h-5 mr-3 fill-white" /> Launch Roblox Stream
                </Button>
              </a>

              <a
                href="https://www.roblox.com"
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" className="h-14 px-6 border-white/20 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider">
                  <ExternalLink className="w-4 h-4 mr-2" /> Official Roblox Site
                </Button>
              </a>
            </div>
          </div>

          <div className="w-full md:w-80 aspect-video md:aspect-square rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl relative group">
            <img
              src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=800&q=80"
              alt="Roblox Banner"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Now.gg Cloud Verified
              </span>
            </div>
          </div>
        </div>

        {/* Embedded Stream View Frame */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Monitor className="w-5 h-5 text-rose-400" /> Embedded Stream Portal
            </h3>
            <span className="text-xs text-white/50">Provider: {provider === "nowgg" ? "Now.gg Cloud Stream" : "Roblox Web Portal"}</span>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/80 aspect-video shadow-2xl flex flex-col items-center justify-center p-8 text-center">
            <iframe
              src={provider === "nowgg" ? nowggUrl : webUrl}
              className="w-full h-full absolute inset-0 border-0"
              allow="autoplay; gamepad; fullscreen; microphone"
              title="Roblox Cloud Gaming"
            />

            {/* Overlay if browser blocks iframe embed */}
            <div className="relative z-10 max-w-md bg-black/95 p-6 rounded-2xl border border-white/15 backdrop-blur-xl shadow-2xl space-y-4">
              <Gamepad2 className="w-12 h-12 text-rose-400 mx-auto animate-bounce" />
              <h4 className="font-black text-lg uppercase tracking-tight">Launch Roblox Cloud Stream</h4>
              <p className="text-xs text-white/60">
                Click below to launch Roblox in high-performance Cloud Gaming mode. Play any Roblox experience instantly without installation!
              </p>
              <a
                href={provider === "nowgg" ? nowggUrl : webUrl}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-xl">
                  Open {provider === "nowgg" ? "Now.gg Cloud Stream" : "Roblox Web Portal"} <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Instructions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
            <ShieldCheck className="w-6 h-6 text-rose-400" />
            <h4 className="font-bold text-sm">1. Free In-Browser Play</h4>
            <p className="text-xs text-white/60">Play Roblox on any device, Chromebook, or PC through free cloud streaming services.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
            <Gamepad2 className="w-6 h-6 text-purple-400" />
            <h4 className="font-bold text-sm">2. All Roblox Games Included</h4>
            <p className="text-xs text-white/60">Access Blox Fruits, Adopt Me, Brookhaven, Anime Defenders, and millions of user creations.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h4 className="font-bold text-sm">3. Instant Cross-Play</h4>
            <p className="text-xs text-white/60">Log in with your existing Roblox username & password to keep all your Robux, items, and progress.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
