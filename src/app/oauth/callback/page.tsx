"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.push('/profile');
      return;
    }

    const signIn = async () => {
      try {
        await signInWithCustomToken(auth, token);
        toast({ title: 'Success', description: 'Signed in successfully via Discord.' });
        router.push('/profile'); // or wherever they should go after login
      } catch (error: any) {
        console.error('Sign in with custom token failed:', error);
        toast({ variant: 'destructive', title: 'Sign In Failed', description: error.message });
        router.push('/profile');
      }
    };

    signIn();
  }, [searchParams, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-bold uppercase tracking-widest text-white/50">Completing Sign In...</p>
      </div>
    </div>
  );
}
