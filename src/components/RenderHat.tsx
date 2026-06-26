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
    case 'golden_sparkles':
      return (
        <div className="absolute -inset-6 pointer-events-none z-40">
           <div className="absolute top-0 left-0 text-yellow-300 text-xs animate-bounce" style={{ animationDelay: '0.1s' }}>✨</div>
           <div className="absolute top-1/2 right-[-10px] text-yellow-400 text-xs animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
           <div className="absolute bottom-[-10px] left-1/4 text-yellow-200 text-xs animate-bounce" style={{ animationDelay: '0.8s' }}>✨</div>
        </div>
      );
    case 'admin_glitch':
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.2rem] z-40 mix-blend-overlay opacity-50">
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMTAiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMGYwIi8+PC9zdmc+')] animate-[matrix_10s_linear_infinite]" />
        </div>
      );
    case 'stickmen':
      return (
        <div className="absolute -inset-10 pointer-events-none z-40 animate-spin-slow">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xl">🏃‍♂️</div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xl rotate-180">⚽</div>
           <div className="absolute top-1/2 right-0 -translate-y-1/2 text-xl rotate-90">🏃</div>
           <div className="absolute top-1/2 left-0 -translate-y-1/2 text-xl -rotate-90">🏀</div>
        </div>
      );
    case 'flying_cat':
      return (
        <div className="absolute -inset-12 pointer-events-none z-50">
           <div className="flying-cat">🐈‍⬛🧹</div>
        </div>
      );
    case 'lightning':
      return (
        <div className="absolute -inset-6 pointer-events-none drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] z-40">
           <svg viewBox="0 0 100 100" className="w-full h-full fill-transparent stroke-yellow-400 stroke-2 animate-pulse">
              <path d="M50 10 L40 50 L60 50 L50 90 L80 40 L60 40 Z" className="animate-[dash_1s_linear_infinite]" />
           </svg>
        </div>
      );
    case 'skull':
      return (
        <div className="absolute -right-6 -bottom-2 w-8 h-8 bg-zinc-200 rounded-full animate-bounce pointer-events-none drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] z-40 flex flex-col items-center justify-center">
           <div className="flex gap-1 mb-1">
             <div className="w-2 h-2 bg-black rounded-full" />
             <div className="w-2 h-2 bg-black rounded-full" />
           </div>
           <div className="w-4 h-1 bg-black rounded-sm" />
        </div>
      );
    case 'bot':
      return (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none drop-shadow-[0_0_15px_rgba(134,239,172,0.8)] z-40 animate-bounce" style={{ animationDuration: '2s' }}>
           <div className="w-full h-full bg-lime-400 rounded-xl border-2 border-lime-200 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="w-6 h-2 bg-black rounded-sm flex items-center justify-around px-1">
               <div className="w-1 h-1 bg-lime-400 rounded-full animate-ping" />
               <div className="w-1 h-1 bg-lime-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
             </div>
             <div className="w-4 h-1 bg-lime-600 mt-1 rounded-full" />
           </div>
        </div>
      );
    case 'golden_crown':
      return (
        <div className="absolute scale-75 origin-bottom -top-10 left-1/2 -translate-x-1/2 w-16 h-12 pointer-events-none drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-bounce z-30 flex items-end justify-center" style={{ transform: 'translateX(-50%)', animationDuration: '2s' }}>
          <svg viewBox="0 0 100 80" className="w-full h-full fill-yellow-300 drop-shadow-2xl">
            <path d="M10,80 L90,80 L100,20 L70,40 L50,5 L30,40 L0,20 Z" />
            <circle cx="50" cy="5" r="5" className="fill-white animate-pulse" />
            <circle cx="20" cy="40" r="4" className="fill-amber-100" />
            <circle cx="80" cy="40" r="4" className="fill-amber-100" />
            <circle cx="50" cy="65" r="4" className="fill-yellow-100" />
          </svg>
          <div className="absolute -top-4 w-full h-full animate-pulse">
            <span className="absolute top-0 left-0 text-[10px] text-yellow-300">✨</span>
            <span className="absolute top-4 right-0 text-[10px] text-yellow-300" style={{ animationDelay: '0.5s' }}>✨</span>
          </div>
        </div>
      );
    case 'admin_crown':
      return (
        <div className="absolute scale-75 origin-bottom -top-10 left-1/2 -translate-x-1/2 w-16 h-12 pointer-events-none drop-shadow-[0_0_20px_rgba(34,197,94,0.9)] global-glitch-active z-30 flex items-end justify-center" style={{ transform: 'translateX(-50%)' }}>
          <svg viewBox="0 0 100 80" className="w-full h-full fill-black border border-green-500 drop-shadow-2xl stroke-green-500 stroke-2">
            <path d="M10,80 L90,80 L100,20 L70,40 L50,10 L30,40 L0,20 Z" />
            <text x="50" y="60" className="fill-green-500 font-mono text-[18px] animate-pulse" textAnchor="middle">01</text>
          </svg>
        </div>
      );
    case 'rainbow_crown':
      return (
        <div className="absolute scale-75 origin-bottom -top-10 left-1/2 -translate-x-1/2 w-16 h-12 pointer-events-none z-30 flex items-end justify-center" style={{ transform: 'translateX(-50%)', animationDuration: '2s' }}>
          <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl animate-hue-rotate">
            <path d="M10,80 L90,80 L100,20 L70,40 L50,10 L30,40 L0,20 Z" className="fill-red-500" style={{ animation: 'hue-cycle 3s infinite linear' }} />
            <circle cx="50" cy="10" r="5" className="fill-white" />
            <circle cx="20" cy="40" r="4" className="fill-white" />
            <circle cx="80" cy="40" r="4" className="fill-white" />
            <circle cx="50" cy="65" r="4" className="fill-white" />
          </svg>
        </div>
      );
    case 'magic_hat':
      return (
        <div className="absolute scale-75 origin-bottom -top-12 left-1/2 -translate-x-1/2 w-16 h-16 pointer-events-none drop-shadow-[0_0_15px_rgba(168,85,247,0.7)] z-30" style={{ transform: 'translateX(-50%)' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            <path d="M50 0 Q60 40 80 80 L20 80 Q40 40 50 0 Z" className="fill-fuchsia-900" />
            <ellipse cx="50" cy="80" rx="45" ry="10" className="fill-fuchsia-950" />
            <path d="M20 70 Q50 60 80 70" className="stroke-fuchsia-400 stroke-4 fill-none" />
            <text x="50" y="50" className="fill-white text-[24px] animate-pulse" textAnchor="middle">✨</text>
          </svg>
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
    case 'golden': return "nameplate-golden";
    case 'hacker': return "nameplate-hacker";
    case 'rainbow': return "nameplate-rainbow";
    case 'sports': return "nameplate-sports";
    case 'magic': return "nameplate-magic";
    default: return defaultClass;
  }
}

export function RenderPet({ petKey }: { petKey?: string }) {
  if (!petKey) return null;
  switch (petKey) {
    case 'cyberwolf':
      return (
        <div 
          className="absolute top-1/2 left-1/2 w-16 h-16 pointer-events-none animate-pet-orbit"
          style={{ margin: '-32px 0 0 -32px' }}
        >
          <div className="w-full h-full animate-pet-bob flex items-center justify-center">
            <svg viewBox="0 0 60 60" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]">
              {/* Body */}
              <path d="M15 45 C15 32, 45 32, 45 45 Z" fill="#0284c7" />
              <path d="M20 45 C20 36, 40 36, 40 45 Z" fill="#0ea5e9" />
              {/* Head */}
              <path d="M22 25 L38 25 L30 40 Z" fill="#0ea5e9" />
              {/* Ears */}
              <path d="M22 25 L16 10 L26 20 Z" fill="#0284c7" />
              <path d="M38 25 L44 10 L34 20 Z" fill="#0284c7" />
              {/* Glowing neon detailing */}
              <path d="M25 22 L22 25 M35 22 L38 25" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              {/* Smiling Eyes */}
              <path d="M23 29 Q25 26 27 29" stroke="#38bdf8" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M33 29 Q35 26 37 29" stroke="#38bdf8" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Snout & Smile */}
              <polygon points="28,33 32,33 30,35" fill="#0f172a" />
              <path d="M28 36 Q30 38 32 36" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Wiggling Tail */}
              <path d="M15 42 C10 40, 5 45, 8 50 C12 50, 15 46, 15 42" fill="#0284c7" className="animate-tail-wiggle" />
            </svg>
          </div>
        </div>
      );
    case 'minidragon':
      return (
        <div 
          className="absolute top-1/2 left-1/2 w-16 h-16 pointer-events-none animate-pet-orbit"
          style={{ margin: '-32px 0 0 -32px' }}
        >
          <div className="w-full h-full animate-pet-float flex items-center justify-center">
            <svg viewBox="0 0 60 60" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]">
              {/* Wings with flapping animation */}
              <path d="M14 26 Q4 16 16 32 Z" fill="#ea580c" className="animate-pulse origin-right" />
              <path d="M46 26 Q56 16 44 32 Z" fill="#ea580c" className="animate-pulse origin-left" />
              {/* Body */}
              <circle cx="30" cy="38" r="14" fill="#dc2626" />
              <circle cx="30" cy="40" r="9" fill="#f97316" />
              {/* Head */}
              <circle cx="30" cy="22" r="11" fill="#dc2626" />
              {/* Horns */}
              <path d="M25 12 L19 5 L26 10 Z" fill="#ea580c" />
              <path d="M35 12 L41 5 L34 10 Z" fill="#ea580c" />
              {/* Smiling Happy Eyes */}
              <path d="M23 20 Q25 17 27 20" stroke="#fef08a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M33 20 Q35 17 37 20" stroke="#fef08a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Cheek Blush */}
              <circle cx="21" cy="23" r="2" fill="#f43f5e" opacity="0.8" />
              <circle cx="39" cy="23" r="2" fill="#f43f5e" opacity="0.8" />
              {/* Cute Smile */}
              <path d="M27 24 Q30 27 33 24" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Flame Breath */}
              <path d="M30 25 L32 28 L28 28 Z" fill="#f97316" className="animate-ping" style={{ animationDuration: '0.8s' }} />
            </svg>
          </div>
        </div>
      );
    case 'voidentity':
      return (
        <div 
          className="absolute top-1/2 left-1/2 w-16 h-16 pointer-events-none animate-pet-orbit"
          style={{ margin: '-32px 0 0 -32px' }}
        >
          <div className="w-full h-full animate-pet-float flex items-center justify-center">
            <svg viewBox="0 0 60 60" className="w-14 h-14 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
              {/* Outer void glow */}
              <circle cx="30" cy="30" r="24" fill="#7e22ce" opacity="0.25" className="animate-pulse" />
              {/* Shifting body */}
              <path d="M30 14 C39 14, 46 21, 46 30 C46 39, 39 46, 30 46 C21 46, 14 39, 14 30 C14 21, 21 14, 30 14 Z" fill="url(#void-gradient-logo)" className="animate-pulse" />
              {/* Smiling Eyes */}
              <path d="M22 25 Q24 22 26 25" stroke="#e9d5ff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M34 25 Q36 22 38 25" stroke="#e9d5ff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M28 29 Q30 32 32 29" stroke="#e9d5ff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <defs>
                <radialGradient id="void-gradient-logo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="70%" stopColor="#581c87" />
                  <stop offset="100%" stopColor="#120024" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      );
    case 'uni_kitty':
      return (
        <div 
          className="absolute top-1/2 left-1/2 w-16 h-16 pointer-events-none animate-pet-orbit"
          style={{ margin: '-32px 0 0 -32px' }}
        >
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex h-2 w-16 opacity-70">
              <div className="h-full w-1/6 bg-red-500 rounded-l-full"></div>
              <div className="h-full w-1/6 bg-orange-500"></div>
              <div className="h-full w-1/6 bg-yellow-500"></div>
              <div className="h-full w-1/6 bg-green-500"></div>
              <div className="h-full w-1/6 bg-blue-500"></div>
              <div className="h-full w-1/6 bg-purple-500"></div>
            </div>
            <div className="text-2xl animate-bounce z-10 relative">🦄</div>
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
    case 'golden':
      return (
        <div className={cn("absolute inset-0 bg-gradient-to-br from-yellow-700 via-yellow-500 to-yellow-900 pointer-events-none overflow-hidden", className)}>
           <div className="absolute inset-0 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9InRyYW5zcGFyZW50Ii8+PGNpcmNsZSBjeD0iNCIgY3k9IjQiIHI9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')] animate-pulse" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      );
    case 'hacker':
      return (
        <div className={cn("absolute inset-0 bg-black overflow-hidden pointer-events-none", className)}>
           <div className="absolute inset-0 opacity-40 bg-[linear-gradient(180deg,transparent,rgba(34,197,94,0.8),transparent)] bg-[length:100%_200%] animate-[matrix_2s_linear_infinite]" />
           <div className="w-full h-full opacity-30 text-green-500 font-mono text-[10px] tracking-[0.2em] whitespace-pre-wrap break-all leading-none">
              {"01 10 00 11 01 01 10 01 00 10 11 01 10 01 00 ".repeat(30)}
           </div>
        </div>
      );
    case 'rainbow':
      return (
        <div className={cn("absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 pointer-events-none overflow-hidden", className)} style={{ backgroundSize: '400% 400%', animation: 'hue-cycle 10s linear infinite' }}>
           <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
        </div>
      );
    case 'sports':
      return (
        <div className={cn("absolute inset-0 bg-green-700 pointer-events-none overflow-hidden", className)}>
           {/* Stadium lines */}
           <div className="absolute bottom-0 w-full h-full bg-[linear-gradient(transparent_95%,rgba(255,255,255,0.4)_95%)] bg-[size:100%_20px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />
           <div className="absolute top-0 w-full h-full bg-[linear-gradient(90deg,transparent_95%,rgba(255,255,255,0.4)_95%)] bg-[size:40px_100%] [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      );
    case 'magic':
      return (
        <div className={cn("absolute inset-0 bg-gradient-to-br from-fuchsia-950 via-purple-900 to-indigo-950 pointer-events-none overflow-hidden", className)}>
           <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9InRyYW5zcGFyZW50Ii8+PGNpcmNsZSBjeD0iNCIgY3k9IjQiIHI9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')] animate-pulse" style={{ animationDuration: '3s' }} />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl opacity-10 animate-spin-slow text-fuchsia-300">✨</div>
        </div>
      );
    default:
      return null;
  }
}
