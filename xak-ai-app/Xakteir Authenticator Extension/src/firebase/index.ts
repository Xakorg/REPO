'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Robust Firebase initialization.
 * Explicitly uses the local configuration to avoid initialization errors
 * and silence "no-options" warnings in development.
 */
export function initializeFirebase() {
  const apps = getApps();
  const firebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  
  const sdks = getSdks(firebaseApp);
  
  // Ensure the user stays signed in across browser restarts
  setPersistence(sdks.auth, browserLocalPersistence).catch(() => {
    // Silent catch for persistence errors to prevent boot interruptions
  });

  return sdks;
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

// Re-export all hooks and the provider from provider.tsx
export * from './provider';

// Explicitly re-export Firestore hooks
export * from './firestore/use-collection';
export * from './firestore/use-doc';

// Explicitly re-export helper utilities
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
