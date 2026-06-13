"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function OverlayPage() {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Make the background transparent in CSS
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";

    // Listen for IPC events
    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.onSetListeningState((state: boolean) => {
        setIsListening(state);
      });
    }

    // For testing/preview locally in browser (mocking)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "l" && e.altKey) setIsListening((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out border-[8px]",
          isListening 
            ? "border-cyan-500/80 shadow-[inset_0_0_100px_rgba(6,182,212,0.5),0_0_100px_rgba(6,182,212,0.5)] bg-cyan-500/5" 
            : "border-transparent opacity-0"
        )}
      />
    </div>
  );
}
