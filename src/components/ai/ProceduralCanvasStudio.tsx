"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Palette, Download, Trash2, Brush, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ProceduralCanvasStudio() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#6366f1");
  const [brushSize, setBrushSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `xak-ai-art-${Date.now()}.png`;
    a.click();
    toast({ title: "Canvas artwork downloaded!" });
  };

  return (
    <div className="my-4 rounded-xl border border-pink-500/30 bg-[#0f0814]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-pink-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Palette className="h-4 w-4 text-pink-400" />
          <span className="font-semibold text-pink-200">Procedural Canvas Studio</span>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border border-pink-500/40 bg-transparent"
          />
          <Button size="xs" variant="ghost" onClick={clearCanvas} className="h-7 text-xs px-2 text-red-400 hover:text-red-300">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
          <Button size="xs" variant="secondary" onClick={downloadImage} className="h-7 text-xs px-2">
            <Download className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-pink-500/20 flex justify-center bg-[#090d16]">
        <canvas
          ref={canvasRef}
          width={500}
          height={260}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          className="cursor-crosshair touch-none max-w-full"
        />
      </div>
    </div>
  );
}
