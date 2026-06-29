"use client";
import { motion } from 'framer-motion';

const storeItems = [
  { id: 'vsa', title: 'Voltra Stick Arena', price: 'Free', category: 'Fighting' },
  { id: 'elywar_dlc', title: 'Elywar: Fire Pass', price: '$9.99', category: 'Battle Royale' },
  { id: 'vsa_dlc', title: 'VSA: Plane Morph', price: '$1.99', category: 'Cosmetic' },
  { id: 'creator', title: 'VSA Creator Hub', price: 'Free', category: 'Tools' }
];

export default function StoreScreen({ selectedIndex }: { selectedIndex: number }) {
  // -1 is the Featured Banner, 0-3 is the bottom row
  return (
    <div className="absolute inset-0 flex flex-col px-12 pt-8 bg-gradient-to-br from-[#000] to-[#0a0f1c] text-white">
      {/* Cinematic Header */}
      <div className={`w-full h-48 rounded-[2rem] overflow-hidden relative mb-8 flex items-end p-8 border-2 transition-all duration-300 ${selectedIndex === -1 ? 'border-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.3)] scale-[1.02]' : 'border-white/10'}`}>
         <div className="absolute inset-0 bg-gradient-to-r from-teal-600/40 via-purple-700/20 to-black/90"></div>
         
         <div className="relative z-10 w-full flex justify-between items-end">
           <div>
             <div className="text-teal-400 font-bold uppercase tracking-widest text-xs mb-2">Featured Exclusive</div>
             <h1 className="text-5xl font-black italic drop-shadow-[0_0_15px_rgba(45,212,191,0.5)] text-white">ELYWAR</h1>
             <p className="text-white/80 mt-2 max-w-md text-sm leading-relaxed">Master the elements in the ultimate multiplayer battle royale. Download now for free.</p>
           </div>
           
           <div className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${selectedIndex === -1 ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'bg-white/20 text-white backdrop-blur-md'}`}>
             Play Free with Xakteir
           </div>
         </div>
      </div>
      
      <h2 className="text-xl font-light mb-6 text-white/70 tracking-widest uppercase">Top Downloads</h2>
      <div className="flex gap-4 items-center">
        {storeItems.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <motion.div
              key={item.id}
              animate={{
                scale: isSelected ? 1.05 : 0.95,
                opacity: isSelected ? 1 : 0.5,
                y: isSelected ? -5 : 0
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`rounded-2xl w-48 h-32 flex flex-col justify-end p-5 border-2 transition-colors duration-300 ${isSelected ? 'border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)]' : 'border-white/10'}`}
              style={{
                background: isSelected ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">{item.category}</div>
              <h3 className="text-sm font-bold leading-tight mb-2 text-white">{item.title}</h3>
              <div className="text-sm text-teal-400 font-black">{item.price}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
