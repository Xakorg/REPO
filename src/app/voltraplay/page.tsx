"use client";
import { motion } from "framer-motion";

export default function VoltraPlayHomepage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden selection:bg-purple-500/30">
      <section className="min-h-screen flex flex-col items-center justify-center text-center p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none" />
        <motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="text-7xl md:text-[9rem] font-black uppercase italic tracking-tighter text-purple-400 drop-shadow-[0_0_80px_rgba(168,85,247,0.4)] relative z-10">
          VoltraPlay
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="text-2xl font-bold uppercase tracking-[0.3em] text-zinc-400 mt-6 relative z-10">
          The Future of Handheld Gaming
        </motion.p>
      </section>

      <section className="py-32 px-12 max-w-6xl mx-auto grid md:grid-cols-2 gap-20">
        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
          <h2 className="text-5xl font-black uppercase italic text-white">The Hardware</h2>
          <p className="text-xl text-zinc-400 font-medium leading-relaxed">
            7-inch OLED. Symmetrical Hall-effect joysticks. Analog triggers. 
            Powered by a native Linux stack and Wayland compositor for buttery-smooth, tear-free rendering.
          </p>
          <div className="inline-block px-6 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 font-black uppercase text-sm">
            Featuring The Xak Key
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
          <h2 className="text-5xl font-black uppercase italic text-white">Voltra Stick Arena</h2>
          <p className="text-xl text-zinc-400 font-medium leading-relaxed">
            The flagship genre-defining title. 100-Player Free-For-All chaotic platform fighting.
            Featuring the revolutionary Voice Combat System: yell "ROCKET" or "NUKE" into the mic to instantly manifest weapons mid-combo.
          </p>
          <div className="inline-block px-6 py-2 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400 font-black uppercase text-sm">
            Zero-Lag Voice Recognition
          </div>
        </motion.div>
      </section>

      <section className="py-32 text-center bg-black/50 border-t border-white/5">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
          Game Over for the Competition.
        </motion.h2>
      </section>
    </div>
  );
}
