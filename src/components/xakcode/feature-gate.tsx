'use client';

import { ReactNode } from 'react';
import { useXakcodeAuth } from '@/contexts/xakcode-auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Github, LogIn } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { canAccessFeature, authState, connectGitHub } = useXakcodeAuth();

  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback UI
  if (authState === 'none') {
    return (
      <Card className="glass-card p-8 border-white/10 bg-white/5 rounded-2xl">
        <div className="flex items-start gap-4">
          <LogIn className="w-6 h-6 text-primary mt-1" />
          <div className="flex-1 space-y-3">
            <h3 className="font-black text-white uppercase">Sign In Required</h3>
            <p className="text-white/60 text-sm">You need to sign in to Xakteir to use this feature.</p>
            <Button asChild className="w-full h-10 bg-primary text-black hover:bg-primary/90 rounded-lg font-black uppercase text-xs">
              <a href="/auth">Sign In</a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (authState === 'xakteir') {
    return (
      <Card className="glass-card p-8 border-white/10 bg-white/5 rounded-2xl">
        <div className="flex items-start gap-4">
          <Github className="w-6 h-6 text-primary mt-1" />
          <div className="flex-1 space-y-3">
            <h3 className="font-black text-white uppercase">GitHub Connection Required</h3>
            <p className="text-white/60 text-sm">Connect your GitHub account to unlock this feature.</p>
            <Button
              onClick={() => connectGitHub()}
              className="w-full h-10 bg-primary text-black hover:bg-primary/90 rounded-lg font-black uppercase text-xs"
            >
              <Github className="w-4 h-4 mr-2" />
              Connect GitHub
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
