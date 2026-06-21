"use client";

import { useEffect } from "react";

const SVGS = {
  games: `<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><path d="M15 13h.01"/><path d="M18 11h.01"/>`,
  mail: `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
  chat: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
  default: `<path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`
};

export default function DynamicFavicon({ app = "default" }: { app?: "games" | "mail" | "chat" | "default" }) {
  useEffect(() => {
    const paths = SVGS[app] || SVGS.default;
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <style>
          @keyframes rainbow {
            0% { stroke: #ff0000; }
            16% { stroke: #ffff00; }
            33% { stroke: #00ff00; }
            50% { stroke: #00ffff; }
            66% { stroke: #0000ff; }
            83% { stroke: #ff00ff; }
            100% { stroke: #ff0000; }
          }
          path, rect {
            animation: rainbow 5s linear infinite;
          }
        </style>
        ${paths}
      </svg>
    `.replace(/\n/g, '').replace(/\s+/g, ' ');

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;

    return () => URL.revokeObjectURL(url);
  }, [app]);
  
  return null;
}
