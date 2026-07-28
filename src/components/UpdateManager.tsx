"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ChevronRight, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UpdateAnnouncement {
  id: string;
  appName: string;
  featureTitle: string;
  description: string;
  targetPath: string;
  icon: any;
}

const UPDATES: UpdateAnnouncement[] = [
  {
    id: 'update-whiteboard',
    appName: 'Whiteboard',
    featureTitle: 'Collaborative Canvas',
    description: 'You can now plan and draw together with friends on an infinite live canvas.',
    targetPath: '/whiteboard',
    icon: Star
  },
  {
    id: 'update-suite',
    appName: 'Xakteir Suite',
    featureTitle: 'Powerful Documents',
    description: 'Manage all your documents, sheets, and presentations in one easy spot.',
    targetPath: '/suite',
    icon: Zap
  }
];

export function UpdateManager() {
  const [activeUpdate, setActiveUpdate] = useState<UpdateAnnouncement | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for unseen updates globally or via events
    const checkUpdates = (e: any) => {
      const updateId = e.detail?.updateId;
      if (updateId) {
        const update = UPDATES.find(u => u.id === updateId);
        if (update && !localStorage.getItem(update.id)) {
          setActiveUpdate(update);
        } else if (update) {
          // If already seen, just go there
          window.location.href = update.targetPath;
        }
      }
    };

    window.addEventListener('show-hub-update', checkUpdates);
    return () => window.removeEventListener('show-hub-update', checkUpdates);
  }, [router]);

  const handleTryNow = () => {
    if (activeUpdate) {
      localStorage.setItem(activeUpdate.id, 'true');
      window.location.href = activeUpdate.targetPath;
      setActiveUpdate(null);
    }
  };

  const close = () => setActiveUpdate(null);

  if (!activeUpdate) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-lg glass-card rounded-[3rem] p-10 border-4 border-white/10 shadow-2xl relative overflow-hidden update-popup bg-[#0a0a15]">
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
        
        <button onClick={close} className="absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl animate-float">
            <activeUpdate.icon className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">New Update Available</span>
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
              {activeUpdate.appName}
            </h2>
            <p className="text-xl font-bold text-foreground italic">
              {activeUpdate.featureTitle}
            </p>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
              {activeUpdate.description}
            </p>
          </div>

          <Button 
            onClick={handleTryNow}
            className="w-full h-18 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 border-b-8 border-primary/20 active:border-b-0"
          >
            Try Now <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function triggerUpdate(updateId: string) {
  window.dispatchEvent(new CustomEvent('show-hub-update', { detail: { updateId } }));
}
