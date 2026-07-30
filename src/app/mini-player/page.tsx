"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2 } from "lucide-react";

function MiniPlayerContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    // Make window draggable
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";
  }, []);

  const handleReturnToMain = () => {
    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.window.close(); // Close mini player
      // We would ideally focus the main window here too, could add an IPC for that
    }
  };

  return (
    <div 
      className="w-full h-full bg-zinc-900/90 backdrop-blur-xl border border-white/20 rounded-2xl flex flex-col shadow-2xl overflow-hidden relative group" 
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Video Placeholder (if type === 'video') */}
      {type === "video" ? (
        <div className="flex-1 bg-black w-full flex items-center justify-center">
          <Video className="w-12 h-12 text-white/20" />
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Phone className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">{id || "Voice Call"}</span>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        {type === "video" && (
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
        )}
        <button 
          className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
          onClick={handleReturnToMain}
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      <button 
        onClick={handleReturnToMain}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        title="Return to full app"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function MiniPlayerPage() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white">Loading...</div>}>
      <MiniPlayerContent />
    </Suspense>
  );
}
