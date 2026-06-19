"use client";
import { useEffect, useRef, useState } from "react";

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(8);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if (e instanceof MouseEvent) {
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
      } else {
        return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
      }
    };

    const start = (e: MouseEvent | TouchEvent) => {
      drawing.current = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current) return;
      const { x, y } = getPos(e);
      ctx.strokeStyle = tool === "eraser" ? "#111" : color;
      ctx.lineWidth = tool === "eraser" ? size * 3 : size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const stop = () => { drawing.current = false; };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, { passive: true });
    canvas.addEventListener("touchmove", draw, { passive: true });
    canvas.addEventListener("touchend", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
    };
  }, [color, size, tool]);

  const PALETTE = ["#ffffff","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#000000","#6b7280"];

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-3 bg-zinc-900 border-b border-white/10">
        <div className="flex gap-2">
          {PALETTE.map(c => (
            <button key={c} onClick={() => { setTool("pen"); setColor(c); }}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === "pen" ? "border-white scale-110" : "border-transparent"}`}
              style={{ background: c }} />
          ))}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-zinc-400">Size:</span>
          <input type="range" min={1} max={40} value={size} onChange={e => setSize(+e.target.value)} className="w-24 accent-indigo-500" />
        </div>
        <button onClick={() => setTool(t => t === "eraser" ? "pen" : "eraser")}
          className={`px-3 py-1 rounded text-xs font-bold uppercase ${tool === "eraser" ? "bg-orange-500 text-white" : "bg-white/10 text-white"}`}>
          {tool === "eraser" ? "Erasing" : "Eraser"}
        </button>
        <button onClick={() => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#111";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }} className="px-3 py-1 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-400 hover:bg-rose-500/40">
          Clear
        </button>
      </div>
      <canvas ref={canvasRef} width={800} height={540} className="flex-1 w-full h-full cursor-crosshair object-contain" style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }} />
    </div>
  );
}
