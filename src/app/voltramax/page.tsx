"use client";
import { motion } from "framer-motion";

export default function VoltraMaxHomepage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center text-center p-12 space-y-20 selection:bg-blue-500/30">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="space-y-6">
        <h1 className="text-7xl md:text-[8rem] font-black tracking-tighter uppercase italic text-blue-500 drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]">
          VoltraMax
        </h1>
        <p className="text-2xl md:text-4xl font-bold text-zinc-300">
          Not Pro. Not Good. <span className="text-white font-black italic underline decoration-blue-500">MAX.</span>
        </p>
      </motion.div>

      <motion.p initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1 }} className="max-w-4xl text-3xl font-medium text-zinc-400 leading-relaxed">
        Infinite possibilities. A tablet. A TV. A Gaming Console. A monitor. <br/>
        <span className="text-white font-black">Even 2 Tablets in 1.</span>
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 2 }} className="space-y-4">
        <p className="text-2xl font-bold uppercase tracking-widest text-blue-400">Everything you would ever want.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <span className="px-6 py-2 rounded-full border border-white/10 bg-white/5 font-black uppercase text-sm">Xak AI</span>
          <span className="px-6 py-2 rounded-full border border-white/10 bg-white/5 font-black uppercase text-sm">XakChat</span>
          <span className="px-6 py-2 rounded-full border border-white/10 bg-white/5 font-black uppercase text-sm">VoltraOS</span>
        </div>
      </motion.div>

      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 3 }} className="text-5xl md:text-7xl font-black uppercase tracking-tighter mt-20 italic text-white/50">
        This. Is. VoltraMax.
      </motion.h2>
    </div>
  );
}
