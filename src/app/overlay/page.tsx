"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export default function OverlayPage() {
  const [isListening, setIsListening] = useState(false);
  const [isGlowActive, setIsGlowActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  const hotword = "hey xak";

  useEffect(() => {
    // Make the background transparent in CSS
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";

    // Initialize global background SpeechRecognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        
        rec.onstart = () => setIsListening(true);
        
        let finalTranscriptBuffer = '';
        let glowTimeout: any = null;
        
        rec.onend = () => {
          setIsListening(false);
          // Always restart for global background listening
          setTimeout(() => {
            try { rec.start(); } catch(e) {}
          }, 300);
        };
        
        rec.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          const currentText = (finalTranscript || interimTranscript).toLowerCase();
          
          // If glow is active, capture the actual command
          if (isGlowActive) {
            if (finalTranscript.trim().length > 0) {
               finalTranscriptBuffer += finalTranscript + " ";
               
               clearTimeout(glowTimeout);
               glowTimeout = setTimeout(() => {
                 setIsGlowActive(false);
                 if ((window as any).electron) {
                   (window as any).electron.invoke('wake-xak', finalTranscriptBuffer.trim());
                 }
                 finalTranscriptBuffer = '';
               }, 1000);
            }
            return;
          }

          // Check for wake word
          if (currentText.includes(hotword)) {
            setIsGlowActive(true);
            finalTranscriptBuffer = '';
            
            // Check if they said something immediately after the wake word
            const query = currentText.split(hotword)[1]?.trim();
            if (query && query.length > 2) {
               finalTranscriptBuffer = query;
               clearTimeout(glowTimeout);
               glowTimeout = setTimeout(() => {
                 setIsGlowActive(false);
                 if ((window as any).electron) {
                   (window as any).electron.invoke('wake-xak', finalTranscriptBuffer.trim());
                 }
                 finalTranscriptBuffer = '';
               }, 1000);
            } else {
               // Give them a few seconds to speak after wake word
               clearTimeout(glowTimeout);
               glowTimeout = setTimeout(() => {
                 setIsGlowActive(false);
               }, 5000);
            }
          }
        };
        
        recognitionRef.current = rec;
        try { rec.start(); } catch(e) {}
      }

      // Listen for explicit IPC state sets if needed
      if ((window as any).electron) {
        (window as any).electron.onSetListeningState((state: boolean) => {
          setIsGlowActive(state);
        });
      }
    }
  }, [isGlowActive]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out border-[8px]",
          isGlowActive 
            ? "border-cyan-500/80 shadow-[inset_0_0_100px_rgba(6,182,212,0.5),0_0_100px_rgba(6,182,212,0.5)] bg-cyan-500/5" 
            : "border-transparent opacity-0"
        )}
      />
    </div>
  );
}
