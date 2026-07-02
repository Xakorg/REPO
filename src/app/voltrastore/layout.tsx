import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VoltraStore',
  description: 'The official marketplace for VoltraOS.',
};

export default function VoltraStoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {children}
    </div>
  );
}
