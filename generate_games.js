const fs = require('fs');

const adjectives = ['Neon', 'Cyber', 'Pixel', 'Space', 'Gravity', 'Cosmic', 'Magic', 'Quantum', 'Shadow', 'Super', 'Hyper', 'Ultra', 'Mega', 'Retro', 'Crystal', 'Iron', 'Plasma', 'Aero', 'Aqua', 'Terra'];
const nouns = ['Runner', 'Defender', 'Quest', 'Maze', 'Strike', 'Rush', 'Pulse', 'Dash', 'Rider', 'Fighter', 'Ninja', 'Knight', 'Puzzler', 'Master', 'Breaker', 'Hunter', 'Drifter', 'Pilot', 'Builder', 'Survivor'];
const types = ['Arcade', 'Strategy', 'Puzzle', 'Sports', 'Discovery', '3D'];
const icons = ['Gamepad2', 'Zap', 'StarIcon', 'Sword', 'Trophy', 'Activity', 'Target', 'Palette', 'Flame', 'Sparkles', 'Code2'];
const colors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500', 'text-pink-500', 'text-orange-500', 'text-teal-500', 'text-cyan-500', 'text-rose-500', 'text-indigo-500'];

let games = [];
for (let i = 0; i < 100; i++) {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const icon = icons[Math.floor(Math.random() * icons.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  games.push(`  { id: 'game_${i}', name: '${adj} ${noun}', type: '${type}', icon: ${icon}, color: '${color}', creator: 'xakteir' }`);
}

const gamesStr = `const BUILT_IN_GAMES = [\n` + games.join(',\n') + `\n];`;

const path = 'src/app/games/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const BUILT_IN_GAMES = \[(?:[^\]]|\](?!;))*\];/s;
if (regex.test(content)) {
  content = content.replace(regex, gamesStr);
  fs.writeFileSync(path, content);
  console.log('Successfully injected 100 games.');
} else {
  console.log('Could not find BUILT_IN_GAMES array.');
}
