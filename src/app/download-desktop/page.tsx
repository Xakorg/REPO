"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Monitor, Sparkles, FolderDown, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DownloadDesktopPage() {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCreateDesktopShortcuts = async () => {
    if (typeof window === "undefined") return;
    
    setDownloading(true);
    
    // Check if we are running inside Electron
    if ((window as any).electron) {
      try {
        const res = await (window as any).electron.invoke('create-desktop-shortcuts');
        if (res.success) {
          setSuccess(true);
        } else {
          alert("Error creating shortcuts: " + res.error);
        }
      } catch (e) {
        console.error(e);
        alert("Failed to communicate with desktop app.");
      }
    } else {
      // In a regular browser, we can't create desktop shortcuts natively.
      // But we can trigger the download of the actual Setup.exe if it's hosted, or notify them.
      alert("You are currently viewing this in a browser. To install the apps, please download the Xak AI Setup first.");
    }
    
    setDownloading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background grids */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-zinc-950/80 to-zinc-950"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/30 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-12">
        
        <button 
          onClick={() => router.back()} 
          className="absolute top-0 left-0 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
        >
          ← Back
        </button>

        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-6 rounded-3xl bg-white/5 border-2 border-white/10 shadow-2xl mb-4">
            <Monitor className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic drop-shadow-2xl">
            Get The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">Suite</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-white/60 max-w-2xl mx-auto italic">
            Download the Xakteir Apps folder directly to your desktop. It includes instant access to Xak AI, Xakteir Hub, Xakchat, and Xakteir Suite!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[
            { name: "Xak AI", desc: "Intelligent Assistant", icon: Sparkles, color: "text-primary", bg: "bg-primary/10" },
            { name: "Xakteir Hub", desc: "Main Dashboard", icon: Monitor, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { name: "Xakchat", desc: "Secure Messaging", icon: Monitor, color: "text-rose-400", bg: "bg-rose-500/10" },
            { name: "Xakteir Suite", desc: "Productivity Tools", icon: Monitor, color: "text-emerald-400", bg: "bg-emerald-500/10" }
          ].map((app) => (
            <Card key={app.name} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-center hover:bg-white/10 hover:border-white/20 transition-all shadow-xl group">
              <div className={`w-16 h-16 mx-auto rounded-2xl ${app.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <app.icon className={`w-8 h-8 ${app.color}`} />
              </div>
              <h3 className="font-black uppercase tracking-widest text-sm mb-2">{app.name}</h3>
              <p className="text-[10px] text-white/50 uppercase font-bold">{app.desc}</p>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Button 
            onClick={handleCreateDesktopShortcuts}
            disabled={downloading || success}
            className={`h-20 px-12 md:px-20 rounded-[2.5rem] font-black uppercase italic text-xl md:text-2xl shadow-[0_20px_60px_rgba(var(--primary),0.4)] transition-all ${
              success 
              ? "bg-emerald-500 hover:bg-emerald-600 text-white border-b-8 border-emerald-700" 
              : "bg-primary hover:bg-primary/90 text-white border-b-8 border-primary/40 active:border-b-0 active:translate-y-2"
            }`}
          >
            {downloading ? (
              <><Loader2 className="w-8 h-8 mr-3 animate-spin" /> Processing...</>
            ) : success ? (
              <><CheckCircle2 className="w-8 h-8 mr-3" /> Added to Desktop!</>
            ) : (
              <><FolderDown className="w-8 h-8 mr-3" /> Download App Folder</>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
