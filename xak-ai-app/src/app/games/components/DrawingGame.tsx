"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Palette } from "lucide-react";

export function DrawingGame({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-pink-500/30 bg-background/90 max-w-2xl w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Sketch_Logic</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="w-full aspect-video bg-white rounded-3xl border-8 border-pink-900 cursor-crosshair flex items-center justify-center">
        <p className="text-black font-black uppercase text-xl">Canvas Ready for Input</p>
      </div>
    </div>
  );
}
