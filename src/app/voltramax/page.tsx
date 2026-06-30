"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Cpu, Maximize, Rotate3D, Shield } from "lucide-react";

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
            src="/voltramax_option_5_1782839681925.png" 
            alt="The VoltraMax 3-Screen Device" 
            fill 
            className="object-cover"
          />
        </motion.div>
      </section>

      {/* The 5-in-1 Revolution */}
      <section className="py-32 px-12 bg-zinc-950 border-y border-white/5">
        <div className="max-w-6xl mx-auto text-center space-y-16">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-blue-500 font-bold tracking-[0.3em] uppercase text-sm border border-blue-500/30 px-4 py-1 rounded-full mb-8 inline-block">Hardware Masterpiece</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight mt-6">
              3 Screens. <span className="text-blue-500 italic">5 Modes.</span>
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-medium text-zinc-400 leading-tight">
            A Tablet. A TV. A Gaming Console. A Monitor. <br/>
            <span className="text-white font-black mt-4 block">Even 2 Tablets in 1.</span>
          </motion.p>
          
          <div className="grid md:grid-cols-4 gap-8 pt-16 text-left">
            <div className="p-8 border border-white/10 rounded-3xl bg-black">
              <Rotate3D className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4 uppercase">360° Dual-Axis Hinge</h3>
              <p className="text-zinc-400 leading-relaxed">Built with a hardened steel alloy and a Hall effect sensor that automatically detects the exact angle to dynamically switch between all 5 modes instantly in VoltraOS.</p>
            </div>
            <div className="p-8 border border-white/10 rounded-3xl bg-black">
              <Maximize className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4 uppercase">Triple QHD Displays</h3>
              <p className="text-zinc-400 leading-relaxed">Not one, not two, but THREE identical 2560x1440 60Hz displays. One inside the lid, one on the back of the lid, and one on the absolute underside of the base.</p>
            </div>
            <div className="p-8 border border-white/10 rounded-3xl bg-black">
              <Cpu className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4 uppercase">Core Ultra 7</h3>
              <p className="text-zinc-400 leading-relaxed">Powered by the latest Intel Core Ultra (Series 2). Its integrated Arc GPU drives all 3 displays simultaneously without breaking a sweat, while the NPU runs local Xak AI.</p>
            </div>
            <div className="p-8 border border-white/10 rounded-3xl bg-black">
              <Shield className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4 uppercase">MIL-STD-810H</h3>
              <p className="text-zinc-400 leading-relaxed">How do you protect a laptop made entirely of glass? A military-grade Magnesium-Alloy internal skeleton providing rigid structural strength to survive the drops.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Modes Breakdown */}
      <section className="py-32 px-12 bg-black border-b border-white/5">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center">
            <h2 className="text-4xl font-black uppercase tracking-widest text-zinc-500">Infinite Possibilities</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase text-white">1. Laptop Mode <span className="text-blue-500 text-xl tracking-widest">(90°)</span></h3>
              <p className="text-xl text-zinc-400">Open it like a standard laptop. The primary display faces you, while the full-size backlit keyboard and glass haptic trackpad are ready for work. Screen 3 faces the desk.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase text-white">2. Tablet Mode <span className="text-blue-500 text-xl tracking-widest">(360°)</span></h3>
              <p className="text-xl text-zinc-400">Fold it completely back. The keyboard disables, and VoltraOS shifts into an ultra-fluid touch environment powered by our native Wayland compositor.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase text-white">3. TV Mode <span className="text-blue-500 text-xl tracking-widest">(180°)</span></h3>
              <p className="text-xl text-zinc-400">Lay it perfectly flat or prop it into a tent. Use the outer screens to project massive, immersive content.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase text-white">4. 2-Tablets-in-1 <span className="text-blue-500 text-xl tracking-widest">(0°)</span></h3>
              <p className="text-xl text-zinc-400">When the device is completely closed, Screen 2 (top) and Screen 3 (bottom) face outward. Two users can sit across from each other, using entirely independent touchscreen environments simultaneously.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The OS Section */}
      <section className="py-40 px-12 relative overflow-hidden bg-zinc-950">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-10">
            <div>
              <span className="text-blue-500 font-bold tracking-[0.3em] uppercase text-sm border border-blue-500/30 px-4 py-1 rounded-full">The Beating Heart</span>
              <h2 className="text-6xl md:text-8xl font-black uppercase italic mt-6">VoltraOS</h2>
            </div>
            <div className="space-y-6 text-xl text-zinc-300 font-medium leading-relaxed">
              <p>
                Hardware is nothing without software. We built <strong className="text-white">VoltraOS</strong> from the ground up for the Max.
              </p>
              <p>
                Powered by a <strong className="text-blue-400">Native Wayland Compositor</strong>, the OS delivers literally zero-latency UI rendering. No screen tearing, no dropped frames. Just buttery-smooth physics across all 3 displays.
              </p>
              <p>
                But what makes it truly revolutionary? The <strong className="text-white">Wine Translation Layer</strong>. We engineered a seamless compatibility layer that allows VoltraOS to run legacy Windows <code className="bg-white/10 px-2 py-1 rounded text-sm">.exe</code> applications natively and flawlessly. You never have to compromise.
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative aspect-square rounded-full border border-blue-500/20 flex items-center justify-center p-12 bg-gradient-to-br from-blue-900/10 to-transparent">
            <div className="absolute inset-0 animate-[spin_10s_linear_infinite] border-t-2 border-blue-500 rounded-full opacity-50" />
            <div className="absolute inset-4 animate-[spin_15s_linear_infinite_reverse] border-b-2 border-blue-400 rounded-full opacity-30" />
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase tracking-widest text-white">Hardware &amp;<br/><span className="text-blue-500">Software</span></h3>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Engineering Feat */}
      <section className="py-32 px-12 bg-black border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-16">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-5xl font-black uppercase tracking-widest text-zinc-300">Uncompromising Specs</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-8 border border-white/5 rounded-3xl bg-zinc-950">
              <h3 className="text-2xl font-bold mb-4 uppercase text-blue-500">Thermal Management</h3>
              <p className="text-zinc-400">Cooling an Intel Core Ultra 7 in a device made entirely of glass is no easy feat. A bespoke dual heat pipe and dual asymmetric fan system silently dissipates heat without throttling, even when all 3 displays are blasting 1440p content.</p>
            </div>
            <div className="p-8 border border-white/5 rounded-3xl bg-zinc-950">
              <h3 className="text-2xl font-bold mb-4 uppercase text-blue-500">100Wh Powerhouse</h3>
              <p className="text-zinc-400">Three screens require immense power. We packed a massive 100Wh Lithium-Polymer battery into the chassis—the absolute legal maximum allowed on commercial flights. Fast-charges via 65W USB-PD.</p>
            </div>
            <div className="p-8 border border-white/5 rounded-3xl bg-zinc-950">
              <h3 className="text-2xl font-bold mb-4 uppercase text-blue-500">I/O Connectivity</h3>
              <p className="text-zinc-400">Dongles are dead. The VoltraMax features two full-speed USB-C ports with DisplayPort Alt Mode, three USB-A ports for legacy peripherals, and a full-size HDMI 2.0 port built directly into the ultra-thin base.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Audio & Security */}
      <section className="py-32 px-12 bg-zinc-950 border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
            <h3 className="text-4xl font-black uppercase text-white">The Soundstage</h3>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Three screens demand cinematic audio. VoltraMax features side-firing stereo speakers driven by smart amplifiers to prevent over-excursion at maximum volume. A dual MEMS microphone array continuously listens for <span className="text-blue-400 font-bold">"Hey Xak"</span>, filtering out background noise perfectly.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="space-y-6">
            <h3 className="text-4xl font-black uppercase text-white">Absolute Security</h3>
            <p className="text-xl text-zinc-400 leading-relaxed">
              An IR flood emitter and 940nm infrared camera handle instant biometric face unlocking in any lighting condition. But we didn't stop there. VoltraMax includes a physical, mechanical sliding privacy shutter over the camera, and a hardware-level LED indicator that software cannot override.
            </p>
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
