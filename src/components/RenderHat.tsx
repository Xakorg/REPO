"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function RenderHat({ hatKey }: { hatKey?: string }) {
  if (!hatKey) return null;
  switch (hatKey) {
    case 'tophat':
      return (
        <div className="absolute scale-75 origin-bottom -top-10 left-1/2 -translate-x-1/2 w-16 h-14 pointer-events-none drop-shadow-2xl z-30 flex flex-col items-center justify-end" style={{ transform: 'translateX(-50%)' }}>
          <div className="w-12 h-10 bg-gradient-to-b from-zinc-800 to-black rounded-t-lg relative">
             <div className="absolute bottom-0 w-full h-2 bg-red-700" />
          </div>
          <div className="w-20 h-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-full" />
        </div>
      );
    case 'crown':
      return (
        <div className="absolute scale-75 origin-bottom -top-10 left-1/2 -translate-x-1/2 w-16 h-12 pointer-events-none drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce z-30 flex items-end justify-center" style={{ transform: 'translateX(-50%)', animationDuration: '2s' }}>
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
        <div className="absolute scale-75 origin-bottom -top-12 left-1/2 -translate-x-1/2 w-16 h-16 pointer-events-none drop-shadow-[0_0_10px_rgba(147,51,234,0.5)] z-30" style={{ transform: 'translateX(-50%)' }}>
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
        <div className="absolute scale-75 origin-bottom -top-10 left-1/2 -translate-x-1/2 w-12 h-14 pointer-events-none drop-shadow-xl z-30 flex flex-col items-center" style={{ transform: 'translateX(-50%)' }}>
          <div className="w-4 h-4 bg-red-500 rounded-full z-10 -mb-2" />
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <path d="M50 10 L90 90 Q50 100 10 90 Z" className="fill-cyan-400" />
            <path d="M30 50 L70 50 L80 70 L20 70 Z" className="fill-pink-500" />
          </svg>
        </div>
      );
    case 'cowboy':
      return (
        <div className="absolute scale-75 origin-bottom -top-8 left-1/2 -translate-x-1/2 w-20 h-12 pointer-events-none drop-shadow-xl z-30" style={{ transform: 'translateX(-50%)' }}>
          <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg">
            <path d="M30 30 Q50 -10 70 30 Z" className="fill-amber-800" />
            <path d="M0 45 Q50 60 100 45 Q80 30 50 35 Q20 30 0 45 Z" className="fill-amber-700" />
            <rect x="33" y="27" width="34" height="4" className="fill-amber-950" />
          </svg>
        </div>
      );
    case 'cap':
      return (
        <div className="absolute scale-75 origin-bottom -top-7 left-1/2 -translate-x-1/2 w-16 h-10 pointer-events-none drop-shadow-lg z-30" style={{ transform: 'translateX(-50%)' }}>
           <svg viewBox="0 0 100 60" className="w-full h-full">
            <path d="M20 50 Q20 10 80 10 Q80 50 20 50 Z" className="fill-blue-600" />
            <path d="M10 50 Q50 50 80 50 L80 55 Q50 65 10 55 Z" className="fill-blue-700" />
            <circle cx="50" cy="15" r="3" className="fill-blue-400" />
          </svg>
        </div>
      );
    case 'chef':
      return (
        <div className="absolute scale-75 origin-bottom -top-12 left-1/2 -translate-x-1/2 w-16 h-16 pointer-events-none drop-shadow-xl z-30" style={{ transform: 'translateX(-50%)' }}>
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
          className="absolute scale-75 origin-bottom -top-6 left-1/2 -translate-x-1/2 w-16 h-4 border-4 border-yellow-300 rounded-full shadow-[0_0_20px_rgba(253,224,71,1),inset_0_0_10px_rgba(253,224,71,0.8)] animate-pulse opacity-90 pointer-events-none select-none z-30"
          style={{ transform: 'translateX(-50%)', animationDuration: '3s' }}
        />
      );
    case 'horns':
      return (
        <div className="absolute scale-75 origin-bottom -top-5 left-1/2 -translate-x-1/2 w-20 h-10 pointer-events-none drop-shadow-[0_0_8px_rgba(225,29,72,0.8)] z-30" style={{ transform: 'translateX(-50%)' }}>
          <svg viewBox="0 0 100 50" className="w-full h-full">
             <path d="M20 50 Q10 20 30 0 Q25 25 35 45 Z" className="fill-red-600" />
             <path d="M80 50 Q90 20 70 0 Q75 25 65 45 Z" className="fill-red-600" />
          </svg>
        </div>
      );
    case 'viking':
      return (
        <div className="absolute scale-75 origin-bottom -top-8 left-1/2 -translate-x-1/2 w-20 h-14 pointer-events-none drop-shadow-xl z-30" style={{ transform: 'translateX(-50%)' }}>
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

export function RenderAura({ auraKey }: { auraKey?: string }) {
  if (!auraKey) return null;
  switch (auraKey) {
    case 'neon':
      return <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse pointer-events-none" />;
    case 'gold':
      return <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.8)] animate-pulse pointer-events-none border-2 border-amber-400/50" />;
    case 'glitch':
      return <div className="absolute inset-0 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.7)] animate-bounce pointer-events-none mix-blend-color-dodge" />;
    default:
      return null;
  }
}

export function RenderDecor({ decorKey }: { decorKey?: string }) {
  if (!decorKey) return null;
  switch (decorKey) {
    case 'stars':
      return (
        <div className="absolute -inset-4 pointer-events-none animate-spin-slow">
           <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_5px_rgba(250,204,21,1)]" />
           <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_0_5px_rgba(250,204,21,1)]" />
        </div>
      );
    case 'sakura':
      return (
        <div className="absolute -inset-6 pointer-events-none animate-spin-slow opacity-80">
           <div className="absolute top-2 left-2 w-3 h-3 bg-pink-400 rounded-full blur-[1px]" />
           <div className="absolute bottom-2 right-4 w-2 h-2 bg-pink-300 rounded-full blur-[1px]" />
           <div className="absolute top-8 -right-2 w-2.5 h-2.5 bg-pink-500 rounded-full blur-[1px]" />
        </div>
      );
    case 'ghost':
      return (
        <div className="absolute -right-4 -top-4 w-6 h-6 bg-white/50 rounded-full animate-bounce pointer-events-none blur-[2px] shadow-[0_0_10px_white]">
           <div className="absolute top-2 left-1 w-1 h-1 bg-black rounded-full" />
           <div className="absolute top-2 right-1 w-1 h-1 bg-black rounded-full" />
        </div>
      );
    case 'cat':
      return (
        <div className="absolute -inset-8 pointer-events-none animate-spin-slow">
           <div className="absolute top-0 left-1/2 w-6 h-6 bg-rose-500 rounded-full border border-white/20 flex items-center justify-center -translate-x-1/2">
             <span className="text-[10px]">🐱</span>
           </div>
        </div>
      );
    default:
      return null;
  }
}

export function getNameplateClass(nameplateKey?: string, defaultClass: string = "text-white") {
  if (!nameplateKey) return defaultClass;
  switch (nameplateKey) {
    case 'gold': return "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)] font-black";
    case 'blue': return "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] font-black";
    case 'pro': return "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-black drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]";
    default: return defaultClass;
  }
}

export function RenderPet({ petKey }: { petKey?: string }) {
  if (!petKey) return null;
  switch (petKey) {
    case 'cyberwolf':
      return (
        <div className="absolute -right-8 bottom-0 w-12 h-12 pointer-events-none drop-shadow-[0_0_10px_rgba(56,189,248,0.5)] z-40">
           <svg viewBox="0 0 50 50" className="w-full h-full fill-sky-500 animate-pulse">
              <path d="M10 40 L20 20 L30 25 L40 10 L45 30 L35 50 Z" />
              <circle cx="35" cy="20" r="2" className="fill-white" />
           </svg>
        </div>
      );
    case 'minidragon':
      return (
        <div className="absolute -left-6 top-4 w-10 h-10 pointer-events-none drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] z-40 animate-bounce" style={{ animationDuration: '3s' }}>
           <svg viewBox="0 0 50 50" className="w-full h-full fill-red-500">
              <path d="M25 0 Q40 10 50 25 Q35 40 25 50 Q10 35 0 25 Q10 10 25 0 Z" />
              <path d="M0 25 L10 15 L20 30 Z" className="fill-orange-400" />
              <path d="M50 25 L40 15 L30 30 Z" className="fill-orange-400" />
           </svg>
        </div>
      );
    case 'voidentity':
      return (
        <div className="absolute -right-6 top-0 w-14 h-14 pointer-events-none drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] z-40 mix-blend-color-dodge">
           <div className="w-full h-full bg-purple-600 rounded-full animate-ping opacity-50 blur-sm" />
           <div className="absolute inset-2 bg-black rounded-full shadow-inner flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
           </div>
        </div>
      );
    default:
      return null;
  }
}

export function RenderBanner({ bannerKey, className }: { bannerKey?: string, className?: string }) {
  if (!bannerKey) return null;
  switch (bannerKey) {
    case 'matrix':
      return (
        <div className={cn("absolute inset-0 bg-black overflow-hidden pointer-events-none", className)}>
           <div className="absolute inset-0 opacity-30 bg-[linear-gradient(180deg,transparent,rgba(34,197,94,0.5),transparent)] bg-[length:100%_200%] animate-[matrix_5s_linear_infinite]" />
           <div className="w-full h-full opacity-20 text-green-500 font-mono text-[8px] tracking-[0.5em] whitespace-pre-wrap break-all leading-tight">
              {"1010100101100111010100110101010100101010101010010111001010101001110100101010".repeat(20)}
           </div>
        </div>
      );
    case 'retrowave':
      return (
        <div className={cn("absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 pointer-events-none overflow-hidden", className)}>
           <div className="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(rgba(236,72,153,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.3)_1px,transparent_1px)] bg-[size:20px_10px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />
           <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-b from-yellow-400 to-pink-500 shadow-[0_0_50px_rgba(236,72,153,0.5)] blur-[2px]" />
        </div>
      );
    case 'galactic':
      return (
        <div className={cn("absolute inset-0 bg-slate-950 pointer-events-none overflow-hidden", className)}>
           <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.2),transparent_70%)]" />
           <div className="absolute inset-0 opacity-30">
             {Array.from({length: 20}).map((_,i) => (
                <div key={i} className="absolute bg-white rounded-full animate-pulse" style={{
                  width: Math.random() * 3 + 'px',
                  height: Math.random() * 3 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animationDelay: Math.random() * 2 + 's'
                }} />
             ))}
           </div>
        </div>
      );
    default:
      return null;
  }
}
