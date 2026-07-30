"use client";

import { useEffect, useRef, useState } from "react";
import { drawAppIconPath } from "@/lib/icon-drawers";

export function AnimatedAppIcon({
  iconName,
  className = "",
  size = 48,
}: {
  iconName: string;
  className?: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hueOffset, setHueOffset] = useState(0);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Only animate if the page is visible to save CPU
      if (document.visibilityState === 'visible') {
        setHueOffset((prev) => (prev + 2) % 360);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use a fixed 64x64 internal resolution like FaviconController
    canvas.width = 64;
    canvas.height = 64;

    ctx.clearRect(0, 0, 64, 64);

    ctx.save();
    // Scale and position for SVG path rendering (24x24 -> 48x48 + 8px padding)
    ctx.translate(8, 8);
    ctx.scale(2, 2);

    // Draw the shape
    drawAppIconPath(ctx, iconName);
    ctx.restore();

    // Composite the color changing gradient into the shape outline
    ctx.globalCompositeOperation = "source-in";
    const gradient = ctx.createLinearGradient(0, 0, 64, 64);
    gradient.addColorStop(0, `hsl(${(hueOffset + 180) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.25, `hsl(${(hueOffset + 145) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.5, `hsl(${(hueOffset + 45) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.75, `hsl(${(hueOffset + 340) % 360}, 100%, 50%)`);
    gradient.addColorStop(1, `hsl(${(hueOffset + 270) % 360}, 100%, 50%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Reset composite
    ctx.globalCompositeOperation = "source-over";
  }, [hueOffset, iconName]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
