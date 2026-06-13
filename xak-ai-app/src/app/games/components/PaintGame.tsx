"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Palette, Trash2, Download } from "lucide-react";

export function PaintGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#a855f7");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
      }
    }
  }, []);

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-4xl w-full text-foreground relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Xak_Paint</h2>
        <div className="flex gap-4">
          <Button size="icon" variant="outline" onClick={clear} className="rounded-full h-12 w-12"><Trash2 className="w-6 h-6 text-rose-500" /></Button>
          <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
        </div>
      </div>

      <div className="flex gap-6 w-full">
        <div className="flex flex-col gap-4">
          {['#a855f7', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#ffffff'].map(c => (
            <button 
              key={c}
              onClick={() => setColor(c)}
              className="w-12 h-12 rounded-xl border-4 border-white/10 shadow-lg transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent' }}
            />
          ))}
        </div>
        
        <canvas 
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="flex-1 bg-black rounded-[2.5rem] border-4 border-white/10 shadow-inner cursor-crosshair"
        />
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Draw anything you imagine!</p>
    </div>
  );
}
