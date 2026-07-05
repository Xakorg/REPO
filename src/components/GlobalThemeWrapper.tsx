"use client";

import { useEffect, useState } from 'react';
import { useDoc, useFirestore } from '@/firebase/client-provider';
import { doc } from 'firebase/firestore';

export function GlobalThemeWrapper({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const systemSettingsRef = firestore ? doc(firestore, "system_settings", "global") : null;
  const { data: systemSettings } = useDoc(systemSettingsRef);

  if (!mounted || !systemSettings) {
    return <>{children}</>;
  }

  const globalTheme = systemSettings.globalTheme || "default";

  return (
    <>
      {globalTheme === 'matrix' && (
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-30 flex">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-1 text-green-500 font-mono text-xs overflow-hidden"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                animation: `matrix-fall ${Math.random() * 3 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            >
              {"10100101110010101100101".repeat(5)}
            </div>
          ))}
        </div>
      )}
      
      {globalTheme === 'cyberpunk' && (
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-20" style={{
          background: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 4px, 3px 100%',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
        }}></div>
      )}

      {/* Global CSS injections for themes */}
      {globalTheme === 'matrix' && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes matrix-fall {
            0% { transform: translateY(-100%); opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
          }
          body {
            background-color: #000 !important;
          }
        `}} />
      )}
      {globalTheme === 'cyberpunk' && (
        <style dangerouslySetInnerHTML={{__html: `
          body {
            background-color: #080014 !important;
          }
        `}} />
      )}

      {children}
    </>
  );
}
