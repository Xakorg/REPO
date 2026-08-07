"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Box, RefreshCw, Play, Pause } from "lucide-react";

export function ThreeDShaderPlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.fillStyle = "rgba(5, 7, 18, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const numDots = 60;

      for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2 + time;
        const radius = 60 + Math.sin(time * 2 + i * 0.2) * 25;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const size = 3 + Math.sin(time + i) * 2;

        ctx.fillStyle = `hsl(${(i * 6 + time * 50) % 360}, 80%, 65%)`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(size, 1), 0, Math.PI * 2);
        ctx.fill();
      }

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div className="my-4 rounded-xl border border-cyan-500/30 bg-[#060e1a]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Box className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-cyan-200">Interactive 3D Shader Playground</span>
        </div>
        <Button
          size="xs"
          variant="outline"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-7 text-xs px-2 border-cyan-500/30 text-cyan-300"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-cyan-500/20 flex justify-center bg-[#050712]">
        <canvas ref={canvasRef} width={480} height={200} className="w-full max-w-full rounded-lg" />
      </div>
    </div>
  );
}
