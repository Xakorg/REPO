"use client";
import { motion } from 'framer-motion';

const storeItems = [
  { id: 'vsa', title: 'Voltra Stick Arena', price: 'Free', category: 'Fighting', icon: '⚔️', bg: 'linear-gradient(135deg, #1f2937, #030712)' },
  { id: 'elywar_dlc', title: 'Elywar: Fire Pass', price: '$9.99', category: 'Battle Royale', icon: '🔥', bg: 'linear-gradient(135deg, #7f1d1d, #450a0a)' },
  { id: 'vsa_dlc', title: 'VSA: Plane Morph', price: '$1.99', category: 'Cosmetic', icon: '✈️', bg: 'linear-gradient(135deg, #1e3a8a, #172554)' },
  { id: 'creator', title: 'VSA Creator Hub', price: 'Free', category: 'Tools', icon: '🛠️', bg: 'linear-gradient(135deg, #4c1d95, #2e1065)' }
];

export default function StoreScreen({ selectedIndex }: { selectedIndex: number }) {
  // -1 is the Featured Banner, 0-3 is the bottom row
  return (
    <div className="absolute inset-0 flex flex-col px-16 pt-12 bg-gradient-to-br from-[#000] to-[#0a0f1c] text-white overflow-hidden">
      
      {/* Cinematic Header for Elywar */}
      <div className={`w-full max-w-6xl mx-auto h-[22rem] rounded-[2rem] overflow-hidden relative mb-10 flex items-end p-10 transition-all duration-300 ${selectedIndex === -1 ? 'shadow-[0_0_50px_rgba(45,212,191,0.3)] scale-[1.02]' : ''}`}>
         
         {/* Custom Elywar Background matching the "picture" style */}
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-800 via-[#042f2e] to-black"></div>
         <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E')] opacity-30"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>

         {selectedIndex === -1 && (
            <div className="absolute inset-0 rounded-[2rem] border-[4px] border-transparent" style={{ background: 'linear-gradient(135deg, #00e5ff, #00ff88) border-box', WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
         )}
         {selectedIndex !== -1 && (
            <div className="absolute inset-0 rounded-[2rem] border border-white/10"></div>
         )}
         
         <div className="relative z-10 w-full flex justify-between items-end">
           <div>
             <div className="text-teal-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-3">Featured Exclusive</div>
             <h1 className="text-7xl font-black italic drop-shadow-[0_0_20px_rgba(45,212,191,0.6)] text-white tracking-tighter">ELYWAR</h1>
             <p className="text-white/80 mt-3 max-w-md text-base leading-relaxed">Master the elements in the ultimate multiplayer battle royale. Download now for free.</p>
           </div>
           
           <div className={`px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 ${selectedIndex === -1 ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.8)]' : 'bg-white/10 text-white backdrop-blur-md border border-white/20'}`}>
             Play Free with Xakteir
           </div>
         </div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto">
        <h2 className="text-xl font-light mb-6 text-white/60 tracking-[0.2em] uppercase">Top Downloads</h2>
        <div className="flex gap-6 items-center">
          {storeItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <motion.div
                key={item.id}
                animate={{
                  scale: isSelected ? 1.05 : 0.95,
                  opacity: isSelected ? 1 : 0.5,
                  y: isSelected ? -10 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`relative rounded-3xl w-56 h-40 flex flex-col justify-end p-5 overflow-hidden transition-all duration-300 ${isSelected ? 'shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-20' : 'z-10'}`}
                style={{ background: item.bg }}
              >
                {isSelected && (
                  <div className="absolute inset-0 rounded-3xl border-[2px] border-transparent" style={{ background: 'linear-gradient(135deg, #00e5ff, #9900ff) border-box', WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
                )}
                {!isSelected && (
                  <div className="absolute inset-0 rounded-3xl border border-white/10"></div>
                )}
                
                <div className="absolute top-4 right-4 text-3xl opacity-50">{item.icon}</div>

                <div className="relative z-10">
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">{item.category}</div>
                  <h3 className="text-sm font-bold leading-tight mb-2 text-white">{item.title}</h3>
                  <div className="text-base text-teal-400 font-black">{item.price}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
