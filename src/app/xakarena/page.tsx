"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Environment, Sparkles, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { Settings, Menu, X, Play } from "lucide-react";

// --- 3D Vibrant Background Component ---
function VibrantScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ff00aa" />
      <directionalLight position={[-10, -10, -5]} intensity={2} color="#00ffcc" />
      <pointLight position={[0, 0, 2]} intensity={1} color="#ffeb3b" />
      
      {/* Central glowing distorted sphere */}
      <Float speed={2} rotationIntensity={2} floatIntensity={1.5}>
        <Sphere args={[2, 64, 64]} position={[0, 0, -2]}>
          <MeshDistortMaterial 
            color="#ff0055" 
            emissive="#ff00aa"
            emissiveIntensity={0.5}
            distort={0.4} 
            speed={2} 
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </Float>
      
      {/* Secondary floating orbs */}
      <Float speed={1.5} rotationIntensity={1} floatIntensity={3}>
        <Sphere args={[0.8, 32, 32]} position={[-3, 2, -4]}>
          <MeshDistortMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.6} distort={0.2} speed={3} />
        </Sphere>
      </Float>

      <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
        <Sphere args={[1.2, 32, 32]} position={[3, -1.5, -3]}>
          <MeshDistortMaterial color="#7b2cbf" emissive="#7b2cbf" emissiveIntensity={0.8} distort={0.5} speed={1.5} />
        </Sphere>
      </Float>

      <Sparkles count={400} scale={15} size={3} speed={0.8} opacity={0.6} color="#ffffff" />
      <Environment preset="night" />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
    </Canvas>
  );
}

// --- Main UI ---
export default function XakarenaHome() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden font-sans selection:bg-pink-500/30">
      {/* 3D Colorful Background */}
      <div className="absolute inset-0 z-0">
        <VibrantScene />
        {/* Dynamic Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-black/60 pointer-events-none backdrop-blur-[2px]" />
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,0,170,0.3)]">
            <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-pink-400 to-cyan-400">X</span>
          </div>
          <span className="text-2xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Xakarena
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 bg-white/5 backdrop-blur-xl px-10 py-4 rounded-full border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <NavButton active>Play</NavButton>
          <NavButton>Locker</NavButton>
          <NavButton>Social</NavButton>
          <NavButton>Shop</NavButton>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/20">
            <Settings className="w-6 h-6 text-white/90" />
          </button>
          
          <button 
            className="md:hidden p-3 text-white/90 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
            onClick={() => setIsNavOpen(!isNavOpen)}
          >
            {isNavOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Main Content Area - Strictly Centered, No Scroll */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8 text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.1)] text-white/80"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 shadow-[0_0_10px_rgba(0,255,204,1)]"></span>
            </span>
            Servers Online
          </motion.div>

          <h1 className="text-[5rem] md:text-[9rem] font-black uppercase tracking-tighter leading-none mb-12 drop-shadow-[0_0_50px_rgba(255,0,170,0.4)]">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">Enter the</span>
            <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff00aa] via-[#b700ff] to-[#00ffcc] animate-gradient-x">
              Arena.
            </span>
          </h1>
        </motion.div>

        {/* Giant Play Button */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, type: "spring", bounce: 0.4 }}
        >
          <button className="group relative flex items-center gap-4 bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white px-16 py-6 rounded-full font-black text-3xl uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(0,255,204,0.3)] hover:shadow-[0_0_80px_rgba(255,0,170,0.5)] hover:border-white/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1s_infinite]" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#ff00aa]/20 to-[#00ffcc]/20 transition-opacity duration-300" />
            <Play className="relative z-10 w-10 h-10 fill-white" />
            <span className="relative z-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">Find Match</span>
          </button>
        </motion.div>

      </main>

      {/* Global Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(150%); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}} />
    </div>
  );
}

function NavButton({ children, active }: { children: React.ReactNode, active?: boolean }) {
  return (
    <button className={`relative px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors duration-300 ${active ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-white/50 hover:text-white'}`}>
      {children}
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-1 left-2 right-2 h-1 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(0,255,204,1)]"
        />
      )}
    </button>
  );
}
