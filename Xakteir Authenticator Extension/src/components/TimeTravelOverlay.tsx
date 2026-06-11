"use client";

import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const TIME_DATA = [
  { year: 1989, fact: "The World Wide Web was invented." },
  { year: 1969, fact: "The first humans landed on the Moon." },
  { year: 2004, fact: "A major social network was launched." },
  { year: 2042, fact: "Xakteir Hub completes its global build." },
  { year: 1991, fact: "The first website went live." },
  { year: 1975, fact: "A major computer software company was founded." },
  { year: 2007, fact: "The first modern smartphone was released." },
  { year: 1945, fact: "The first electronic computer was completed." },
];

export function TimeTravelOverlay() {
  const [activeData, setActiveData] = useState<{ year: number, fact: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const triggerTimeTravel = () => {
      const data = TIME_DATA[Math.floor(Math.random() * TIME_DATA.length)];
      setActiveData(data);
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 6000);
    };

    const handleEvent = () => triggerTimeTravel();
    window.addEventListener('trigger-time-travel', handleEvent);

    // Random trigger every few minutes
    const timer = setInterval(() => {
      if (Math.random() > 0.8) triggerTimeTravel();
    }, 180000);

    return () => {
      window.removeEventListener('trigger-time-travel', handleEvent);
      clearInterval(timer);
    };
  }, []);

  if (!activeData || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center pointer-events-none animate-in fade-in duration-1000">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="absolute inset-0 arcade-grid opacity-20" />
      
      <div className="relative z-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center mx-auto animate-pulse">
          <Clock className="w-12 h-12 text-primary" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-[10rem] md:text-[14rem] font-black italic text-white leading-none tracking-tighter drop-shadow-[0_0_80px_rgba(255,255,255,0.4)]">
            {activeData.year}
          </h2>
          <p className="text-xl md:text-3xl font-bold uppercase tracking-[0.4em] text-primary/80 italic max-w-2xl mx-auto px-10">
            {activeData.fact}
          </p>
        </div>
        
        <div className="pt-10 flex flex-col items-center gap-2 opacity-30">
           <Zap className="w-6 h-6 text-white animate-bounce" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white">Time Sync Active</p>
        </div>
      </div>
    </div>
  );
}
