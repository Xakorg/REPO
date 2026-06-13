"use client";

import { useEffect, useState } from "react";
import { Minus, Square, X, Layers, DownloadCloud, RotateCw } from "lucide-react";

export default function DesktopComingSoonPage() {
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auto-updater events via IPC
    if (typeof window !== "undefined" && (window as any).electron) {
      const { updater } = (window as any).electron;
      updater.onUpdateAvailable(() => setUpdateStatus("A new update is downloading..."));
      updater.onUpdateDownloaded(() => setUpdateStatus("Update ready to install!"));
    }
  }, []);

  const handleMinimize = () => {
    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.window.maximize();
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.window.close();
    }
  };

  const handleRestart = () => {
    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.updater.restartApp();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#05030d] text-white overflow-hidden border border-white/10 rounded-xl shadow-2xl">
      {/* Custom Title Bar */}
      <header className="h-8 bg-black/80 flex items-center justify-between select-none" style={{ WebkitAppRegion: "drag" } as any}>
        <div className="flex items-center gap-2 pl-3 opacity-70">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest italic text-white/70">Xakteir Suite</span>
        </div>
        <div className="flex items-center h-full" style={{ WebkitAppRegion: "no-drag" } as any}>
          <button onClick={handleMinimize} className="w-10 h-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Minus className="w-3.5 h-3.5 text-white/70" />
          </button>
          <button onClick={handleMaximize} className="w-10 h-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Square className="w-3 h-3 text-white/70" />
          </button>
          <button onClick={handleClose} className="w-10 h-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors text-white/70 group">
            <X className="w-4 h-4 group-hover:text-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center flex-col relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-primary/20 rounded-3xl border border-primary/30 flex items-center justify-center shadow-[0_0_50px_rgba(147,51,234,0.3)] animate-pulse">
            <Layers className="w-12 h-12 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl font-black uppercase italic tracking-tighter">Xakteir Suite Desktop</h1>
            <p className="text-xl text-primary/80 font-black tracking-widest uppercase">Coming Soon</p>
          </div>

          <p className="max-w-md text-sm text-zinc-400 font-medium leading-relaxed opacity-80">
            We are wrapping up the final native optimizations. This executable automatically updates over-the-air, so you'll never have to redownload it.
          </p>

          {/* Auto-Updater Status */}
          {updateStatus && (
            <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4 animate-fade-in">
              <DownloadCloud className="w-5 h-5 text-primary animate-bounce" />
              <div className="text-left">
                <p className="text-xs font-black text-primary uppercase">{updateStatus}</p>
                {updateStatus.includes("ready") && (
                  <button onClick={handleRestart} className="mt-2 flex items-center gap-2 text-[10px] font-bold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors uppercase">
                    <RotateCw className="w-3 h-3" /> Restart to Update
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
