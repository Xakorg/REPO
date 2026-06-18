export interface GameMeta {
  id: string;
  title: string;
  developer: string;
  type: "3D" | "2D Top-Down" | "2D Platformer" | "Retro Emulator" | "Arcade" | "Sports";
  genre: string[];
  description: string;
  bannerUrl: string;
  iconUrl: string;
  releaseDate: string;
  price: string;
  route: string; // The URL to launch the game
}

export const GAMES_DB: GameMeta[] = [
  {
    id: "xaksports",
    title: "XakSports",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sports", "Multiplayer", "Physics"],
    description: "The ultimate 3D local and online multiplayer sports arena. Play 1v1 splitscreen or 4-player chaos.",
    bannerUrl: "https://images.unsplash.com/photo-1518605368461-1e1e11407e3c?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=xaksports",
    releaseDate: "2026",
    price: "Free",
    route: "/xaksports"
  },
  {
    id: "xakarena",
    title: "XakArena",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Shooter", "Action", "FPS"],
    description: "Fast-paced 3D arena shooter powered by WebGL. Lock and load.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=xakarena",
    releaseDate: "Coming Soon",
    price: "Free",
    route: "/xakarena"
  },
  {
    id: "retro_engine",
    title: "Retro Engine",
    developer: "Open Source",
    type: "Retro Emulator",
    genre: ["Emulator", "Classic"],
    description: "Play your favorite classic console ROMs directly in the browser using WebAssembly. Drag, drop, and play.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=retro",
    releaseDate: "Beta",
    price: "Free",
    route: "/games/retro"
  },
  {
    id: "neon_drift",
    title: "Neon Drift",
    developer: "Xakteir Studios",
    type: "2D Top-Down",
    genre: ["Racing", "Arcade"],
    description: "Top-down cyber-racing with intense drift mechanics.",
    bannerUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=neondrift",
    releaseDate: "2026",
    price: "$4.99",
    route: "/games/play/neon_drift"
  },
  {
    id: "pixel_knight",
    title: "Pixel Knight",
    developer: "IndieForge",
    type: "2D Platformer",
    genre: ["Adventure", "Platformer"],
    description: "A classic 2D platforming adventure through dangerous dungeons.",
    bannerUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=pixelknight",
    releaseDate: "2026",
    price: "Free",
    route: "/games/play/pixel_knight"
  }
];
