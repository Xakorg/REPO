import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { XakcodeAuthProvider } from '@/contexts/xakcode-auth-context';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OnboardingProvider } from '@/components/OnboardingProvider';
import { UpdateManager } from '@/components/UpdateManager';
import { CommandCenter } from '@/components/CommandCenter';
import { LockedAccountGuard } from '@/components/LockedAccountGuard';
import { NotificationManager } from '@/components/NotificationManager';
import { FocusModeListener } from '@/components/FocusModeListener';
import { DesktopBridge } from '@/components/desktop-bridge';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Xakteir',
  description: 'The simple platform for creation, gaming, and work.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${poppins.className} antialiased bg-[#05030d] min-h-screen overflow-x-hidden selection:bg-primary/20`}>
        <div className="mesh-background" aria-hidden="true" />
        <div className="fixed inset-0 arcade-grid opacity-10 pointer-events-none" aria-hidden="true" />

        <FirebaseProvider>
          <OnboardingProvider>
            <LockedAccountGuard>
              <FocusModeListener />
              <main className="relative z-10">
                {children}
              </main>
              <CommandCenter />
              <UpdateManager />
              <NotificationManager />
              <Toaster />
              <DesktopBridge />
            </LockedAccountGuard>
          </OnboardingProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
