"use client";

import React from 'react';
import { MailQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { navigateTo } from '@/lib/navigation';

export default function EmailsComingSoon() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col items-center justify-center p-10 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <Button variant="ghost" onClick={() => navigateTo('/dev-centre', router)} className="absolute top-10 left-10 text-white/40 hover:text-white rounded-xl group">
         <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dev Centre
      </Button>

      <div className="z-10 flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-3xl bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-pulse">
           <MailQuestion className="w-16 h-16 text-blue-400" />
        </div>
        
        <h1 className="text-7xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600 mb-6 drop-shadow-2xl">
          Coming Soon
        </h1>
        
        <p className="text-2xl font-bold text-white/60 mb-4 tracking-tight">
          We're still sorting through our spam folder! 🗑️
        </p>
        
        <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-500/50">
          Work In Progress
        </p>
      </div>
    </div>
  );
}
