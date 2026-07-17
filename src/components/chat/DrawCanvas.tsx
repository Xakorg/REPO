"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Eraser } from "lucide-react";

interface DrawCanvasProps {
  onSend: (base64: string) => void;
  onClose: () => void;
}

export function DrawCanvas({ onSend, onClose }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e, true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent, forced = false) => {
    if (!isDrawing && !forced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get position
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    
    if (isEraser) {
      ctx.strokeStyle = "#000000"; // Erase to black bg
    } else {
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSend = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSend(dataUrl);
    }
  };

  return (
    <div className="absolute bottom-20 left-4 right-4 z-50 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[300px]">
      <div className="flex items-center justify-between p-2 bg-zinc-900 border-b border-white/10">
        <div className="flex items-center gap-2">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
          <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-24" />
          <Button variant="ghost" size="icon" onClick={() => setIsEraser(!isEraser)} className={isEraser ? "bg-white/20" : ""}>
            <Eraser className="w-4 h-4 text-white" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          <Button onClick={handleSend} className="bg-primary text-black"><Send className="w-4 h-4 mr-2"/> Send Drawing</Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={draw}
        className="w-full flex-1 touch-none cursor-crosshair"
      />
    </div>
  );
}
