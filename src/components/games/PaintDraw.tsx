"use client";
import { useEffect, useRef, useState } from "react";

export default function PaintDraw() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#ff0000");
  const [size, setSize] = useState(10);
  const [tool, setTool] = useState<"pen"|"eraser"|"fill">("pen");
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const getPos = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    };

    const start = (e: MouseEvent) => {
      drawing.current = true;
      const { x, y } = getPos(e);
      if (tool === "fill") {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const draw = (e: MouseEvent) => {
      if (!drawing.current || tool === "fill") return;
      const { x, y } = getPos(e);
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = tool === "eraser" ? size * 4 : size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const stop = () => { drawing.current = false; };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stop);
    return () => { canvas.removeEventListener("mousedown", start); canvas.removeEventListener("mousemove", draw); window.removeEventListener("mouseup", stop); };
  }, [color, size, tool]);

  const PALETTE = ["#000000","#ffffff","#ff0000","#ff8800","#ffff00","#00ff00","#00ffff","#0000ff","#8800ff","#ff00ff","#663300","#999999"];

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900">
      <div className="flex items-center gap-4 p-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex gap-1">
          {PALETTE.map(c => (
            <button key={c} onClick={() => { setTool("pen"); setColor(c); }}
              className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${color === c && tool === "pen" ? "border-white scale-110" : "border-zinc-600"}`}
              style={{ background: c }} />
          ))}
        </div>
        <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool("pen"); }} className="w-8 h-8 rounded border-zinc-600 border-2 bg-transparent cursor-pointer" />
        <div className="flex gap-2 ml-2">
          {(["pen","eraser","fill"] as const).map(t => (
            <button key={t} onClick={() => setTool(t)}
              className={`px-3 py-1 rounded text-xs font-bold uppercase capitalize ${tool === t ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={50} value={size} onChange={e => setSize(+e.target.value)} className="w-20 accent-blue-500" />
          <span className="text-white text-xs">{size}px</span>
        </div>
        <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); if(ctx) { ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvasRef.current!.width,canvasRef.current!.height); } }} className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded uppercase ml-auto">Clear</button>
      </div>
      <canvas ref={canvasRef} width={800} height={520} className="flex-1 w-full h-full bg-white" style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }} />
    </div>
  );
}
