import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Xakteir Pro Installer',
  description: 'Setup Wizard for Xakteir Hub Pro',
};

export default function InstallerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] antialiased overflow-hidden selection:bg-primary/30">
        <div className="fixed inset-0 bg-[url('https://picsum.photos/seed/desktop/1920/1080')] bg-cover bg-center opacity-20 blur-sm pointer-events-none" />
        <div className="fixed inset-0 arcade-grid opacity-10 pointer-events-none" />
        <main className="relative z-10 h-screen w-screen flex items-center justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}
