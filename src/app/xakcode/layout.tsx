'use client';

import { XakCodeProvider } from "./context";

export default function XakcodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <XakCodeProvider>
      <div className="min-h-screen bg-black">
        {children}
      </div>
    </XakCodeProvider>
  );
}
