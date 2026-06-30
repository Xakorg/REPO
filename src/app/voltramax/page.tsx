"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { ChevronDown, Cpu, Layers, Zap } from "lucide-react";

export default function VoltraMaxHomepage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="space-y-6 relative z-10">
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter uppercase italic text-blue-500 drop-shadow-[0_0_50px_rgba(59,130,246,0.6)]">
            VoltraMax
          </h1>
          <p className="text-3xl md:text-5xl font-bold text-zinc-300">
            Not Pro. Not Good. <span className="text-white font-black italic underline decoration-blue-500 underline-offset-8">MAX.</span>
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, delay: 0.5 }} className="mt-20 relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.2)]">
          <Image 
            src="/voltramax_device_1782838228598.png" 
            alt="The VoltraMax Device" 
            fill 
            className="object-cover"
          />
        </motion.div>
      </section>

      {/* Infinite Possibilities Section */}
      <section className="py-32 px-12 bg-zinc-950 border-y border-white/5">
        <div className="max-w-6xl mx-auto text-center space-y-16">
          <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-5xl md:text-7xl font-black uppercase tracking-tight">
            Infinite <span className="text-blue-500 italic">Possibilities.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-medium text-zinc-400 leading-tight">
            A Tablet. A TV. A Gaming Console. A Monitor. <br/>
            <span className="text-white font-black mt-4 block">Even 2 Tablets in 1.</span>
          </motion.p>
          <div className="grid md:grid-cols-3 gap-8 pt-16 text-left">
            <div className="p-8 border border-white/10 rounded-3xl bg-black">
              <Layers className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4 uppercase">Foldable Architecture</h3>
              <p className="text-zinc-400 leading-relaxed">A seamless glass hinge technology allows the Max to fold completely flat, bend into a laptop orientation, or snap apart into two fully independent displays.</p>
            </div>
            <div className="p-8 border border-white/10 rounded-3xl bg-black">
              <Zap className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4 uppercase">Console-Grade Power</h3>
              <p className="text-zinc-400 leading-relaxed">Dock it to your TV and it instantly shifts its TDP limits, unlocking desktop-class thermal performance for AAA gaming on the big screen.</p>
            </div>
            <div className="p-8 border border-white/10 rounded-3xl bg-black">
              <Cpu className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4 uppercase">Xakteir Intelligence</h3>
              <p className="text-zinc-400 leading-relaxed">Xak AI and XakChat are physically embedded into the system firmware. The ultimate AI companion, deeply integrated into every action you take.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The OS Section */}
      <section className="py-40 px-12 relative overflow-hidden bg-black">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-10">
            <div>
              <span className="text-blue-500 font-bold tracking-[0.3em] uppercase text-sm border border-blue-500/30 px-4 py-1 rounded-full">The Beating Heart</span>
              <h2 className="text-6xl md:text-8xl font-black uppercase italic mt-6">VoltraOS</h2>
            </div>
            <div className="space-y-6 text-xl text-zinc-300 font-medium leading-relaxed">
              <p>
                Hardware is nothing without software. We threw away legacy operating systems and built <strong className="text-white">VoltraOS</strong> from the ground up for the Max.
              </p>
              <p>
                Powered by a <strong className="text-blue-400">Native Wayland Compositor</strong>, the OS delivers literally zero-latency UI rendering. No screen tearing, no dropped frames. Just buttery-smooth physics that respond instantly to your touch.
              </p>
              <p>
                But what makes it truly revolutionary? The <strong className="text-white">Wine Translation Layer</strong>. We engineered a seamless, invisible compatibility layer that allows VoltraOS to run legacy Windows <code className="bg-white/10 px-2 py-1 rounded text-sm">.exe</code> applications natively, flawlessly, and safely within micro-sandboxes. You never have to compromise.
              </p>
            </div>
            <ul className="space-y-4 text-zinc-400 font-bold">
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-blue-500 rounded-full"/> Extreme Multitasking Engine</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-blue-500 rounded-full"/> OS-Level Xak AI Integration</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-blue-500 rounded-full"/> Universal .exe Compatibility</li>
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative aspect-square rounded-full border border-blue-500/20 flex items-center justify-center p-12 bg-gradient-to-br from-blue-900/10 to-transparent">
            <div className="absolute inset-0 animate-[spin_10s_linear_infinite] border-t-2 border-blue-500 rounded-full opacity-50" />
            <div className="absolute inset-4 animate-[spin_15s_linear_infinite_reverse] border-b-2 border-blue-400 rounded-full opacity-30" />
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase tracking-widest text-white">Zero<br/><span className="text-blue-500">Latency</span></h3>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 text-center bg-black border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none" />
        <motion.h2 initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic text-white relative z-10 drop-shadow-2xl">
          This. Is. VoltraMax.
        </motion.h2>
      </section>
    </div>
  );
}
