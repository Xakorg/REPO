"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Environment, Sparkles } from "@react-three/drei";
import { Gamepad2, Users, Trophy, Play, Settings, Menu, X, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

// --- 3D Background Component ---
function BackgroundScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#4ade80" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[2, 1, -2]} rotation={[0.5, 0.5, 0]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#22c55e" wireframe opacity={0.3} transparent />
        </mesh>
      </Float>
      
      <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
        <mesh position={[-2, -1, -3]} rotation={[1, 0.2, 0.5]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#3b82f6" wireframe opacity={0.2} transparent />
        </mesh>
      </Float>

      <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.4} color="#a855f7" />
      <Environment preset="city" />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}

// --- Main UI ---
export default function XakarenaHome() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const gameModes = [
    { id: "br", title: "Battle Royale", desc: "20 Players. Last one standing.", icon: <Trophy className="w-6 h-6" />, color: "from-green-500 to-emerald-700" },
    { id: "horde", title: "Horde", desc: "Defend the base at all costs.", icon: <ShieldAlert className="w-6 h-6" />, color: "from-purple-500 to-indigo-700" },
    { id: "duel", title: "Arena Duels", desc: "1v1 or 2v2 tactical fights.", icon: <Gamepad2 className="w-6 h-6" />, color: "from-blue-500 to-cyan-700" },
    { id: "creator", title: "Creator Hub", desc: "Play community-made games.", icon: <Users className="w-6 h-6" />, color: "from-orange-500 to-red-700" },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-sans selection:bg-green-500/30">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <BackgroundScene />
        {/* Vignette/Gradient overlay so UI is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black pointer-events-none" />
      </div>

      {/* Navigation (Glassmorphism) */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.4)]">
            <span className="font-bold text-xl tracking-tighter">X</span>
          </div>
          <span className="text-2xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Xakarena
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 bg-white/5 backdrop-blur-md px-8 py-3 rounded-full border border-white/10">
          <NavButton active>Play</NavButton>
          <NavButton>Locker</NavButton>
          <NavButton>Social</NavButton>
          <NavButton>Shop</NavButton>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <Settings className="w-5 h-5 text-white/70" />
          </button>
          
          <button 
            className="md:hidden p-2 text-white/70"
            onClick={() => setIsNavOpen(!isNavOpen)}
          >
            {isNavOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 pb-20">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mt-12 mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 mb-6 text-sm font-medium tracking-wide uppercase"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Season 1 is Live
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 drop-shadow-sm">
            Enter the <br/> Arena.
          </h1>
        </motion.div>

        {/* Mode Selector */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-semibold tracking-wide text-white/80 uppercase">Select Mode</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gameModes.map((mode, idx) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                className="relative group"
                onMouseEnter={() => setSelectedMode(mode.id)}
                onMouseLeave={() => setSelectedMode(null)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10`} />
                <div className="relative h-48 rounded-2xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer backdrop-blur-sm transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20 group-hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                      {mode.icon}
                    </div>
                    <h4 className="text-2xl font-bold tracking-tight mb-1">{mode.title}</h4>
                    <p className="text-sm text-white/60 line-clamp-1 group-hover:text-white/90 transition-colors">{mode.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Giant Play Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
          className="mt-16"
        >
          <button className="group relative flex items-center gap-4 bg-white text-black px-12 py-5 rounded-full font-black text-2xl uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />
            <Play className="w-8 h-8 fill-black" />
            MATCHMAKING
          </button>
        </motion.div>

      </main>

      {/* Global CSS for shimmer */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(150%); }
        }
      `}} />
    </div>
  );
}

function NavButton({ children, active }: { children: React.ReactNode, active?: boolean }) {
  return (
    <button className={`relative px-2 py-1 text-sm font-semibold tracking-wide uppercase transition-colors ${active ? 'text-white' : 'text-white/50 hover:text-white'}`}>
      {children}
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-2 left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"
        />
      )}
    </button>
  );
}
