import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoltraPlay OS',
  description: 'Secret Xakteir Hardware Simulation',
}

export default function VoltraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex items-center justify-center font-sans z-[9999]">
      <div className="mesh-background absolute inset-0 z-0 opacity-70"></div>
      
      {/* Hardware Screen Bezels Simulation (7-inch display 16:9) */}
      <div className="relative w-[1280px] h-[720px] bg-black/40 rounded-[3rem] overflow-hidden border-[16px] border-zinc-950 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col z-10 backdrop-blur-md">
        
        {/* Top Status Bar */}
        <div className="flex justify-between items-center p-6 text-sm font-semibold tracking-wider text-white/90">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 border-2 border-white/20 shadow-lg"></div>
            <span className="text-lg">Ridwan <span className="text-teal-300 ml-2">Lv.67</span></span>
          </div>
          <div className="flex items-center gap-6 text-lg">
            <span>Wi-Fi 7</span>
            <span>98% 🔋</span>
            <span>12:00 PM</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative">
          {children}
        </div>

        {/* Bottom Controller Hints */}
        <div className="p-6 flex justify-end gap-8 text-sm font-bold text-white/60">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-red-500/80 border border-red-400 text-white flex items-center justify-center text-xs shadow-md">B</span> Back
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-green-500/80 border border-green-400 text-white flex items-center justify-center text-xs shadow-md">A</span> Select
          </div>
        </div>
      </div>
    </div>
  )
}
