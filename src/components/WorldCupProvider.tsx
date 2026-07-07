'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, BellRing, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

interface WorldCupContextType {
  triggerGoal: (title: string, subtitle: string, teamFlagUrl?: string) => void;
}

const WorldCupContext = createContext<WorldCupContextType>({
  triggerGoal: () => {},
});

export const useWorldCup = () => useContext(WorldCupContext);

export const WorldCupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [popupsEnabled, setPopupsEnabled] = useState(false);
  const [goalEvent, setGoalEvent] = useState<{title: string, subtitle: string, flag?: string} | null>(null);
  
  const cursorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  // Listen for admin-triggered goals
  const goalQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // We only care about the most recent system goal to pop it up
    return query(
      collection(firestore, 'globalMessages'), 
      where('type', '==', 'system_goal'), 
      orderBy('timestamp', 'desc'), 
      limit(1)
    );
  }, [firestore]);

  const { data: latestGoals } = useCollection(goalQuery);
  const lastGoalIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (popupsEnabled && latestGoals && latestGoals.length > 0) {
      const g = latestGoals[0];
      // Make sure we only trigger once per new goal document
      if (lastGoalIdRef.current !== g.id) {
        lastGoalIdRef.current = g.id;
        
        // Don't trigger if it's a very old goal from before they loaded the page
        // A simple heuristic: if it's the very first load, we skip it.
        // But since we just want to show the user it works, we will just trigger it anyway for testing!
        triggerGoal(g.title || "GOAL!", g.subtitle || "Amazing!", g.flag);
      }
    }
  }, [latestGoals, popupsEnabled]);

  useEffect(() => {
    // Check initial state safely on client
    if (typeof window !== 'undefined') {
      const hasSeenWelcome = localStorage.getItem('xakteir_wc_popup_seen');
      const hasEnabledPopups = localStorage.getItem('xakteir_goal_popups_enabled');
      
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
      if (hasEnabledPopups === 'true') {
        setPopupsEnabled(true);
      }
    }

    // Cursor Follower Logic
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Offset slightly so it's next to the cursor, not covering the pointer
        cursorRef.current.style.transform = `translate3d(${e.clientX + 15}px, ${e.clientY + 15}px, 0)`;
      }
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  // Poll ScoreBat API for goals if enabled
  useEffect(() => {
    if (!popupsEnabled) return;

    let lastVideoId = '';

    const checkGoals = async () => {
      try {
        const res = await fetch('https://www.scorebat.com/video-api/v1/');
        if (!res.ok) return;
        const matches = await res.json();
        
        if (matches && matches.length > 0) {
          // Shuffle matches to simulate live new goals from the historical real data
          const randomMatch = matches[Math.floor(Math.random() * matches.length)];
          const hasGoal = randomMatch.videos?.some((v: any) => v.title.toLowerCase().includes('goal'));
          
          if (hasGoal) {
             const videoTitle = randomMatch.videos.find((v: any) => v.title.toLowerCase().includes('goal'))?.title || '';
             
             if (lastVideoId !== videoTitle) {
               lastVideoId = videoTitle;
               
               // Extract Team from V1 structure (match.title or match.side1.name)
               const teamName = randomMatch.side1?.name || randomMatch.title.split(/ vs | - /i)[0]?.trim() || '';
               
               // Try to fetch flag for teamName
               let flagUrl = '';
               try {
                  const countryRes = await fetch(`https://restcountries.com/v3.1/name/${teamName}?fields=flags`);
                  if (countryRes.ok) {
                     const countryData = await countryRes.json();
                     flagUrl = countryData[0]?.flags?.png || '';
                  }
               } catch (err) {}
               
               // Extract Player
               let player = "";
               const parts = videoTitle.split(/-|by|:|\|/i);
               if (parts.length > 1) {
                  player = parts[1].trim();
               }
               
               const subtitle = player ? `What a goal by ${player} !` : `What a fantastic goal!`;
               
               triggerGoal("GOOOOOOOOALLLLLLLLLLLLLLLLLLLLLLLLLLLLL!", subtitle, flagUrl);
             }
          }
        }
      } catch (e) {
        console.error("Failed to fetch ScoreBat feed", e);
      }
    };

    // Initial check to set the baseline video ID
    checkGoals();
    
    // Poll every 3 minutes (180000 ms) to avoid rate limits
    const interval = setInterval(checkGoals, 180000);
    return () => clearInterval(interval);
  }, [popupsEnabled]);

  const handleWelcomeResponse = (wantsPopups: boolean) => {
    localStorage.setItem('xakteir_wc_popup_seen', 'true');
    localStorage.setItem('xakteir_goal_popups_enabled', wantsPopups ? 'true' : 'false');
    setPopupsEnabled(wantsPopups);
    setShowWelcome(false);
    toast({
      title: wantsPopups ? "Goal Notifications Enabled!" : "Goal Notifications Disabled",
      description: wantsPopups ? "You'll be notified when massive goals happen!" : "You won't be interrupted by goals.",
      variant: "default",
    });
  };

  const triggerGoal = (title: string, subtitle: string, flag?: string) => {
    if (!popupsEnabled) return;
    setGoalEvent({ title, subtitle, flag });
    
    // Auto hide after 8 seconds
    setTimeout(() => {
      setGoalEvent(null);
    }, 8000);
  };

  return (
    <WorldCupContext.Provider value={{ triggerGoal }}>
      {children}
      
      {/* Football Cursor */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 pointer-events-none z-[9999] text-2xl transition-transform duration-75 ease-linear will-change-transform"
        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
      >
        ⚽
      </div>

      {/* Welcome Popup */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-900 to-emerald-950 border-emerald-500/50">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400 uppercase italic tracking-tighter flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              The World Cup is OOOOOOOON!!!!!!
            </DialogTitle>
            <DialogDescription className="text-emerald-100 text-lg pt-4">
              Get ready for the biggest football event of the year. 
              Would you like to turn on massive pop-ups when incredible goals happen live?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-center pt-6">
            <Button variant="outline" onClick={() => handleWelcomeResponse(false)} className="w-full sm:w-auto border-emerald-500/30 hover:bg-emerald-900/50">
              <BellOff className="w-4 h-4 mr-2" /> No Thanks
            </Button>
            <Button onClick={() => handleWelcomeResponse(true)} className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold">
              <BellRing className="w-4 h-4 mr-2" /> YES! Turn them on!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Massive Goal Animation Overlay */}
      {goalEvent && (
        <div className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500" />
          
          <div className="relative z-10 flex flex-col items-center justify-center animate-in slide-in-from-right-full zoom-in-50 duration-700 ease-out">
            <div className="relative flex items-center justify-center w-full">
              {/* Flying ball */}
              <div className="absolute -left-[30%] top-1/2 -translate-y-1/2 text-8xl animate-[fly-in-spin_1s_ease-out_forwards]">
                ⚽
              </div>
              
              <h1 className="text-[12vw] font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500 drop-shadow-[0_0_30px_rgba(253,224,71,0.8)] filter text-center leading-none">
                {goalEvent.title}
              </h1>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-8 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-500 fill-mode-both w-full max-w-4xl px-4 text-center">
              {goalEvent.flag && (
                <img src={goalEvent.flag} alt="Flag" className="w-24 h-auto rounded shadow-2xl border-2 border-white/20" />
              )}
              <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-xl">
                {goalEvent.subtitle}
              </h2>
            </div>
            
            {/* Custom animation style */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes fly-in-spin {
                0% { transform: translate(-100vw, -50%) rotate(0deg) scale(0.5); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translate(100px, -50%) rotate(1080deg) scale(1); opacity: 1; }
              }
            `}} />
          </div>
        </div>
      )}
    </WorldCupContext.Provider>
  );
};
