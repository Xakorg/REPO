"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Timer } from "lucide-react";

export function ClickSpeedGame({ onExit }: { onExit: () => void }) {
  const [clicks, setClicks] = useState(0);
  const [time, setTime] = useState(10);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active && time > 0) {
      const t = setInterval(() => setTime(s => s - 1), 1000);
      return () => clearInterval(t);
    } else if (time === 0) {
      setActive(false);
    }
  }, [active, time]);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-emerald-400/30 bg-background/90 max-w-md w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Zap_Clicks</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="text-center space-y-4">
        <div className="text-6xl font-black">{time}s</div>
        <Button 
          onClick={() => { if(time === 10) setActive(true); if(time > 0) setClicks(c => c + 1); }} 
          className="w-48 h-48 rounded-full bg-emerald-500 font-black text-4xl shadow-2xl border-8 border-white/20 active:scale-95"
        >
          {clicks}
        </Button>
        {time === 0 && <p className="font-black text-xl">CPS: {clicks/10}</p>}
      </div>
    </div>
  );
}
