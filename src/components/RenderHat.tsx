"use client";

import React from "react";

export function RenderHat({ hatKey }: { hatKey?: string }) {
  if (!hatKey) return null;
  switch (hatKey) {
    case 'tophat':
      return (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-14 pointer-events-none drop-shadow-2xl z-30 flex flex-col items-center justify-end" style={{ transform: 'translateX(-50%)' }}>
          <div className="w-12 h-10 bg-gradient-to-b from-zinc-800 to-black rounded-t-lg relative">
             <div className="absolute bottom-0 w-full h-2 bg-red-700" />
          </div>
          <div className="w-20 h-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-full" />
        </div>
      );
    case 'crown':
      return (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-12 pointer-events-none drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce z-30 flex items-end justify-center" style={{ transform: 'translateX(-50%)', animationDuration: '2s' }}>
          <svg viewBox="0 0 100 80" className="w-full h-full fill-amber-400 drop-shadow-xl">
            <path d="M10,80 L90,80 L100,20 L70,40 L50,10 L30,40 L0,20 Z" />
            <circle cx="50" cy="10" r="5" className="fill-red-500" />
            <circle cx="20" cy="40" r="4" className="fill-blue-500" />
            <circle cx="80" cy="40" r="4" className="fill-emerald-500" />
            <circle cx="50" cy="65" r="4" className="fill-purple-500" />
          </svg>
        </div>
      );
    case 'wizard':
      return (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 pointer-events-none drop-shadow-[0_0_10px_rgba(147,51,234,0.5)] z-30" style={{ transform: 'translateX(-50%)' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            <path d="M50 0 Q60 40 80 80 L20 80 Q40 40 50 0 Z" className="fill-purple-700" />
            <ellipse cx="50" cy="80" rx="45" ry="10" className="fill-purple-900" />
            <path d="M50 0 Q60 40 80 80 L20 80 Q40 40 50 0 Z" fill="url(#starPattern)" className="opacity-50" />
            <defs>
              <pattern id="starPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="white" />
                <circle cx="2" cy="15" r="1" fill="yellow" />
                <circle cx="18" cy="5" r="1" fill="white" />
              </pattern>
            </defs>
          </svg>
        </div>
      );
    case 'party':
      return (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-12 h-14 pointer-events-none drop-shadow-xl z-30 flex flex-col items-center" style={{ transform: 'translateX(-50%)' }}>
          <div className="w-4 h-4 bg-red-500 rounded-full z-10 -mb-2" />
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <path d="M50 10 L90 90 Q50 100 10 90 Z" className="fill-cyan-400" />
            <path d="M30 50 L70 50 L80 70 L20 70 Z" className="fill-pink-500" />
          </svg>
        </div>
      );
    case 'cowboy':
      return (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-12 pointer-events-none drop-shadow-xl z-30" style={{ transform: 'translateX(-50%)' }}>
          <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg">
            <path d="M30 30 Q50 -10 70 30 Z" className="fill-amber-800" />
            <path d="M0 45 Q50 60 100 45 Q80 30 50 35 Q20 30 0 45 Z" className="fill-amber-700" />
            <rect x="33" y="27" width="34" height="4" className="fill-amber-950" />
          </svg>
        </div>
      );
    case 'cap':
      return (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-16 h-10 pointer-events-none drop-shadow-lg z-30" style={{ transform: 'translateX(-50%)' }}>
           <svg viewBox="0 0 100 60" className="w-full h-full">
            <path d="M20 50 Q20 10 80 10 Q80 50 20 50 Z" className="fill-blue-600" />
            <path d="M10 50 Q50 50 80 50 L80 55 Q50 65 10 55 Z" className="fill-blue-700" />
            <circle cx="50" cy="15" r="3" className="fill-blue-400" />
          </svg>
        </div>
      );
    case 'chef':
      return (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 pointer-events-none drop-shadow-xl z-30" style={{ transform: 'translateX(-50%)' }}>
           <svg viewBox="0 0 100 100" className="w-full h-full">
             <path d="M20 50 Q0 20 30 10 Q50 -10 70 10 Q100 20 80 50 L80 80 L20 80 Z" className="fill-white" />
             <rect x="18" y="75" width="64" height="15" className="fill-gray-100" />
             <path d="M30 20 Q50 0 70 20" stroke="#f3f4f6" strokeWidth="2" fill="none" />
           </svg>
        </div>
      );
    case 'halo':
      return (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-4 border-4 border-yellow-300 rounded-full shadow-[0_0_20px_rgba(253,224,71,1),inset_0_0_10px_rgba(253,224,71,0.8)] animate-pulse opacity-90 pointer-events-none select-none z-30"
          style={{ transform: 'translateX(-50%)', animationDuration: '3s' }}
        />
      );
    case 'horns':
      return (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-20 h-10 pointer-events-none drop-shadow-[0_0_8px_rgba(225,29,72,0.8)] z-30" style={{ transform: 'translateX(-50%)' }}>
          <svg viewBox="0 0 100 50" className="w-full h-full">
             <path d="M20 50 Q10 20 30 0 Q25 25 35 45 Z" className="fill-red-600" />
             <path d="M80 50 Q90 20 70 0 Q75 25 65 45 Z" className="fill-red-600" />
          </svg>
        </div>
      );
    case 'viking':
      return (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-14 pointer-events-none drop-shadow-xl z-30" style={{ transform: 'translateX(-50%)' }}>
           <svg viewBox="0 0 100 80" className="w-full h-full">
             <path d="M25 60 Q50 30 75 60 L70 70 L30 70 Z" className="fill-zinc-400" />
             <path d="M25 60 Q10 30 5 0 Q20 30 35 50 Z" className="fill-amber-100" />
             <path d="M75 60 Q90 30 95 0 Q80 30 65 50 Z" className="fill-amber-100" />
             <rect x="25" y="60" width="50" height="8" className="fill-zinc-600" />
           </svg>
        </div>
      );
    default:
      return null;
  }
}
