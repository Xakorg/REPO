'use client';

import { useXakcodeAuth } from '@/contexts/xakcode-auth-context';
import { Badge } from '@/components/ui/badge';
import { Github, CheckCircle2, AlertCircle } from 'lucide-react';

export function AuthStatusBadge() {
  const { authState, user } = useXakcodeAuth();

  if (authState === 'none') {
    return (
      <Badge variant="outline" className="border-white/20 bg-white/5 text-white/70">
        <AlertCircle className="w-3 h-3 mr-1" />
        Not Signed In
      </Badge>
    );
  }

  if (authState === 'xakteir') {
    return (
      <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Xakteir Connected
      </Badge>
    );
  }

  if (authState === 'full') {
    return (
      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
        <Github className="w-3 h-3 mr-1" />
        GitHub Connected
      </Badge>
    );
  }

  return null;
}
