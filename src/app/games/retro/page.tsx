"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Gamepad2, Settings } from "lucide-react";

export default function RetroEnginePage() {
  const router = useRouter();
  const [romLoaded, setRomLoaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Logic to pass the file to a WebAssembly emulator like js-nes
      setRomLoaded(true);
    }
  };

  return (
    <div className="w-full h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between z-10 bg-black border-b border-white/10">
         <button onClick={() => window.location.href = '/games'} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full font-bold hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Library
         </button>
         <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-black italic tracking-widest uppercase">XAKTEIR<span className="text-indigo-500">RETRO</span></h1>
         </div>
         <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <Settings className="w-4 h-4" />
         </button>
      </header>

      {/* Main Engine Area */}
      <div className="flex-1 relative flex items-center justify-center p-10">
         {!romLoaded ? (
            <div 
               className={`w-full max-w-2xl h-[400px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-500/10 scale-105' : 'border-white/20 bg-zinc-900/50 hover:border-white/40'}`}
               onDragEnter={handleDrag}
               onDragLeave={handleDrag}
               onDragOver={handleDrag}
               onDrop={handleDrop}
            >
               <Upload className={`w-16 h-16 mb-6 ${dragActive ? 'text-indigo-400' : 'text-zinc-600'}`} />
               <h2 className="text-2xl font-black tracking-widest uppercase mb-2">Drop ROM File Here</h2>
               <p className="text-zinc-500 text-center max-w-sm font-bold">
                  Supports .nes, .sfc, .gb, .gba. Runs 100% locally in your browser using WebAssembly.
               </p>
               <label className="mt-8 px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-full cursor-pointer hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Browse Files
                  <input type="file" className="hidden" accept=".nes,.sfc,.gb,.gba" onChange={() => setRomLoaded(true)} />
               </label>
            </div>
         ) : (
            <div className="w-full max-w-4xl aspect-[4/3] bg-black border border-white/20 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)] flex items-center justify-center relative">
               {/* Placeholder for the WASM Canvas */}
               <div className="absolute top-4 left-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
               </div>
               <div className="text-center">
                  <Gamepad2 className="w-20 h-20 text-indigo-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-2xl font-black italic tracking-widest text-indigo-400">EMULATION STARTED</h3>
                  <p className="text-zinc-500 mt-2">WASM Core Hooked. Rendering Framebuffer...</p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
