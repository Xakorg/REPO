import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VoltraStore',
  description: 'The official marketplace for VoltraOS.',
};

export default function VoltraStoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-3xl border-b border-white/5 h-20 flex items-center px-8 justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-2xl font-black uppercase italic tracking-tighter hover:text-purple-400 transition-colors">
            Voltra<span className="text-purple-500">Store</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-bold text-sm tracking-widest uppercase">
            <Link href="#" className="text-white">Discover</Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">Games</Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">Productivity</Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">Creators</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <input 
            type="text" 
            placeholder="Search VoltraStore..." 
            className="hidden md:block w-64 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-black text-purple-400">
            X
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
