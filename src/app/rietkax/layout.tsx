import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Rietkax Dimension | Mirror Protocol',
  description: 'Logic Inverse Encounter',
};

export default function RietkaxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black antialiased overflow-hidden selection:bg-rose-500">
        {children}
      </body>
    </html>
  );
}