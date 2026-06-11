
"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowRight, 
  ChevronRight,
  MousePointer2
} from 'lucide-react';

type OnboardingStep = 
  | 'welcome' 
  | 'intro' 
  | 'games' 
  | 'studio' 
  | 'buddy' 
  | 'ai' 
  | 'launcher' 
  | 'finished';

interface OnboardingContextType {
  startTutorial: () => void;
  activeStep: OnboardingStep | null;
  completeAction: (step: OnboardingStep) => void;
  hasInteracted: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [activeStep, setActiveStep] = useState<OnboardingStep | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const router = useRouter();

  const startTutorial = () => {
    setActiveStep('welcome');
    setHasInteracted(false);
    router.push('/');
  };

  const completeAction = useCallback((step: string) => {
    if (activeStep === step) {
      setHasInteracted(true);
    }
  }, [activeStep]);

  const nextStep = () => {
    setHasInteracted(false);
    if (activeStep === 'welcome') setActiveStep('intro');
    else if (activeStep === 'intro') {
      setActiveStep('games');
      router.push('/games');
    }
    else if (activeStep === 'games') {
      setActiveStep('studio');
      router.push('/games/studio');
    }
    else if (activeStep === 'studio') {
      setActiveStep('buddy');
      router.push('/buddy');
    }
    else if (activeStep === 'buddy') {
      setActiveStep('ai');
      router.push('/ai-chat');
    }
    else if (activeStep === 'ai') {
      setActiveStep('launcher');
      router.push('/');
    }
    else if (activeStep === 'launcher') setActiveStep(null);
  };

  const skip = () => setActiveStep(null);

  return (
    <OnboardingContext.Provider value={{ startTutorial, activeStep, completeAction, hasInteracted }}>
      {children}
      {activeStep && (
        <div className="fixed inset-0 z-[1000] pointer-events-none flex items-end justify-center p-10">
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          
          <Card className="w-full max-w-2xl glass-card border-4 border-white/20 rounded-[3rem] p-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)] pointer-events-auto relative animate-in slide-in-from-bottom-10 duration-500">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
               <div className="w-8 h-8 rounded-full bg-primary animate-ping" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                {activeStep === 'welcome' && (
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-foreground">Welcome to Xakteir!</h2>
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-60">Your journey begins now.</p>
                  </div>
                )}

                {activeStep === 'intro' && (
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Endless Possibilities</h3>
                    <p className="text-sm text-muted-foreground font-medium">With Xakteir, you can play games, watch videos, chat with AI, and so much more!</p>
                  </div>
                )}

                {activeStep === 'games' && (
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Game Center</h3>
                    <p className="text-sm text-muted-foreground font-medium">This is the Game Center. There are many games, from snake to 3D racing! Go ahead and try one.</p>
                  </div>
                )}

                {activeStep === 'studio' && (
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Game Studio</h3>
                    <p className="text-sm text-muted-foreground font-medium">Build your own games! Here are your blocks. Try dragging a block into the workspace.</p>
                  </div>
                )}

                {activeStep === 'buddy' && (
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Meet Buddies</h3>
                    <p className="text-sm text-muted-foreground font-medium">Feed your buddies every day and play with them and other people's pets in the Online Park!</p>
                  </div>
                )}

                {activeStep === 'ai' && (
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">AI Chat</h3>
                    <p className="text-sm text-muted-foreground font-medium">Chat with it! It can create code, send files, create images, and more.</p>
                  </div>
                )}

                {activeStep === 'launcher' && (
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Launcher</h3>
                    <p className="text-sm text-muted-foreground font-medium">These are your apps. We have lots of apps, from XakView to Xakteir Plan. Be creative and have fun!</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 items-center shrink-0">
                <Button onClick={skip} variant="ghost" className="h-14 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skip</Button>
                {(!hasInteracted && activeStep !== 'welcome' && activeStep !== 'intro' && activeStep !== 'launcher') ? (
                  <div className="flex items-center gap-3 px-6 py-4 bg-primary/10 rounded-2xl border-2 border-primary/20 animate-pulse">
                    <MousePointer2 className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-black uppercase text-primary italic">Try it now...</span>
                  </div>
                ) : (
                  <Button onClick={nextStep} className="h-16 px-10 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl animate-in zoom-in-95">
                    {activeStep === 'welcome' ? 'Next' : activeStep === 'intro' ? 'Start Tutorial' : activeStep === 'launcher' ? 'Finish' : 'Continue'} <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
}
