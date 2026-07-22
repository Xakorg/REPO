const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'src', 'components', 'games');
const dbFile = path.join(__dirname, 'src', 'lib', 'games-db.ts');
const pageFile = path.join(__dirname, 'src', 'app', 'games', 'play', '[id]', 'page.tsx');

const files = fs.readdirSync(gamesDir).filter(f => f.endsWith('.tsx'));
const baseNames = files.map(f => f.replace('.tsx', ''));

const dbContent = fs.readFileSync(dbFile, 'utf8');
const pageContent = fs.readFileSync(pageFile, 'utf8');

// Find all existing ids in legacyGamesData to avoid duplicates
const idMatchRegex = /id:\s*'([^']+)'/g;
let match;
const existingIds = new Set();
while ((match = idMatchRegex.exec(dbContent)) !== null) {
  existingIds.add(match[1]);
}

let newGamesData = [];
let newGameMapEntries = [];

const genres = ['Arcade', 'Puzzle', 'Strategy', 'Action', 'Sports'];

for (const name of baseNames) {
  // Convert PascalCase to camelCase for the ID
  const id = name.charAt(0).toLowerCase() + name.slice(1);
  
  if (!existingIds.has(id) && id !== 'blockDrop' && id !== 'mazeMuncher' && id !== 'wordGuess' && id !== 'spaceRocks' && id !== 'rhythmTap') {
    // Generate a human readable name
    const humanName = name.replace(/([A-Z])/g, ' $1').trim();
    const genre = genres[Math.floor(Math.random() * genres.length)];
    
    newGamesData.push(`  { id: '${id}', name: '${humanName}', type: '${genre}' }`);
    newGameMapEntries.push(`  ${id}: dynamic(() => import("@/components/games/${name}")),`);
  }
}

console.log(`Found ${newGamesData.length} new games to register.`);

if (newGamesData.length > 0) {
  // Update games-db.ts
  const insertIndex = dbContent.lastIndexOf('];', dbContent.indexOf('const legacyGames: GameMeta[]'));
  if (insertIndex !== -1) {
    const updatedDbContent = dbContent.slice(0, insertIndex) + ',\n' + newGamesData.join(',\n') + '\n' + dbContent.slice(insertIndex);
    fs.writeFileSync(dbFile, updatedDbContent);
    console.log('Updated games-db.ts');
  }

  // Update page.tsx
  const mapInsertIndex = pageContent.lastIndexOf('};', pageContent.indexOf('export default function GamePlayerPage()'));
  if (mapInsertIndex !== -1) {
    const updatedPageContent = pageContent.slice(0, mapInsertIndex) + newGameMapEntries.join('\n') + '\n' + pageContent.slice(mapInsertIndex);
    fs.writeFileSync(pageFile, updatedPageContent);
    console.log('Updated page.tsx');
  }
}
