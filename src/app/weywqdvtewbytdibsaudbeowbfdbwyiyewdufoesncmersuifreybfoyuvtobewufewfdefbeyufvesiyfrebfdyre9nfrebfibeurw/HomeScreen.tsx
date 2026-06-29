"use client";
import { motion } from 'framer-motion';

const games = [
  { id: 'vsa', title: 'Voltra Stick Arena', type: 'Game', isExclusive: true, tag: 'Free' },
  { id: 'elywar', title: 'Elywar', type: 'Game', isExclusive: true, tag: 'Battle Royale' },
  { id: 'store', title: 'Xakteir Store', type: 'System', isExclusive: false, tag: 'App' },
  { id: 'settings', title: 'Settings', type: 'System', isExclusive: false, tag: 'App' }
];

export default function HomeScreen({ selectedIndex }: { selectedIndex: number }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-12 bg-gradient-to-br from-[#0f172a] to-[#020617] text-white">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 flex justify-between items-end mb-8">
        <h1 className="text-3xl font-light text-white/90 tracking-[0.2em] uppercase">My Games</h1>
        <div className="text-sm font-bold text-teal-400 bg-teal-950/50 px-4 py-1 rounded-full border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
          Lv. 67
        </div>
      </div>
      
      <div className="relative z-10 flex gap-6 items-center">
        {games.map((game, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <motion.div
              key={game.id}
              animate={{
                scale: isSelected ? 1.1 : 0.95,
                opacity: isSelected ? 1 : 0.4,
                y: isSelected ? -10 : 0
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`relative rounded-3xl w-56 h-80 flex flex-col justify-end p-6 border-2 transition-colors duration-300 ${isSelected ? 'border-white/80 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-white/10'}`}
              style={{
                background: isSelected ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)' : 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(20px)'
              }}
            >
              {game.isExclusive && (
                <div className="absolute top-4 left-4 bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-[10px] font-bold border border-teal-400/30 tracking-widest uppercase">
                  Exclusive
                </div>
              )}
              <div className="absolute top-4 right-4 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                {game.tag}
              </div>

              <div className="text-xs text-teal-400/80 font-bold uppercase tracking-widest mb-2">{game.type}</div>
              <h2 className="text-2xl font-black leading-none drop-shadow-lg text-white">{game.title}</h2>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
