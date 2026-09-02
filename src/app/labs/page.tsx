"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FlaskConical, Sparkles, Cpu, Globe, Zap, ArrowRight, 
  Brain, Mic, Box, ShieldCheck, Activity, Terminal, Code2, 
  Layers, Search, Compass, ExternalLink, Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function XakLabsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const labProjects = [
    {
      id: "knowledge",
      title: "Knowledge Engine 2.0",
      category: "AI Research",
      status: "STABLE BETA",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      description: "AI-powered learning workspace with interactive study flashcards, topic mind-maps, and document summarizers.",
      route: "/knowledge",
      icon: Brain,
      gradient: "from-purple-900/40 via-indigo-900/20 to-black"
    },
    {
      id: "neural-voice",
      title: "AI Neural Voice Synthesizer",
      category: "Audio AI",
      status: "EXPERIMENTAL",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description: "Real-time voice emotion synthesis engine with natural pitch modulation and low latency text-to-speech.",
      route: "#",
      icon: Mic,
      gradient: "from-amber-900/40 via-orange-900/20 to-black"
    },
    {
      id: "quantum-matrix",
      title: "3D Quantum Matrix Simulator",
      category: "WebGL Physics",
      status: "ALPHA",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      description: "Interactive node graph simulator calculating quantum superposition states in real-time WebGL canvas.",
      route: "#",
      icon: Box,
      gradient: "from-cyan-900/40 via-blue-900/20 to-black"
    },
    {
      id: "holo-web",
      title: "Holographic Spatial Workspace",
      category: "AR / Spatial",
      status: "CONCEPT",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      description: "Spatial browser interface rendering windows in 3D perspective with WebXR gesture tracking.",
      route: "#",
      icon: Globe,
      gradient: "from-pink-900/40 via-rose-900/20 to-black"
    },
    {
      id: "agent-sandbox",
      title: "Xak Code AI Agent Sandbox",
      category: "Autonomous AI",
      status: "LABS PREVIEW",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      description: "Autonomous code generation environment that runs isolated terminal tests and self-corrects syntax.",
      route: "/xakcode",
      icon: Terminal,
      gradient: "from-emerald-900/40 via-teal-900/20 to-black"
    }
  ];

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-6 space-y-10 animate-fade-in text-foreground pb-24">
      {/* Header Banner */}
      <header className="glass-card p-10 rounded-[3rem] border-white/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-black">
        <div className="absolute top-0 right-0 p-8 opacity-10 animate-pulse pointer-events-none">
          <FlaskConical className="w-96 h-96 -rotate-12 text-purple-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-widest">
            <FlaskConical className="w-4 h-4 text-purple-400" /> labs.xakteir.com • Experimental Laboratory
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
            Xakteir Labs
          </h1>
          <p className="text-white/70 max-w-2xl text-sm font-medium leading-relaxed italic">
            Welcome to the R&D playground of Xakteir. Here we build cutting-edge prototypes, experimental AI models, spatial WebGL engines, and next-gen tools.
          </p>
        </div>
      </header>

      {/* Domain Info Card */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-purple-400" />
          <span className="text-xs text-white/80 font-bold">Domain Routing Active:</span>
          <code className="text-xs bg-black/60 px-2.5 py-1 rounded-md text-purple-300 border border-purple-500/20 font-mono">labs.xakteir.com</code>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 100% Operational
        </span>
      </div>

      {/* Experimental Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {labProjects.map((proj) => (
          <Card key={proj.id} className={`glass-card rounded-[2.5rem] border-white/10 overflow-hidden bg-gradient-to-br ${proj.gradient} p-8 flex flex-col justify-between hover:border-purple-500/40 transition-all group shadow-2xl`}>
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <proj.icon className="w-7 h-7 text-white" />
                </div>
                <Badge className={`text-[9px] font-black tracking-wider uppercase border ${proj.badgeColor}`}>
                  {proj.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{proj.category}</span>
                <h3 className="text-2xl font-black uppercase italic tracking-tight text-white group-hover:text-purple-300 transition-colors">
                  {proj.title}
                </h3>
                <p className="text-xs text-white/70 font-medium leading-relaxed italic">
                  {proj.description}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between mt-6">
              <span className="text-[10px] font-bold text-white/40 uppercase">Xakteir Labs Spec</span>
              <Button 
                onClick={() => {
                  if (proj.route === "#") {
                    toast({ title: "Labs Preview", description: `${proj.title} is currently compiling in active sandbox!` });
                  } else {
                    router.push(proj.route);
                  }
                }}
                className="bg-white/10 hover:bg-purple-600 text-white font-bold text-xs rounded-xl h-10 px-5 transition-all group-hover:scale-105"
              >
                Launch Prototype <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
