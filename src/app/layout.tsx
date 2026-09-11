import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { XakcodeAuthProvider } from '@/contexts/xakcode-auth-context';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Xakcode - Code Editor',
  description: 'Code with style. Edit, create, and manage repositories on Xakcode.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <FirebaseProvider>
          <XakcodeAuthProvider>
            {children}
            <Toaster />
          </XakcodeAuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
