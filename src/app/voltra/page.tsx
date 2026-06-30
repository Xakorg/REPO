"use client";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function VoltraHomepage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/30">
      {/* Hero */}
      <section className="h-screen flex flex-col items-center justify-center relative">
        <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }} className="text-sm font-black uppercase tracking-[0.5em] text-zinc-500 mb-8">
          Introducing
        </motion.p>
        <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="text-8xl md:text-[12rem] font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-600">
          Voltra
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }} className="absolute bottom-10 animate-bounce">
          <ChevronDown className="w-10 h-10 text-zinc-500" />
        </motion.div>
      </section>

      {/* About */}
      <section className="min-h-screen flex items-center justify-center p-12 bg-zinc-950">
        <div className="max-w-4xl space-y-12 text-center">
          <motion.h2 initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="text-5xl font-black uppercase tracking-tight">The Purpose</motion.h2>
          <motion.p initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} className="text-2xl text-zinc-400 font-medium leading-relaxed">
            Voltra is not just an operating system. It is an ecosystem. 0.00ms load times. A native Wayland compositor. And a suite of hardware designed to push the absolute limits of human-computer interaction.
          </motion.p>
        </div>
      </section>

      {/* Products */}
      <section className="min-h-screen flex flex-col items-center justify-center p-12 space-y-20">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-4xl font-black uppercase tracking-widest text-zinc-500">The Ecosystem</motion.h2>
        <div className="grid md:grid-cols-2 gap-12 w-full max-w-6xl">
          <a href="https://voltramax.xakteir.com">
            <motion.div whileHover={{ scale: 1.05 }} className="h-96 rounded-[3rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-12 flex flex-col justify-end cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
              <h3 className="text-5xl font-black uppercase italic relative z-10">VoltraMax</h3>
              <p className="text-zinc-400 font-bold uppercase tracking-widest mt-4 relative z-10 group-hover:text-blue-400 transition-colors">Discover Max →</p>
            </motion.div>
          </a>
          <a href="https://play.voltra.xakteir.com">
            <motion.div whileHover={{ scale: 1.05 }} className="h-96 rounded-[3rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-12 flex flex-col justify-end cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
              <h3 className="text-5xl font-black uppercase italic relative z-10">VoltraPlay</h3>
              <p className="text-zinc-400 font-bold uppercase tracking-widest mt-4 relative z-10 group-hover:text-purple-400 transition-colors">Discover Play →</p>
            </motion.div>
          </a>
        </div>
      </section>
    </div>
  );
}
