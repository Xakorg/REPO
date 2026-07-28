
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  Settings, 
  FolderOpen, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  Terminal, 
  HardDrive,
  Zap,
  ShieldCheck,
  Monitor,
  Minus,
  Square
} from "lucide-react";
import { GlitchLogo } from "@/components/ui/glitch-logo";
import { useRouter } from "next/navigation";

export default function InstallerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  const [options, setOptions] = useState({ shortcut: true, startup: false });

  const startInstallation = () => {
    setStep(4);
    const installationSteps = [
      { p: 10, t: "Downloading Anti-Gravity Files..." },
      { p: 25, t: "Synchronizing System Core..." },
      { p: 45, t: "Unpacking Universal Asset Pack v4.2..." },
      { p: 65, t: "Optimizing Hub Graphics..." },
      { p: 85, t: "Finalizing Security Protocol..." },
      { p: 100, t: "Installation Complete!" }
    ];

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        const s = installationSteps.find(step => next >= step.p && next < step.p + 2);
        if (s) setStatusText(s.t);
        if (next >= 100) {
          clearInterval(interval);
          setStep(5);
          return 100;
        }
        return next;
      });
    }, 50);
  };

  const handleLaunch = () => {
    localStorage.setItem('xak_installed', 'true');
    window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-[680px] bg-[#1e1e1e] border-[1px] border-white/20 rounded-xl overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
        {/* Native Windows Header Mimic */}
        <header className="h-10 bg-[#2d2d2d] border-b border-white/5 flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
              <Settings className="w-2.5 h-2.5 text-primary" />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Xakteir Pro Setup Wizard</span>
          </div>
          <div className="flex">
            <button className="h-10 w-12 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60"><Minus className="w-3 h-3" /></button>
            <button className="h-10 w-12 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60"><Square className="w-2.5 h-2.5" /></button>
            <button onClick={() => window.location.href = '/download'} className="h-10 w-12 flex items-center justify-center hover:bg-[#e81123] transition-colors text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </header>
 
        <div className="flex h-[420px]">
          {/* Native-style Sidebar */}
          <div className="w-[220px] bg-[#252525] border-r border-white/5 p-8 flex flex-col items-center justify-center text-center space-y-8">
            <GlitchLogo className="scale-90" />
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Xakteir Hub</p>
              <p className="text-[8px] font-bold text-white/30 uppercase">Build v4.2.8.PRO</p>
            </div>
            <div className="pt-10 flex flex-col items-center gap-2 opacity-10">
              <ShieldCheck className="w-10 h-10 text-primary" />
              <p className="text-[7px] font-black uppercase tracking-widest text-white">Verified Publisher</p>
            </div>
          </div>
 
          {/* Main Wizard Content Area */}
          <div className="flex-1 p-12 flex flex-col bg-[#1e1e1e]">
            {step === 1 && (
              <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Ready to Launch?</h2>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Setup Phase 01: Authorization</p>
                </div>
                <p className="text-[12px] text-white/60 leading-relaxed font-medium italic">
                  This wizard will synchronize your local workstation with the Xakteir Hub Multiverse.
                  <br /><br />
                  Pro features include:
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-white/80"><CheckCircle2 className="w-3 h-3 text-primary" /> Anti-Gravity Asset Sync</li>
                    <li className="flex items-center gap-2 text-white/80"><CheckCircle2 className="w-3 h-3 text-primary" /> High-Fidelity 3D Acceleration</li>
                    <li className="flex items-center gap-2 text-white/80"><CheckCircle2 className="w-3 h-3 text-primary" /> Native Smart Buffering</li>
                  </ul>
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Destination Folder</h2>
                <div className="space-y-4">
                  <p className="text-[10px] text-white/40 font-bold uppercase">Choose where to store project files:</p>
                  <div className="p-5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between group cursor-pointer hover:border-primary transition-all">
                    <div className="flex items-center gap-4">
                      <HardDrive className="w-5 h-5 text-primary" />
                      <span className="text-[11px] font-mono text-white/80">C:\Program Files\Xakteir\Hub</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase bg-white/5 hover:bg-white/10">Browse</Button>
                  </div>
                  <div className="pt-6 grid grid-cols-2 gap-4 opacity-40">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase">Space Required</p>
                      <p className="text-xs font-bold text-white">420.0 MB</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase">Space Available</p>
                      <p className="text-xs font-bold text-white">12.4 GB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Registry Options</h2>
                <div className="space-y-4">
                  {[
                    { id: 'shortcut', label: 'Create Desktop Shortcut', checked: options.shortcut },
                    { id: 'startup', label: 'Launch Xakteir at Startup', checked: options.startup }
                  ].map(opt => (
                    <div key={opt.id} className="flex items-center justify-between p-5 bg-black/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <span className="text-[11px] font-bold text-white/80">{opt.label}</span>
                      <input 
                        type="checkbox" 
                        checked={opt.checked} 
                        onChange={() => setOptions({...options, [opt.id as keyof typeof options]: !opt.checked})}
                        className="w-5 h-5 accent-primary rounded-lg" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex-1 flex flex-col justify-center space-y-12 animate-in zoom-in-95 duration-500">
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">{statusText}</p>
                      <p className="text-[8px] font-bold text-white/30 uppercase">HUB CORE v4.2.8 SYNC ACTIVE</p>
                    </div>
                    <span className="text-2xl font-black text-white italic">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Zap className="w-4 h-4 text-primary animate-pulse" /></div>
                    <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Anti-G Mode</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Monitor className="w-4 h-4 text-blue-400" /></div>
                    <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">4K Graphics</span>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
                <div className="w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.4)] animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">Hub Synced!</h2>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em]">Professional Build Ready</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wizard Navigation Footer */}
        <footer className="h-20 bg-[#2d2d2d] border-t border-white/5 flex items-center justify-end px-10 gap-4">
          {step < 4 && (
            <>
              <Button variant="ghost" onClick={() => window.location.href = '/download'} className="h-12 px-8 text-[11px] font-bold text-white/40 hover:text-white uppercase">Cancel</Button>
              <Button 
                onClick={() => step < 3 ? setStep(step + 1) : startInstallation()} 
                className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-12 font-black uppercase text-[11px] tracking-widest shadow-xl border-b-4 border-primary/20 active:border-b-0 active:translate-y-1 transition-all"
              >
                {step === 3 ? "Install" : "Next"} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          {step === 5 && (
            <Button 
              onClick={handleLaunch} 
              className="bg-green-600 hover:bg-green-500 text-white rounded-xl h-14 px-16 font-black uppercase text-sm tracking-widest shadow-[0_20px_50px_rgba(34,197,94,0.3)] border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
            >
              Launch Xakteir Pro
            </Button>
          )}
        </footer>
      </Card>
    </div>
  );
}
