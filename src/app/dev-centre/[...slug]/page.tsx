"use client";

import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Sparkles } from "lucide-react";

export default function GenericDevCentrePage() {
  const pathname = usePathname();
  
  // Format the path nicely (e.g. /dev-centre/realtime -> Realtime Sync)
  const pathParts = pathname.split("/").filter(Boolean);
  const featureSlug = pathParts[pathParts.length - 1] || "Feature";
  const featureName = featureSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="space-y-12 pb-32 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-700">
      <div className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900/50 border-4 border-white/5 flex items-center justify-center shadow-2xl relative z-10 mx-auto mb-8">
          <Construction className="w-16 h-16 text-zinc-500" />
        </div>
      </div>

      <div className="text-center space-y-6 max-w-2xl relative z-10">
        <Badge className="bg-teal-500/10 border-teal-500/20 text-teal-400 font-black uppercase tracking-widest px-6 py-2 text-[10px]">
          Xakteir Dev Ecosystem
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg">
          Xakteir Dev <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">{featureName}</span>
        </h1>
        
        <p className="text-zinc-400 text-lg font-medium leading-relaxed">
          The ultimate backend architecture for <strong className="text-white">Xakteir Dev {featureName}</strong> is currently under massive construction. We are building the most premium, powerful infrastructure the world has ever seen.
        </p>

        <div className="pt-8 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Coming Soon in Project Alpha</span>
        </div>
      </div>
    </div>
  );
}
