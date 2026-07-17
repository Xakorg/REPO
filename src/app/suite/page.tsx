"use client";

import React, { useState, useEffect } from "react";
import { FileText, FileSpreadsheet, Presentation, FileJson, ArrowRight, Sparkles, Layers } from "lucide-react";
import { useUser } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GlitchLogo } from "@/components/ui/glitch-logo";

const SUITE_APPS = [
  {
    name: "Write",
    description: "The modern document editor for lightning-fast creation.",
    url: "/write",
    icon: FileText,
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    text: "text-blue-500"
  },
  {
    name: "Sheets",
    description: "Powerful spreadsheets built for seamless data crunching.",
    url: "/sheets",
    icon: FileSpreadsheet,
    color: "from-green-500/20 to-green-600/10",
    border: "border-green-500/30",
    text: "text-green-500"
  },
  {
    name: "Slides",
    description: "Create stunning presentations that captivate your audience.",
    url: "/slides",
    icon: Presentation,
    color: "from-yellow-500/20 to-yellow-600/10",
    border: "border-yellow-500/30",
    text: "text-yellow-500"
  },
  {
    name: "Forms",
    description: "Build beautiful forms and surveys in seconds.",
    url: "/forms",
    icon: FileJson,
    color: "from-purple-500/20 to-purple-600/10",
    border: "border-purple-500/30",
    text: "text-purple-500"
  }
];

export default function XakteirSuiteHub() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#05030d] text-white overflow-x-hidden selection:bg-primary/30 relative">
      <div className="absolute inset-0 arcade-grid opacity-[0.03] pointer-events-none" />
      
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-background/60 backdrop-blur-3xl z-50 flex items-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <GlitchLogo className="scale-50 group-hover:rotate-12 transition-all duration-500" />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
                Xakteir <span className="text-primary">Suite</span>
              </h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Workspace Hub</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!user ? (
              <Link href="/auth">
                <Button className="bg-primary hover:bg-primary/90 text-black font-black uppercase italic tracking-widest text-xs px-6 rounded-xl shadow-2xl">
                  Sign In
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                  <span className="text-[10px] font-black text-primary uppercase">
                    {user.email?.[0] || "U"}
                  </span>
                </div>
                <span className="text-xs font-bold text-white/80">{user.email}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-8 flex-1">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-2 w-fit">
                <Sparkles className="w-3 h-3" /> Professional Workspace
              </Badge>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] text-white">
                Do Your <br/> <span className="text-primary flex items-center gap-4 mt-2"><Layers className="w-12 h-12 md:w-16 md:h-16" /> Best Work.</span>
              </h2>
              <p className="text-lg md:text-xl text-white/50 font-bold max-w-xl leading-relaxed">
                A unified ecosystem of powerful applications designed to help you write, analyze, present, and collect data instantly.
              </p>
            </div>
            
            <div className="flex-1 w-full max-w-md relative group perspective">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
              <div className="relative bg-zinc-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl transform rotate-y-[-10deg] rotate-x-[10deg] group-hover:rotate-0 transition-transform duration-700">
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white italic">Active Projects</h3>
                    <p className="text-xs text-white/40">Synced across your devices</p>
                  </div>
                  <Badge className="bg-white/10 text-white border-none text-[10px] uppercase font-black">All Systems Go</Badge>
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 rounded-xl bg-white/5 flex items-center px-4 gap-4 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="w-6 h-6 rounded-md bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-white/10 rounded w-1/2" />
                        <div className="h-2 bg-white/5 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* App Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase italic tracking-widest text-white">The Suite Apps</h3>
              <div className="h-px bg-white/10 flex-1 ml-8" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SUITE_APPS.map((app, idx) => (
                <Link key={idx} href={app.url} className="group block h-full">
                  <div className={`h-full p-6 md:p-8 rounded-3xl bg-zinc-900/50 border ${app.border} backdrop-blur-sm relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-${app.text}/10`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className={`w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-8 shadow-xl ${app.text}`}>
                        <app.icon className="w-6 h-6" />
                      </div>
                      
                      <h4 className="text-2xl font-black uppercase italic tracking-tight text-white mb-4 group-hover:text-primary transition-colors">
                        {app.name}
                      </h4>
                      <p className="text-sm text-white/50 font-medium leading-relaxed mb-8 flex-1">
                        {app.description}
                      </p>
                      
                      <div className="flex items-center text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors mt-auto">
                        Launch App <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
