'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { XakcodeUser, XakcodeSession, AuthState, XAKCODE_FEATURES } from '@/lib/xakcode-auth-config';

interface XakcodeAuthContextType {
  session: XakcodeSession;
  user: XakcodeUser | null;
  authState: AuthState;
  canAccessFeature: (feature: string) => boolean;
  connectGitHub: () => Promise<void>;
  disconnectGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const XakcodeAuthContext = createContext<XakcodeAuthContextType | undefined>(undefined);

export function XakcodeAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [session, setSession] = useState<XakcodeSession>({
    user: null,
    authState: 'none',
    isLoading: true,
  });

  // Load user profile on auth state change
  useEffect(() => {
    if (!firebaseUser || !firestore) {
      setSession(prev => ({
        ...prev,
        user: null,
        authState: 'none',
        isLoading: false,
      }));
      return;
    }

    const loadUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const xakcodeUser: XakcodeUser = {
            xakcodeId: firebaseUser.uid,
            xakcodeUsername: userData.username || firebaseUser.displayName || 'User',
            xakcodeEmail: firebaseUser.email || '',
            xakcodePhotoURL: firebaseUser.photoURL || userData.photoURL,
            githubConnected: !!userData.githubConnected,
            githubUsername: userData.githubUsername,
            githubId: userData.githubId,
            githubAvatarUrl: userData.githubAvatarUrl,
            githubEmail: userData.githubEmail,
            githubBio: userData.githubBio,
            githubPublicRepos: userData.githubPublicRepos,
            authState: userData.githubConnected ? 'full' : 'xakteir',
            connectedAt: userData.githubConnectedAt?.toDate(),
          };

          setSession(prev => ({
            ...prev,
            user: xakcodeUser,
            authState: xakcodeUser.authState,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setSession(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load profile',
        }));
      }
    };

    loadUserProfile();
  }, [firebaseUser, firestore]);

  const canAccessFeature = useCallback((feature: string): boolean => {
    if (XAKCODE_FEATURES.PUBLIC.includes(feature)) return true;
    if (session.authState === 'none') return false;
    if (XAKCODE_FEATURES.XAKTEIR_ONLY.includes(feature)) return true;
    if (XAKCODE_FEATURES.GITHUB_REQUIRED.includes(feature)) {
      return session.authState === 'full';
    }
    return false;
  }, [session.authState]);

  const connectGitHub = async () => {
    if (!firebaseUser || !firestore) throw new Error('User not authenticated');
    
    try {
      // Initiate GitHub OAuth flow
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem('xakcode_oauth_state', state);
      
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/api/xakcode/auth/github/callback`,
        scope: 'user:email,public_repo,repo,gist',
        state,
      });

      window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
    } catch (error) {
      console.error('Error connecting GitHub:', error);
      throw error;
    }
  };

  const disconnectGitHub = async () => {
    if (!firebaseUser || !firestore) throw new Error('User not authenticated');
    
    try {
      await updateDoc(doc(firestore, 'users', firebaseUser.uid), {
        githubConnected: false,
        githubUsername: null,
        githubId: null,
        githubAvatarUrl: null,
        githubEmail: null,
        githubBio: null,
        githubPublicRepos: null,
        githubAccessToken: null,
      });

      setSession(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          githubConnected: false,
          authState: 'xakteir',
        } : null,
        authState: 'xakteir',
      }));
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      setSession({
        user: null,
        authState: 'none',
        isLoading: false,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <XakcodeAuthContext.Provider
      value={{
        session,
        user: session.user,
        authState: session.authState,
        canAccessFeature,
        connectGitHub,
        disconnectGitHub,
        signOut,
        isLoading: session.isLoading,
      }}
    >
      {children}
    </XakcodeAuthContext.Provider>
  );
}

export function useXakcodeAuth() {
  const context = useContext(XakcodeAuthContext);
  if (!context) {
    throw new Error('useXakcodeAuth must be used within XakcodeAuthProvider');
  }
  return context;
}
