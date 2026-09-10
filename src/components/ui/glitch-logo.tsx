"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface GlitchLogoProps {
  className?: string;
  enableEasterEgg?: boolean;
}

export function GlitchLogo({ className, enableEasterEgg = false }: GlitchLogoProps) {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
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
      <img
        src="/favicon.ico"
        alt="Xakteir"
        className="relative w-20 h-20 rounded-[2rem] object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}
