"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTickSound, playSelectSound } from '../audio';

const storeItems = [
  { id: 'vsa', title: 'Voltra Stick Arena', price: 'Free', category: 'Fighting' },
  { id: 'elywar_dlc', title: 'Elywar: Fire Pass', price: '$9.99', category: 'Battle Royale' },
  { id: 'vsa_dlc', title: 'VSA: Plane Morph', price: '$1.99', category: 'Cosmetic' },
  { id: 'creator', title: 'VSA Creator Hub', price: 'Free', category: 'Tools' }
];

export default function VoltraShop() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        playTickSound();
        setSelectedIndex((prev) => Math.min(prev + 1, storeItems.length - 1));
      } else if (e.key === 'ArrowLeft') {
        playTickSound();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        playSelectSound();
        router.push('/weywqdvtewbytdibsaudbeowbfdbwyiyewdufoesncmersuifreybfoyuvtobewufewfdefbeyufvesiyfrebfdyre9nfrebfibeurw');
      } else if (e.key === 'Enter') {
        playSelectSound();
        const selected = storeItems[selectedIndex];
        setToast(`Downloading ${selected.title} to NVMe...`);
        setTimeout(() => setToast(''), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, router]);

  return (
    <div className="absolute inset-0 flex flex-col px-24 pt-12">
      {/* Cinematic Header */}
      <div className="w-full h-64 rounded-[2.5rem] glass-card overflow-hidden relative mb-12 flex items-end p-10 border border-white/20 shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-r from-teal-500/40 via-purple-600/20 to-black/80"></div>
         
         <div className="relative z-10 w-full flex justify-between items-end">
           <div>
             <div className="text-teal-300 font-bold uppercase tracking-widest text-sm mb-3">Featured Exclusive</div>
             <h1 className="text-6xl font-black italic drop-shadow-lg">ELYWAR</h1>
             <p className="text-white/90 mt-3 max-w-lg text-lg">Master the elements in the ultimate multiplayer battle royale. Download now for free.</p>
           </div>
           
           <div className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg shadow-lg">
             Play Free with Xakteir
           </div>
         </div>
      </div>
      
      <h2 className="text-2xl font-light mb-8 text-white/80 tracking-widest uppercase">Top Downloads</h2>
      <div className="flex gap-8 items-center">
        {storeItems.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <motion.div
              key={item.id}
              animate={{
                scale: isSelected ? 1.1 : 1,
                opacity: isSelected ? 1 : 0.6,
                y: isSelected ? -10 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`glass-card rounded-3xl w-64 h-48 flex flex-col justify-end p-6 border-[3px] transition-colors ${isSelected ? 'border-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.4)]' : 'border-transparent'}`}
              style={{
                background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(30px)'
              }}
            >
              <div className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2">{item.category}</div>
              <h3 className="text-xl font-bold leading-tight mb-2 drop-shadow-md">{item.title}</h3>
              <div className="text-lg text-teal-300 font-black">{item.price}</div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-10 right-24 bg-teal-500/20 text-teal-200 px-6 py-4 rounded-2xl border border-teal-400/50 glass-card text-lg shadow-2xl backdrop-blur-3xl font-bold"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
