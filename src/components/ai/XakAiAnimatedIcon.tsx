"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface XakAiAnimatedIconProps {
  className?: string;
  size?: number; // Icon size in px (default 32)
}

export default function XakAiAnimatedIcon({ className, size = 32 }: XakAiAnimatedIconProps) {
  // SVG Morphing Path Keyframes:
  // 1. Hexagon: Renders a sleek 6-pointed geometric polygon
  // 2. Star: Morphs into a 4-pointed radiant star shape
  // 3. Burst: Morphs into a wide supernova energy ring
  // 4. Hexagon: Converges back to the geometric hexagon
  const hexagonPath = "M24,4 L40,13 L40,35 L24,44 L8,35 L8,13 Z";
  const starPath = "M24,2 L29,18 L46,24 L29,30 L24,46 L19,30 L2,24 L19,18 Z";
  const burstPath = "M24,10 L35,6 L38,17 L46,24 L38,31 L35,42 L24,38 L13,42 L10,31 L2,24 L10,17 L13,6 Z";

  return (
    <div
      className={cn("relative flex items-center justify-center select-none pointer-events-none", className)}
      style={{ width: size, height: size }}
    >
      {/* Background Neon Energy Aura Glow */}
      <motion.div
        animate={{
          scale: [1, 1.35, 1.6, 1],
          opacity: [0.3, 0.7, 0.9, 0.3],
          filter: [
            "blur(6px) drop-shadow(0 0 10px rgba(99, 102, 241, 0.6))",
            "blur(10px) drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))",
            "blur(14px) drop-shadow(0 0 30px rgba(16, 185, 129, 0.9))",
            "blur(6px) drop-shadow(0 0 10px rgba(99, 102, 241, 0.6))",
          ],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-pink-500 to-emerald-400 opacity-50"
      />

      {/* Main Animated SVG Container */}
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full relative z-10 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Dynamic Gradient for Futuristic Metal & Energy Shader */}
          <linearGradient id="xakAiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="35%" stopColor="#ec4899" />
            <stop offset="70%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Inner Glow Shader */}
          <linearGradient id="xakAiInnerGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Morphing Outer Path (Hexagon -> Star -> Burst -> Hexagon) */}
        <motion.path
          d={hexagonPath}
          animate={{
            d: [hexagonPath, starPath, burstPath, hexagonPath],
            rotate: [0, 90, 180, 360],
            scale: [1, 1.15, 1.3, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            times: [0, 0.35, 0.7, 1],
          }}
          fill="url(#xakAiGradient)"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{ transformOrigin: "24px 24px" }}
        />

        {/* Inner Counter-Rotating Nucleus */}
        <motion.path
          d={starPath}
          animate={{
            d: [starPath, hexagonPath, starPath, starPath],
            rotate: [360, 180, 0, -360],
            scale: [0.55, 0.75, 0.45, 0.55],
            opacity: [0.9, 1, 0.4, 0.9],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
          fill="url(#xakAiInnerGradient)"
          stroke="#ffffff"
          strokeWidth="1"
          style={{ transformOrigin: "24px 24px" }}
        />

        {/* 8 Radial Supernova Burst Particles */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const targetX = 24 + Math.cos(rad) * 22;
          const targetY = 24 + Math.sin(rad) * 22;

          return (
            <motion.circle
              key={i}
              cx={24}
              cy={24}
              r={1.8}
              fill={i % 2 === 0 ? "#6366f1" : "#ec4899"}
              animate={{
                cx: [24, targetX, 24],
                cy: [24, targetY, 24],
                opacity: [0, 1, 0],
                scale: [0.2, 1.8, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.05,
                times: [0.4, 0.7, 1],
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
