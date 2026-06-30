export interface GameMeta {
  id: string;
  title: string;
  developer: string;
  type: "3D" | "2D Top-Down" | "2D Platformer" | "Retro Emulator" | "Arcade" | "Sports" | "Puzzle" | "Strategy" | "Discovery";
  genre: string[];
  description: string;
  bannerUrl: string;
  iconUrl: string;
  releaseDate: string;
  price: string;
  route: string; // The URL to launch the game
}

const premiumGames: GameMeta[] = [
  {
    id: "code_arena",
    title: "Code Arena",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Coding", "Multiplayer", "Competitive"],
    description: "Race against other developers to solve algorithmic challenges in real-time. The first to pass all test cases wins the battle.",
    bannerUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=codearena",
    releaseDate: "2026",
    price: "Free",
    route: "/games/code-arena"
  },
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

const legacyGamesData = [
  { id: 'aim', name: 'Aim Trainer', type: 'Arcade' },
  { id: 'balance', name: 'Balance Board', type: 'Puzzle' },
  { id: 'basketball', name: 'Basketball Shoot', type: 'Sports' },
  { id: 'breaker', name: 'Brick Breaker', type: 'Arcade' },
  { id: 'bubble', name: 'Bubble Shooter', type: 'Puzzle' },
  { id: 'clickSpeed', name: 'Click Speed', type: 'Arcade' },
  { id: 'clicker', name: 'Idle Clicker', type: 'Strategy' },
  { id: 'colorMatch', name: 'Color Match', type: 'Puzzle' },
  { id: 'connectFour', name: 'Connect Four', type: 'Strategy' },
  { id: 'dodge', name: 'Dodge Objects', type: 'Arcade' },
  { id: 'drawing', name: 'Drawing Canvas', type: 'Discovery' },
  { id: 'fishing', name: 'Fishing Game', type: 'Arcade' },
  { id: 'flappy', name: 'Flappy Bird', type: 'Arcade' },
  { id: 'football3D', name: 'Football 3D', type: '3D' },
  { id: 'frogger', name: 'Frogger Cross', type: 'Arcade' },
  { id: 'golf', name: 'Mini Golf', type: 'Sports' },
  { id: 'gravity', name: 'Gravity Flip', type: 'Arcade' },
  { id: 'invaders', name: 'Space Invaders', type: 'Arcade' },
  { id: 'jump', name: 'Infinite Jump', type: 'Arcade' },
  { id: 'knife', name: 'Knife Hit', type: 'Arcade' },
  { id: 'match3', name: 'Match 3', type: 'Puzzle' },
  { id: 'math', name: 'Math Quiz', type: 'Puzzle' },
  { id: 'maze', name: 'Maze Solver', type: 'Puzzle' },
  { id: 'memory', name: 'Memory Cards', type: 'Puzzle' },
  { id: 'minesweeper', name: 'Minesweeper', type: 'Strategy' },
  { id: 'paint', name: 'Paint & Draw', type: 'Discovery' },
  { id: 'parking', name: 'Car Parking', type: 'Puzzle' },
  { id: 'pinball', name: 'Pinball Classic', type: 'Arcade' },
  { id: 'plinko', name: 'Plinko Drop', type: 'Arcade' },
  { id: 'pong', name: 'Classic Pong', type: 'Arcade' },
  { id: 'rps', name: 'Rock Paper Scissors', type: 'Strategy' },
  { id: 'reaction', name: 'Reaction Time', type: 'Arcade' },
  { id: 'sequence', name: 'Memory Sequence', type: 'Puzzle' },
  { id: 'snake', name: 'Snake Game', type: 'Arcade' },
  { id: 'spinWheel', name: 'Spin The Wheel', type: 'Discovery' },
  { id: 'stack', name: 'Tower Stacker', type: 'Arcade' },
  { id: 'sudoku', name: 'Sudoku Classic', type: 'Puzzle' },
  { id: 'tictactoe', name: 'Tic Tac Toe', type: 'Strategy' },
  { id: 'towerDefense', name: 'Tower Defense', type: 'Strategy' },
  { id: 'trivia', name: 'Trivia Quiz', type: 'Discovery' },
  { id: 'tunnel3D', name: 'Tunnel 3D', type: '3D' },
  { id: 'twoZeroFourEight', name: '2048 Puzzle', type: 'Puzzle' },
  { id: 'typing', name: 'Typing Test', type: 'Discovery' },
  { id: 'whack', name: 'Whack-a-Mole', type: 'Arcade' },
  { id: 'word', name: 'Word Search', type: 'Puzzle' },
  { id: 'xbr', name: 'XBR Arena', type: '3D' }
];

const legacyGames: GameMeta[] = legacyGamesData.map(g => ({
  id: g.id,
  title: g.name,
  developer: "xakteir",
  type: g.type as any,
  genre: [g.type, "Casual"],
  description: `Classic ${g.name} experience available right in your browser.`,
  bannerUrl: `https://picsum.photos/seed/${g.id}/1200/800`,
  iconUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${g.id}`,
  releaseDate: "Classic",
  price: "Free",
  route: `/games/play/${g.id}`
}));

export const GAMES_DB: GameMeta[] = [...premiumGames, ...legacyGames];
