"use client";

import React from "react";

export function RenderHat({ hatKey }: { hatKey?: string }) {
  if (!hatKey) return null;
  switch (hatKey) {
    case 'tophat':
      return (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-[2.5em] pointer-events-none drop-shadow-md select-none z-30"
          style={{ transform: 'translateX(-50%)' }}
        >
          🎩
        </div>
      );
    case 'crown':
      return (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-[2.5em] pointer-events-none drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-bounce select-none z-30"
          style={{ transform: 'translateX(-50%)', animationDuration: '2s' }}
        >
          👑
        </div>
      );
    case 'wizard':
      return (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-[2.5em] pointer-events-none drop-shadow-[0_0_8px_rgba(147,51,234,0.6)] select-none z-30"
          style={{ transform: 'translateX(-50%)' }}
        >
          🧙
        </div>
      );
    case 'party':
      return (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-[2.5em] pointer-events-none select-none z-30"
          style={{ transform: 'translateX(-50%)' }}
        >
          🥳
        </div>
      );
    case 'cowboy':
      return (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-[2.5em] pointer-events-none select-none z-30"
          style={{ transform: 'translateX(-50%)' }}
        >
          🤠
        </div>
      );
    case 'cap':
      return (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-[2.5em] pointer-events-none select-none z-30"
          style={{ transform: 'translateX(-50%)' }}
        >
          🧢
        </div>
      );
    case 'chef':
      return (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-[2.5em] pointer-events-none select-none z-30"
          style={{ transform: 'translateX(-50%)' }}
        >
          👩‍🍳
        </div>
      );
    case 'halo':
      return (
        <div 
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-3.5 border-[3px] border-yellow-300 rounded-full shadow-[0_0_15px_rgba(253,224,71,0.9)] animate-float opacity-80 pointer-events-none select-none z-30"
          style={{ transform: 'translateX(-50%)', animationDuration: '3s' }}
        />
      );
    case 'horns':
      return (
        <div 
          className="absolute -top-3 left-0 right-0 h-4 flex justify-between px-2 pointer-events-none select-none z-30"
        >
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-rose-600 rotate-[-20deg] drop-shadow-[0_0_5px_rgba(225,29,72,0.8)]" />
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-rose-600 rotate-[20deg] drop-shadow-[0_0_5px_rgba(225,29,72,0.8)]" />
        </div>
      );
    case 'viking':
      return (
        <div 
          className="absolute -top-3 left-0 right-0 h-4 flex justify-between px-1 pointer-events-none select-none z-30"
        >
          <div className="w-3.5 h-6 border-l-[3px] border-t-[3px] border-zinc-300 rounded-tl-full rotate-[-40deg] drop-shadow-md" />
          <div className="w-3.5 h-6 border-r-[3px] border-t-[3px] border-zinc-300 rounded-tr-full rotate-[40deg] drop-shadow-md" />
        </div>
      );
    default:
      return null;
  }
}
