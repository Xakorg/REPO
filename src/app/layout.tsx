
import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { OnboardingProvider } from '@/components/OnboardingProvider';
import { UpdateManager } from '@/components/UpdateManager';
import { CommandCenter } from '@/components/CommandCenter';
import { LockedAccountGuard } from '@/components/LockedAccountGuard';
import { TimeTravelOverlay } from '@/components/TimeTravelOverlay';
import { NotificationManager } from '@/components/NotificationManager';
import { FocusModeListener } from '@/components/FocusModeListener';
import { DesktopBridge } from '@/components/desktop-bridge';
import { FaviconController } from '@/components/layout/FaviconController';
import { MaintenanceModeGuard } from '@/components/MaintenanceModeGuard';

import { GlobalThemeWrapper } from '@/components/GlobalThemeWrapper';
import { WorldCupProvider } from '@/components/WorldCupProvider';

export const metadata: Metadata = {
  title: 'Xakteir',
  description: 'The simple platform for creation, gaming, and work.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#05030d] min-h-screen overflow-x-hidden selection:bg-primary/20">
        <div className="mesh-background" aria-hidden="true" />
        <div className="fixed inset-0 arcade-grid opacity-10 pointer-events-none" aria-hidden="true" />
        
        {/* Global animated SVG gradient for mesh logo effects */}
        <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id="mesh-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="mesh-stop-1" />
              <stop offset="50%" className="mesh-stop-2" />
              <stop offset="100%" className="mesh-stop-3" />
            </linearGradient>
          </defs>
        </svg>

        <FirebaseClientProvider>
          <GlobalThemeWrapper>
            <WorldCupProvider>
              <OnboardingProvider>
                <LockedAccountGuard>
                  <MaintenanceModeGuard>
                    <FocusModeListener />
                    <FaviconController />
                    <AppLayoutWrapper>
                      {children}
                    </AppLayoutWrapper>
                    <CommandCenter />
                    <UpdateManager />
                    <NotificationManager />
                    <TimeTravelOverlay />
                    <FirebaseErrorListener />
                    <Toaster />
                    <DesktopBridge />
                  </MaintenanceModeGuard>
                </LockedAccountGuard>
              </OnboardingProvider>
            </WorldCupProvider>
          </GlobalThemeWrapper>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
