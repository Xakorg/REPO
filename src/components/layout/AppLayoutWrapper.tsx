"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // App routes include code where we want a full-screen experience with an auto-hide header
  const isAppRoute = pathname?.startsWith("/xakcode") ||
                     pathname?.startsWith("/xaksports");
                     
  const isChatRoute = pathname?.startsWith("/chat");

  // Standalone routes completely hide the global header/footer mechanics
  const isStandaloneRoute = pathname?.startsWith("/xakarena") || 
                            pathname?.startsWith("/xakarena-creator");

  const [showOverlay, setShowOverlay] = useState(false);
  const [altToggled, setAltToggled] = useState(false);

  // If it's a standalone route, render nothing but the children in a full screen container
  if (isStandaloneRoute) {
    return <main className="relative z-10 w-full h-screen overflow-hidden">{children}</main>;
  }

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        // Prevent default browser menu focus if possible
        e.preventDefault();
        setAltToggled(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {altToggled && (
        <style dangerouslySetInnerHTML={{ __html: `
          .mesh-background, .arcade-grid, svg.absolute { display: none !important; }
          body { background: #05030d !important; }
        `}} />
      )}
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
        className={isAppRoute ? `hidden md:block fixed top-0 left-0 right-0 z-[500] transition-all duration-300 transform ${
          (showOverlay || altToggled) ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }` : `hidden md:block transition-all duration-300 ${
          altToggled ? "hidden" : "translate-y-0 opacity-100"
        }`}
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
          (showOverlay || altToggled) ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }` : `transition-all duration-300 ${
          isChatRoute || altToggled ? "hidden" : "translate-y-0 opacity-100"
        }`}
        onMouseEnter={isAppRoute ? () => setShowOverlay(true) : undefined}
        onMouseLeave={isAppRoute ? () => setShowOverlay(false) : undefined}
      >
        <Footer />
      </div>

      <MobileBottomNav />
    </>
  );
}
