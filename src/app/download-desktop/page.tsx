"use client";

import { Download, Monitor, Sparkles, Layers, TerminalSquare, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DownloadDesktopPage() {
  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <header className="h-20 border-b border-white/5 flex items-center px-8 z-10 bg-black/40 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <span className="text-2xl font-black uppercase italic tracking-tighter">Xakteir</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 z-10 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-6 mb-16">
          <Badge />
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40">
            Xakteir Hub <br /> for Desktop
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto font-medium">
            Take Xakteir to the next level. Install the native Windows desktop app for system-wide Xak AI overlay, file system integration, and blazing fast performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
          <FeatureCard 
            icon={<Monitor className="w-6 h-6 text-cyan-400" />}
            title="Always-On Overlay"
            desc="Say 'Hey Xak' anywhere in Windows to trigger the glowing screen overlay and ask questions instantly."
          />
          <FeatureCard 
            icon={<TerminalSquare className="w-6 h-6 text-emerald-400" />}
            title="System Automation"
            desc="Xak AI can launch apps, create files, and orchestrate terminal commands right on your hard drive."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-purple-400" />}
            title="Security Vault"
            desc="Native access to your identity personas and passwords from the system tray."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <a 
            href="/downloads/Xakteir%20Suite%20Setup%204.2.8.exe" 
            download
            className="h-16 px-8 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-[0_0_40px_rgba(var(--primary),0.4)]"
          >
            <Download className="w-5 h-5" />
            Download for Windows
          </a>
          <Link 
            href="/ai-chat" 
            className="h-16 px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
          >
            Open Web Version <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-6">
          Version 4.2.8 • Windows 10/11 (x64)
        </p>
      </main>
    </div>
  );
}

function Badge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
      <Sparkles className="w-4 h-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">Now Available</span>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-left group">
      <div className="w-12 h-12 rounded-2xl bg-black/50 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-black uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-sm text-white/50 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
