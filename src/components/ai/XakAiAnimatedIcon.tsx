"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface XakAiAnimatedIconProps {
  className?: string;
  size?: number; // Icon size in px (default 32)
}

export default function XakAiAnimatedIcon({ className, size = 32 }: XakAiAnimatedIconProps) {
  // Matched 12-point SVG paths for 100% glitch-free, smooth SVG path morphing
  // 1. Hexagon: 6 vertices + 6 mid-edge control points
  const hexagonPath = "M 24,4 L 32,8.5 L 40,13 L 40,24 L 40,35 L 32,39.5 L 24,44 L 16,39.5 L 8,35 L 8,24 L 8,13 L 16,8.5 Z";
  
  // 2. Star: 4 outer star tips + 4 inner star corners + 4 accent vertices
  const starPath = "M 24,2 L 29,18 L 46,24 L 29,30 L 24,46 L 19,30 L 2,24 L 19,18 L 24,2 L 29,18 L 46,24 L 29,30 Z";
  
  // 3. Supernova Burst: 12 radiating geometric points
  const burstPath = "M 24,6 L 31,10 L 42,6 L 38,17 L 46,24 L 38,31 L 42,42 L 31,38 L 24,42 L 17,38 L 6,42 L 10,31 Z";

  return (
    <div
      className={cn("relative flex items-center justify-center select-none pointer-events-none shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* Background Soft Neon Glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.4, 0.75, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-pink-500 to-cyan-400 blur-md opacity-60"
      />

      {/* Main Animated SVG Container */}
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full relative z-10 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main Shimmer Gradient */}
          <linearGradient id="xakAiGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Star Core Gradient */}
          <linearGradient id="xakAiCoreGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Outer Pulsing Hexagon Base */}
        <motion.path
          d={hexagonPath}
          animate={{
            rotate: [0, 60, 120, 180, 240, 300, 360],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          fill="url(#xakAiGlowGrad)"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{ transformOrigin: "24px 24px" }}
        />

        {/* Inner Counter-Rotating Radiant Star */}
        <motion.path
          d={starPath}
          animate={{
            rotate: [360, 270, 180, 90, 0],
            scale: [0.5, 0.65, 0.45, 0.5],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          fill="url(#xakAiCoreGrad)"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinejoin="round"
          style={{ transformOrigin: "24px 24px" }}
        />

        {/* 6 Supernova Expanding Pulse Rings */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const targetX = 24 + Math.cos(rad) * 20;
          const targetY = 24 + Math.sin(rad) * 20;

          return (
            <motion.circle
              key={i}
              cx={24}
              cy={24}
              r={1.8}
              fill="#ffffff"
              animate={{
                cx: [24, targetX, 24],
                cy: [24, targetY, 24],
                opacity: [0, 1, 0],
                scale: [0.3, 1.4, 0.3],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
