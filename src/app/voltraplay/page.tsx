"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Gamepad2, Mic, Zap } from "lucide-react";

export default function VoltraPlayHomepage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden selection:bg-purple-500/30">
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center p-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />
        
        <motion.h1 initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="text-7xl md:text-[12rem] font-black uppercase italic tracking-tighter text-purple-500 drop-shadow-[0_0_80px_rgba(168,85,247,0.4)] relative z-10 leading-none">
          VoltraPlay
        </motion.h1>
        
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="text-2xl md:text-4xl font-bold uppercase tracking-[0.3em] text-zinc-400 mt-8 relative z-10">
          The Future of Handheld Gaming
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, delay: 1 }} className="mt-20 relative w-full max-w-4xl aspect-[16/9] rounded-[3rem] overflow-hidden border border-purple-500/20 shadow-[0_0_100px_rgba(168,85,247,0.15)] z-10">
          <Image 
            src="/voltraplay_console_1782838236584.png" 
            alt="The VoltraPlay Console" 
            fill 
            className="object-cover"
          />
        </motion.div>
      </section>

      {/* The Hardware */}
      <section className="py-40 px-12 bg-zinc-950 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
            <span className="text-purple-500 font-bold tracking-[0.3em] uppercase text-sm border border-purple-500/30 px-4 py-1 rounded-full">Engineering Marvel</span>
            <h2 className="text-6xl md:text-8xl font-black uppercase italic text-white leading-none">The Hardware</h2>
            <p className="text-2xl text-zinc-300 font-medium leading-relaxed">
              We didn't just build another handheld console. We built a machine that refuses to compromise on quality, controls, or power.
            </p>
            <ul className="space-y-6 pt-4">
              <li className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30"><Zap className="text-purple-400 w-6 h-6"/></div>
                <div>
                  <h4 className="text-xl font-bold uppercase">7-Inch OLED Brilliance</h4>
                  <p className="text-zinc-500">Perfect true blacks and vibrant, eye-searing color.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30"><Gamepad2 className="text-purple-400 w-6 h-6"/></div>
                <div>
                  <h4 className="text-xl font-bold uppercase">Hall-Effect Perfection</h4>
                  <p className="text-zinc-500">Magnetic sensors mean zero physical wear. Stick drift is a thing of the past.</p>
                </div>
              </li>
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-black border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors duration-500"/>
            <div className="relative z-10 space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center animate-pulse">
                <span className="text-4xl font-black italic text-purple-400">X</span>
              </div>
              <h3 className="text-4xl font-black uppercase">The Xak Key</h3>
              <p className="text-lg text-zinc-400 font-medium leading-relaxed">
                A dedicated, physical glowing button that instantly summons the Quick Menu overlay and activates the Voltra Voice AI system mid-game, without ever pausing the action.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Voltra Stick Arena Section */}
      <section className="py-40 px-12 bg-black relative overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full bg-rose-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center space-y-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-rose-500 font-bold tracking-[0.3em] uppercase text-sm border border-rose-500/30 px-4 py-1 rounded-full mb-8 inline-block">The Flagship Title</span>
            <h2 className="text-6xl md:text-9xl font-black uppercase italic text-white drop-shadow-xl">Voltra Stick Arena</h2>
          </motion.div>
          
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="grid md:grid-cols-2 gap-12 text-left items-center mt-16">
            <div className="space-y-6">
              <h3 className="text-4xl font-black uppercase text-rose-500">Absolute Chaos</h3>
              <p className="text-xl text-zinc-400 leading-relaxed font-medium">
                VSA is a genre-defining 100-Player Free-For-All platform fighter. Hand-drawn neon stickmen doing battle with hyper-fluid physics, double-jumps, and screen-shattering particle explosions.
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-950/40 to-black border border-rose-500/20 rounded-[2rem] p-10 space-y-6">
              <div className="flex items-center gap-4 text-rose-400">
                <Mic className="w-8 h-8" />
                <h4 className="text-2xl font-black uppercase">Zero-Lag Voice Combat</h4>
              </div>
              <p className="text-lg text-zinc-300">
                The most revolutionary feature in modern gaming. The microphone is always listening. Yell <strong className="text-white">"ROCKET"</strong> to instantly fire an RPG mid-combo. Yell <strong className="text-white">"KATANA"</strong> to manifest a sword.
              </p>
              <p className="text-sm text-zinc-500 italic">
                *Spamming commands will exhaust your character, causing them to sweat and pass out. Use your voice wisely.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 text-center bg-[#050505] border-t border-white/5">
        <motion.h2 initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl">
          Game Over for the Competition.
        </motion.h2>
      </section>
    </div>
  );
}
