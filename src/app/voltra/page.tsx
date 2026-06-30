"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Cpu, Globe, Rocket } from "lucide-react";
import Image from "next/image";

export default function VoltraCompanyHomepage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/30 overflow-x-hidden">
      {/* Hero Section */}
      <section className="h-screen relative flex flex-col items-center justify-center overflow-hidden">
        <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
          <Image 
            src="/voltra_hq_background_1782838219839.png" 
            alt="Voltra Headquarters" 
            fill 
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
        </motion.div>

        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }} className="flex items-center gap-4 mb-6">
            <span className="h-[1px] w-12 bg-white/30"></span>
            <p className="text-sm font-black uppercase tracking-[0.5em] text-zinc-400">
              A Xakteir Subsidiary
            </p>
            <span className="h-[1px] w-12 bg-white/30"></span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="text-8xl md:text-[14rem] font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-200 to-zinc-600 drop-shadow-2xl">
            Voltra
          </motion.h1>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="mt-8 text-2xl md:text-4xl font-medium text-zinc-300 max-w-3xl leading-relaxed">
            We don't just build hardware.<br/>
            <span className="text-white font-black">We engineer the future.</span>
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }} className="absolute bottom-10 animate-bounce z-10">
          <ChevronDown className="w-10 h-10 text-zinc-500" />
        </motion.div>
      </section>

      {/* The Company Vision */}
      <section className="py-32 px-12 relative z-10 bg-black">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight italic">
              The <span className="text-zinc-600">Company</span>
            </h2>
            <p className="text-2xl text-zinc-400 leading-relaxed font-medium">
              Voltra operates as an independent titan under the Xakteir umbrella. While Xakteir builds the global software ecosystem, Voltra's sole purpose is to forge the physical vessels that run it. 
            </p>
            <p className="text-2xl text-zinc-400 leading-relaxed font-medium">
              We are obsessed with zero-latency, absolute premium materials, and pushing silicon to its absolute breaking point.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} className="grid grid-cols-1 gap-6">
            <div className="p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm flex items-start gap-6">
              <Cpu className="w-12 h-12 text-zinc-300 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">Bespoke Silicon</h3>
                <p className="text-zinc-400">Custom hardware architecture designed specifically for VoltraOS.</p>
              </div>
            </div>
            <div className="p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm flex items-start gap-6">
              <Globe className="w-12 h-12 text-zinc-300 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">Xakteir Integration</h3>
                <p className="text-zinc-400">Hardware that communicates natively with the entire Xakteir global cloud.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Divisions */}
      <section className="py-32 px-12 bg-zinc-950 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto text-center space-y-24">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
            <h2 className="text-6xl font-black uppercase tracking-widest text-zinc-300">Our Divisions</h2>
            <p className="text-2xl text-zinc-500 font-medium max-w-3xl mx-auto">Two distinct product lines. One unified ecosystem.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 w-full text-left">
            {/* VoltraMax Card */}
            <a href="https://voltramax.xakteir.com" className="group">
              <motion.div whileHover={{ scale: 1.02 }} className="h-[600px] rounded-[3rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-12 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-500 group-hover:border-blue-500/50">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
                <div className="relative z-10 space-y-4">
                  <span className="px-4 py-1 rounded-full border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-widest bg-blue-500/10">Flagship Hardware</span>
                  <h3 className="text-6xl font-black uppercase italic text-white drop-shadow-lg">VoltraMax</h3>
                  <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-md">
                    The ultimate 2-in-1 folding tablet device. Designed for extreme multitasking, professional workflows, and uncompromising power.
                  </p>
                </div>
                <div className="relative z-10 flex items-center justify-between mt-8">
                  <p className="text-blue-400 font-bold uppercase tracking-widest">Enter The Max →</p>
                  <Rocket className="w-8 h-8 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                </div>
              </motion.div>
            </a>

            {/* VoltraPlay Card */}
            <a href="https://play.voltra.xakteir.com" className="group">
              <motion.div whileHover={{ scale: 1.02 }} className="h-[600px] rounded-[3rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-12 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-500 group-hover:border-purple-500/50">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
                <div className="relative z-10 space-y-4">
                  <span className="px-4 py-1 rounded-full border border-purple-500/30 text-purple-400 text-xs font-black uppercase tracking-widest bg-purple-500/10">Gaming Division</span>
                  <h3 className="text-6xl font-black uppercase italic text-white drop-shadow-lg">VoltraPlay</h3>
                  <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-md">
                    The ultimate premium gaming handheld. Built with Hall-effect joysticks, OLED brilliance, and native Voltra Stick Arena integration.
                  </p>
                </div>
                <div className="relative z-10 flex items-center justify-between mt-8">
                  <p className="text-purple-400 font-bold uppercase tracking-widest">Enter The Play →</p>
                  <Rocket className="w-8 h-8 text-purple-500/50 group-hover:text-purple-400 transition-colors" />
                </div>
              </motion.div>
            </a>
          </div>
        </div>
      </section>
      
      <footer className="py-12 text-center text-zinc-600 border-t border-white/5 bg-black">
        <p className="uppercase tracking-[0.3em] text-sm font-bold">Voltra — A Xakteir Company © 2026</p>
      </footer>
    </div>
  );
}
