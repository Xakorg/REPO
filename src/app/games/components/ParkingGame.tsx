"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Car } from "lucide-react";

export function ParkingGame({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-amber-600/30 bg-background/90 max-w-lg w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Car_Park</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="w-full h-64 bg-zinc-900 rounded-3xl relative p-8">
        <div className="w-20 h-32 border-4 border-dashed border-white/20 rounded-xl flex items-center justify-center">ZONE_A</div>
        <Car className="w-16 h-10 text-amber-500 absolute bottom-10 left-10" />
      </div>
      <p className="text-sm font-bold uppercase opacity-60">Park the car without a scratch!</p>
    </div>
  );
}
