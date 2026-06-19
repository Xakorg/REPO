"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Monitor, Gamepad2 } from "lucide-react";

export default function RetroEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [romLoaded, setRomLoaded] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // Draw retro boot screen
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 640, 480);
    
    ctx.fillStyle = "#fff";
    ctx.font = "20px 'Courier New'";
    ctx.fillText("XAKTEIR RETRO ENGINE v1.0", 20, 40);
    ctx.fillText("MEMORY: 64MB OK", 20, 70);
    ctx.fillText("WAITING FOR ROM...", 20, 100);

    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      ctx.fillStyle = "#000";
      ctx.fillRect(20, 110, 200, 30);
      ctx.fillStyle = tick % 2 === 0 ? "#fff" : "#000";
      ctx.fillText("_", 20, 130);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-8">
      <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-3xl shadow-2xl relative max-w-3xl w-full aspect-[4/3] flex flex-col items-center justify-center overflow-hidden">
        {/* CRT Bezel */}
        <div className="absolute inset-0 border-[20px] border-black rounded-3xl pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10 mix-blend-overlay" />
        
        {/* Screen */}
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={480} 
          className="w-full h-full bg-black object-contain filter contrast-125 brightness-110"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Scanlines */}
        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928GBgYGWcAAUAAgwAFaAwwQ1XnAAAAAAElFTkSuQmCC')] opacity-20 pointer-events-none z-20" />
      </Card>

      <div className="mt-8 flex items-center gap-4 text-zinc-500">
        <Monitor className="w-6 h-6" />
        <span className="text-sm font-bold uppercase tracking-widest">WASM Emulator Idle</span>
        <Gamepad2 className="w-6 h-6 ml-4" />
      </div>
      <p className="mt-4 text-xs text-zinc-600 max-w-md text-center">
        Drag and drop a .nes, .sfc, or .gb rom file to initialize the WebAssembly execution core.
      </p>
    </div>
  );
}
