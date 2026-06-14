"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGameRoute = pathname?.startsWith("/xaksports");

  return (
    <>
      {!isGameRoute && <Header />}
      <main className={`relative z-10 ${isGameRoute ? "w-full h-screen overflow-hidden" : ""}`}>
        {children}
      </main>
      {!isGameRoute && <Footer />}
    </>
  );
}
