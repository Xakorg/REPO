"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTickSound, playSelectSound } from './audio';

const games = [
  { id: 'vsa', title: 'Voltra Stick Arena', type: 'Game', isExclusive: true, tag: 'Free' },
  { id: 'elywar', title: 'Elywar', type: 'Game', isExclusive: true, tag: 'Battle Royale' },
  { id: 'store', title: 'Xakteir Store', type: 'System', isExclusive: false, tag: 'App' },
  { id: 'settings', title: 'Settings', type: 'System', isExclusive: false, tag: 'App' }
];

export default function VoltraHome() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState('');
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      playTickSound();
      setSelectedIndex((prev) => Math.min(prev + 1, games.length - 1));
    } else if (e.key === 'ArrowLeft') {
      playTickSound();
      setSelectedIndex((prev) => Math.max(prev - 0, 0)); // prev - 1
    } else if (e.key === 'Enter') {
      playSelectSound();
      const selected = games[selectedIndex];
      if (selected.id === 'store') {
        router.push('/weywqdvtewbytdibsaudbeowbfdbwyiyewdufoesncmersuifreybfoyuvtobewufewfdefbeyufvesiyfrebfdyre9nfrebfibeurw/shop');
      } else {
        setToast(`Opening ${selected.title}... (Not available in simulation)`);
        setTimeout(() => setToast(''), 3000);
      }
    }
  }, [selectedIndex, router]);

  // Fix max logic issue from inline edit
  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            playTickSound();
            setSelectedIndex((prev) => Math.min(prev + 1, games.length - 1));
        } else if (e.key === 'ArrowLeft') {
            playTickSound();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            playSelectSound();
            const selected = games[selectedIndex];
            if (selected.id === 'store') {
                router.push('/weywqdvtewbytdibsaudbeowbfdbwyiyewdufoesncmersuifreybfoyuvtobewufewfdefbeyufvesiyfrebfdyre9nfrebfibeurw/shop');
            } else {
                setToast(`Opening ${selected.title}... (Not available in simulation)`);
                setTimeout(() => setToast(''), 3000);
            }
        }
    };
    window.addEventListener('keydown', keyListener);
    return () => window.removeEventListener('keydown', keyListener);
  }, [selectedIndex, router]);

  return (
    <div className="absolute inset-0 flex flex-col justify-center px-24">
      <h1 className="text-4xl font-light mb-12 text-white/80 tracking-widest uppercase">My Games</h1>
      
      <div className="flex gap-10 items-center">
        {games.map((game, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <motion.div
              key={game.id}
              animate={{
                scale: isSelected ? 1.15 : 1,
                opacity: isSelected ? 1 : 0.5,
                y: isSelected ? -15 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`relative glass-card rounded-3xl w-72 h-96 flex flex-col justify-end p-8 border-[3px] transition-colors ${isSelected ? 'border-white shadow-[0_0_40px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}
              style={{
                background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(30px)'
              }}
            >
              {game.isExclusive && (
                <div className="absolute top-4 left-4 bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-xs font-bold border border-teal-400/50">
                  Exclusive
                </div>
              )}
              <div className="absolute top-4 right-4 text-white/50 text-xs font-bold uppercase tracking-wider">
                {game.tag}
              </div>

              <div className="text-sm text-teal-300 font-bold uppercase tracking-widest mb-3">{game.type}</div>
              <h2 className="text-3xl font-black leading-none drop-shadow-lg">{game.title}</h2>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="absolute bottom-32 left-1/2 bg-black/80 text-white px-8 py-4 rounded-full border border-white/20 glass-card text-lg shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
