"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // App routes include chat, code, and game pages where we want a full-screen experience
  const isAppRoute = pathname?.startsWith("/chat") ||
                     pathname?.startsWith("/xakcode") ||
                     pathname?.startsWith("/xaksports") || 
                     pathname?.startsWith("/xakarena") || 
                     pathname?.startsWith("/games/play/") ||
                     pathname?.startsWith("/games/retro") ||
                     pathname?.startsWith("/games/neural_defense");

  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!isAppRoute) {
      setShowOverlay(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Reveal if cursor is within 50px of the top edge
      if (e.clientY < 50) {
        setShowOverlay(true);
      } else if (e.clientY > 160 && e.clientY < window.innerHeight - 100) { 
        // Hide if mouse moves away from header/interaction area and is not near the bottom footer
        setShowOverlay(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isAppRoute]);

  return (
    <>
      {isAppRoute && (
        /* Subtle tap/hover trigger tab at top center of screen */
        <div 
          onClick={() => setShowOverlay(prev => !prev)}
          onMouseEnter={() => setShowOverlay(true)}
          className="fixed top-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-white/5 hover:bg-primary/45 transition-all rounded-b-xl z-[1000] cursor-pointer flex items-center justify-center pointer-events-auto border-x border-b border-white/10 group"
        >
          <div className="w-6 h-1 bg-white/20 rounded-full group-hover:bg-white/60 transition-colors" />
        </div>
      )}
      
      <div 
        className={isAppRoute ? `fixed top-0 left-0 right-0 z-[500] transition-all duration-300 transform ${
          showOverlay ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }` : ""}
        onMouseEnter={isAppRoute ? () => setShowOverlay(true) : undefined}
        onMouseLeave={isAppRoute ? () => setShowOverlay(false) : undefined}
      >
        <Header />
      </div>

      <main className={`relative z-10 ${isAppRoute ? "w-full h-screen overflow-hidden" : ""}`}>
        {children}
      </main>

      <div 
        className={isAppRoute ? `fixed bottom-0 left-0 right-0 z-[500] transition-all duration-300 transform ${
          showOverlay ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }` : ""}
        onMouseEnter={isAppRoute ? () => setShowOverlay(true) : undefined}
        onMouseLeave={isAppRoute ? () => setShowOverlay(false) : undefined}
      >
        <Footer />
      </div>
    </>
  );
}
