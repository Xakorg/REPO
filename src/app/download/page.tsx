"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Settings, 
  Loader2,
  FolderOpen,
  X,
  ChevronRight,
  ShieldCheck,
  Zap,
  Terminal,
  HardDrive,
  ExternalLink,
  Play
} from "lucide-react";
import { GlitchLogo } from "@/components/ui/glitch-logo";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DownloadPage() {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const { toast } = useToast();

  const handleDownload = (type: 'desktop' | 'mobile') => {
    setDownloadStarted(true);
    toast({ 
      title: "Downloading...", 
      description: `Xakteir_${type === 'desktop' ? 'Pro_Setup.exe' : 'Mobile_Pro.apk'} is downloading.` 
    });

    const link = document.createElement('a');
    link.href = '#';
    link.setAttribute('download', type === 'desktop' ? 'Xakteir_Pro_Setup.exe' : 'Xakteir_Mobile_Pro.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto py-20 space-y-24 animate-fade-in px-6 text-foreground">
      <header className="text-center space-y-12">
        <div className="flex justify-center relative">
          <div className="absolute -inset-20 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
          <GlitchLogo className="scale-[3.5] relative z-10" />
        </div>
        <div className="space-y-4 pt-12">
          <h1 className="text-8xl font-black tracking-tighter uppercase italic leading-none text-foreground drop-shadow-2xl">Get Xakteir</h1>
          <p className="text-2xl text-muted-foreground font-black uppercase tracking-[0.4em] italic opacity-60">Installer Suite // Anti-Gravity Core</p>
        </div>
      </header>

      {downloadStarted && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500">
          <Card className="bg-green-600/90 backdrop-blur-xl border-4 border-white/20 p-8 rounded-[2.5rem] shadow-[0_50px_100px_rgba(34,197,94,0.4)] flex items-center gap-8 text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/20 animate-wiggle">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight">Download Complete!</h3>
              <p className="text-xs font-bold uppercase opacity-80 mt-1 tracking-widest">Ready to run the setup wizard.</p>
            </div>
            <Link href="/installer">
              <Button className="h-16 px-10 bg-white text-green-600 hover:bg-white/90 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95">
                <Play className="w-5 h-5 mr-3 fill-green-600" /> Run Setup
              </Button>
            </Link>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <Card className="glass-card rounded-[4.5rem] p-12 border-4 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent flex flex-col group overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)] transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Monitor className="w-80 h-80 -rotate-12 text-primary" />
          </div>
          <div className="relative z-10 flex-1 space-y-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/10 flex items-center justify-center border-4 border-white/20 shadow-2xl animate-float">
                <Terminal className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Desktop Pro</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-3 flex items-center gap-2">Windows / Mac / Linux</p>
              </div>
            </div>
            <ul className="space-y-5 text-muted-foreground">
              {["High-Intensity Graphics Core", "Native Hub Notifications", "System Level Integration"].map(feat => (
                <li key={feat} className="flex items-center gap-5 text-sm font-bold uppercase italic opacity-90 transition-all group-hover:translate-x-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-primary" /></div> {feat}
                </li>
              ))}
            </ul>
            <Button onClick={() => handleDownload('desktop')} className="w-full h-24 bg-primary hover:bg-primary/90 text-white rounded-[2.5rem] font-black uppercase text-xl tracking-[0.3em] shadow-2xl border-4 border-white/20 transition-all active:scale-95">
              <Download className="w-8 h-8 mr-6 animate-bounce" /> Get EXE File
            </Button>
          </div>
        </Card>

        <Card className="glass-card rounded-[4.5rem] p-12 border-4 border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent flex flex-col group overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)] transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Smartphone className="w-80 h-80 -rotate-12 text-blue-400" />
          </div>
          <div className="relative z-10 flex-1 space-y-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/10 flex items-center justify-center border-4 border-white/20 shadow-2xl animate-float">
                <Smartphone className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Mobile Zone</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mt-3 flex items-center gap-2">Android / iOS Pro</p>
              </div>
            </div>
            <ul className="space-y-5 text-muted-foreground">
              {["Touch-Optimized Fun Controls", "Real-Time Message Alerts", "Low-Power Battery Mode"].map(feat => (
                <li key={feat} className="flex items-center gap-5 text-sm font-bold uppercase italic opacity-90 transition-all group-hover:translate-x-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-blue-400" /></div> {feat}
                </li>
              ))}
            </ul>
            <Button onClick={() => handleDownload('mobile')} className="w-full h-24 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] font-black uppercase text-xl tracking-[0.3em] shadow-2xl border-4 border-white/20 transition-all active:scale-95">
              <Download className="w-8 h-8 mr-6 animate-bounce" /> Get APK File
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
