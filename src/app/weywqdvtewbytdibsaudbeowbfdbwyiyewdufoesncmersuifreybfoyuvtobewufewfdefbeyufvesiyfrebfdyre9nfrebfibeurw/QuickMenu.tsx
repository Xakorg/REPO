"use client";
import { motion } from 'framer-motion';

export default function QuickMenu({ selectedIndex }: { selectedIndex: number }) {
  const menuItems = ['Friends', 'Party Chat', 'Performance', 'Settings', 'Power'];
  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: '100%', opacity: 0 }} 
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute right-0 top-0 h-full w-[40%] bg-black/60 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col p-6 text-white z-50"
    >
      <div className="flex items-center gap-4 mb-8">
         <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 border-2 border-white/20 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
         <div>
           <div className="font-bold text-lg leading-none">Ridwan</div>
           <div className="text-teal-400 text-xs font-bold mt-1 uppercase tracking-widest">Online • Lv.67</div>
         </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {menuItems.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div 
              key={item} 
              className={`p-4 rounded-xl flex items-center justify-between transition-all duration-200 ${isSelected ? 'bg-white/15 border-l-4 border-teal-400 pl-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' : 'bg-white/5 border-l-4 border-transparent pl-4 opacity-60'}`}
            >
              <span className="font-semibold text-sm">{item}</span>
              {isSelected && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.8)]"></span>}
            </div>
          )
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-white/10 flex justify-between text-[10px] text-white/50 font-bold uppercase tracking-widest">
        <span>12:00 PM</span>
        <span>98% Battery</span>
      </div>
    </motion.div>
  );
}
