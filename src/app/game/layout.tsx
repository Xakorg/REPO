"use client";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  // Always render the game full screen without the legacy breadcrumb/sidebar layout.
  // Global header/footer can be toggled by the user with the ALT key.
  return <main className="w-full h-screen bg-black overflow-hidden">{children}</main>;
}
