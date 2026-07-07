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
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('https://www.scorebat.com/video-api/v3/feed/');
        const data = await res.json();
        setMatches(data.response || []);
      } catch (error) {
        console.error('Failed to fetch sports data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const categories = Array.from(new Set(matches.map(m => m.competition))).slice(0, 5); // top 5 categories for filtering

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-500 relative">
      
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
        
        {/* Categories (Mock filters for UI purposes) */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-4 py-1 cursor-pointer">
            All Matches
          </Badge>
          {categories.map((cat, i) => (
            <Badge key={i} variant="outline" className="border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/10 text-sm px-4 py-1 cursor-pointer transition-colors">
              {cat}
            </Badge>
          ))}
          <Badge variant="outline" className="border-yellow-500/30 text-yellow-100 hover:bg-yellow-500/10 text-sm px-4 py-1 cursor-pointer transition-colors">
            FIFA WC 2026
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
          <p className="text-emerald-200/60 animate-pulse">Loading live matches...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {matches.slice(0, 24).map((match, i) => (
            <Card 
              key={i} 
              className="bg-black/40 border-emerald-500/20 backdrop-blur-xl hover:border-emerald-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] group overflow-hidden cursor-pointer"
              onClick={() => setSelectedMatch(match)}
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={match.thumbnail} 
                  alt={match.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
                  <PlayCircle className="w-16 h-16 text-emerald-400 drop-shadow-2xl" />
                </div>
                <Badge className="absolute top-3 left-3 bg-red-500 text-white border-none font-bold shadow-lg uppercase tracking-wider text-xs">
                  {match.videos.some(v => v.title.toLowerCase().includes('goal')) ? 'GOAL!' : 'HIGHLIGHT'}
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="text-xs font-semibold text-emerald-400 mb-2 truncate">
                  {match.competition}
                </div>
                <h3 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2 group-hover:text-emerald-300 transition-colors">
                  {match.title}
                </h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-white/40">
                    {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </span>
                  <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-0 h-auto font-semibold">
                    Watch <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-4xl bg-black border-emerald-500/30 p-0 overflow-hidden">
          {selectedMatch && (
            <>
              <DialogHeader className="p-6 pb-0 absolute top-0 left-0 right-0 z-10 pointer-events-none">
                <DialogTitle className="text-2xl font-bold text-white drop-shadow-md">
                  {selectedMatch.title}
                </DialogTitle>
                <DialogDescription className="text-emerald-400 font-semibold drop-shadow-md">
                  {selectedMatch.competition}
                </DialogDescription>
              </DialogHeader>
              
              <div className="w-full bg-zinc-950 aspect-video pt-20">
                 {/* 
                   ScoreBat embed code provided in their API. 
                   We safely inject it.
                 */}
                 <div 
                   className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                   dangerouslySetInnerHTML={{ __html: selectedMatch.videos[0]?.embed || '' }}
                 />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
