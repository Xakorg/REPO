"use client";

import { useState } from "react";
import { Download, Monitor, Sparkles, X, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function DesktopLauncherBar() {
  const { toast } = useToast();
  const [visible, setVisible] = useState(true);

  const handleLaunchDesktop = () => {
    toast({ title: "Launching XakChat Desktop Native App... 🚀" });
    if ((window as any).electronAPI) {
      (window as any).electronAPI.openApp?.("xakchat");
    } else {
      window.open("xakchat://launch", "_blank");
    }
  };

  const handleDownloadInstaller = () => {
    toast({ title: "Downloading XakChat Desktop Setup 1.0.0.exe..." });
    const a = document.createElement("a");
    a.href = "/installer";
    a.click();
  };

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950/80 via-indigo-950/80 to-purple-950/80 border-b border-emerald-500/30 px-4 py-2 text-xs flex items-center justify-between backdrop-blur-md relative z-40">
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Monitor className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <span className="font-black italic text-emerald-300">XAKCHAT DESKTOP PRO</span>
          <span className="text-gray-300 ml-2 font-medium hidden sm:inline">
            Enjoy zero-latency audio, native tray notifications, and hardware acceleration!
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          size="xs"
          onClick={handleLaunchDesktop}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-7 text-xs px-3 shadow-md"
        >
          <Zap className="w-3.5 h-3.5 mr-1" /> Launch Native App
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={handleDownloadInstaller}
          className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 h-7 text-xs px-3"
        >
          <Download className="w-3.5 h-3.5 mr-1" /> Download Desktop EXE
        </Button>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
