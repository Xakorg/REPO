"use client";
import { motion } from 'framer-motion';

const games = [
  { 
    id: 'vsa', 
    title: 'Voltra Stick Arena', 
    type: 'Game', 
    isExclusive: true, 
    tag: 'Free',
    bg: 'linear-gradient(135deg, #1f2937 0%, #030712 100%)',
    art: 'bg-[url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]',
    icon: '⚔️'
  },
  { 
    id: 'elywar', 
    title: 'Elywar', 
    type: 'Game', 
    isExclusive: true, 
    tag: 'Battle Royale',
    bg: 'radial-gradient(circle at center, #0f766e 0%, #042f2e 100%)',
    art: 'bg-gradient-to-t from-black/80 to-transparent',
    icon: '🔮'
  },
  { 
    id: 'store', 
    title: 'Xakteir Store', 
    type: 'System', 
    isExclusive: false, 
    tag: 'App',
    bg: 'linear-gradient(to bottom right, #4c1d95, #000000)',
    art: '',
    icon: '🛍️'
  },
  { 
    id: 'settings', 
    title: 'Settings', 
    type: 'System', 
    isExclusive: false, 
    tag: 'App',
    bg: 'linear-gradient(to bottom right, #334155, #0f172a)',
    art: '',
    icon: '⚙️'
  }
];

export default function HomeScreen({ selectedIndex }: { selectedIndex: number }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-16 text-white overflow-hidden mesh-background">
      {/* Dark overlay to make UI readable over mesh */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"></div>

      <div className="relative z-10 flex justify-between items-end mb-10 w-full max-w-6xl mx-auto">
        <div>
          <h2 className="text-teal-400 font-bold uppercase tracking-widest text-xs mb-1">VoltraOS</h2>
          <h1 className="text-5xl font-light text-white/90 tracking-[0.1em] uppercase">My Library</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="font-bold text-lg leading-none">Ridwan</div>
                <div className="text-teal-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Online</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 border-2 border-white/20 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
        </div>
      </div>
      
      <div className="relative z-10 flex gap-8 items-center w-full max-w-6xl mx-auto">
        {games.map((game, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <motion.div
              key={game.id}
              animate={{
                scale: isSelected ? 1.08 : 0.9,
                opacity: isSelected ? 1 : 0.5,
                y: isSelected ? -15 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`relative rounded-3xl w-64 h-[26rem] flex flex-col justify-end p-6 overflow-hidden transition-all duration-300 ${isSelected ? 'shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-20' : 'z-10'}`}
              style={{ background: game.bg }}
            >
              {/* Animated Glowing Border for Selected Card */}
              {isSelected && (
                <div className="absolute inset-0 rounded-3xl border-[3px] border-transparent" style={{ background: 'linear-gradient(135deg, #00e5ff, #9900ff) border-box', WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
              )}
              {!isSelected && (
                <div className="absolute inset-0 rounded-3xl border border-white/10"></div>
              )}

              {/* Game Art Pattern overlay */}
              <div className={`absolute inset-0 ${game.art} mix-blend-overlay`}></div>

              {/* Glassmorphism shine on top half */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none"></div>

              {game.isExclusive && (
                <div className="absolute top-5 left-5 bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-[10px] font-bold border border-teal-400/30 tracking-widest uppercase shadow-[0_0_10px_rgba(45,212,191,0.2)]">
                  Exclusive
                </div>
              )}

              <div className="relative z-10">
                <div className="text-5xl mb-4 drop-shadow-lg">{game.icon}</div>
                <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">{game.type}</div>
                <h2 className="text-3xl font-black leading-tight drop-shadow-xl text-white tracking-wide">{game.title}</h2>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
