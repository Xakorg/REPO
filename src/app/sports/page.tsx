'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, PlayCircle, Loader2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Video {
  title: string;
  embed: string;
}

interface Match {
  title: string;
  competition: string;
  matchviewUrl: string;
  thumbnail: string;
  date: string;
  videos: Video[];
}

export default function SportsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-500 relative min-h-screen">
      
      {/* Dynamic background effect */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-yellow-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      <div className="flex flex-col gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/20 rounded-2xl ring-1 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Trophy className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-yellow-400">
              Live Sports Hub
            </h1>
            <p className="text-emerald-100/70 text-lg">Watch real live highlights and goals from top leagues.</p>
          </div>
        </div>
      </div>

      <div className="w-full bg-black/40 border border-emerald-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <iframe 
          src="https://www.scorebat.com/embed/" 
          frameBorder="0" 
          allowFullScreen 
          allow="autoplay; fullscreen" 
          className="w-full h-[80vh]"
        />
      </div>
    </div>
  );
}
