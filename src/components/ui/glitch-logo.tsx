"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface GlitchLogoProps {
  className?: string;
  enableEasterEgg?: boolean;
}

export function GlitchLogo({ className, enableEasterEgg = false }: GlitchLogoProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 150);

    if (!enableEasterEgg) return;

    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    
    if (nextCount > 5) {
      document.body.classList.add('global-glitch-active');
      setTimeout(() => document.body.classList.remove('global-glitch-active'), 100);
    }

    if (nextCount >= 10) {
      setClickCount(0);
      
      const weightedOutcomes = [
        { id: 'timetravel', weight: 30 },  
        { id: 'shake', weight: 20 },      
        { id: 'glitch', weight: 30 },     
        { id: 'rainbow', weight: 20 },     
      ];

      const totalWeight = weightedOutcomes.reduce((acc, obj) => acc + obj.weight, 0);
      let random = Math.floor(Math.random() * totalWeight);
      let choice = 'glitch';

      for (const outcome of weightedOutcomes) {
        if (random < outcome.weight) {
          choice = outcome.id;
          break;
        }
        random -= outcome.weight;
      }
      
      if (typeof document !== 'undefined') {
        if (choice === 'timetravel') {
          window.dispatchEvent(new CustomEvent('trigger-time-travel'));
        } else {
          const effectClass = 
            choice === 'shake' ? 'shake-active' :
            choice === 'glitch' ? 'global-glitch-active' :
            `${choice}-active`;
          
          document.body.classList.add(effectClass);
          
          let duration = 2000;
          if (choice === 'rainbow') duration = 4000;
            
          setTimeout(() => {
            document.body.classList.remove(effectClass);
          }, duration);
        }
      }
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn("relative flex items-center justify-center group cursor-pointer", className)}
    >
      <div className="absolute inset-0 bg-primary/60 rounded-[2.5rem] blur-[80px] animate-pulse opacity-40" />
      
      <div className={cn(
        "relative w-20 h-20 bg-black rounded-[2rem] flex items-center justify-center border-[5px] border-white shadow-[0_0_60px_rgba(var(--primary),0.6)] overflow-hidden transition-all duration-500 group-hover:scale-105",
        isGlitching && "animate-glitch shadow-[0_0_100px_rgba(255,255,255,0.8)]"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-accent opacity-50 animate-pulse" />
        <div className="absolute inset-0 arcade-grid opacity-20" />
        
        <svg 
          viewBox="0 0 100 100" 
          className={cn(
            "w-12 h-12 text-white transition-all",
            isGlitching && "animate-glitch"
          )}
          style={{
            filter: isGlitching 
              ? "drop-shadow(10px 0 #ff00c1) drop-shadow(-10px 0 #00fff9)" 
              : "drop-shadow(0 0 20px rgba(255,255,255,0.4))"
          }}
        >
          <path 
            d="M25 25 C 35 25, 65 75, 75 75 M 75 25 C 65 25, 35 75, 25 75" 
            stroke="currentColor" 
            strokeWidth="16" 
            strokeLinecap="round" 
            fill="none" 
          />
        </svg>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      <div className="absolute -inset-10 border-[6px] border-primary/10 rounded-[3.5rem] animate-spin duration-[18s] opacity-20" />
      <div className="absolute -inset-8 border-[3px] border-white/5 rounded-full animate-spin duration-[30s] reverse opacity-10" />
    </div>
  );
}
