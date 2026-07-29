const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'lib', 'games-db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

const replacements = {
  "Bubble Shooter": "Plasma Burst",
  "Flappy Bird": "Aero Dash",
  "Frogger Cross": "Neon Cross",
  "Mini Golf": "Cyber Golf",
  "Match 3": "Cyber Match",
  "Memory Cards": "Neural Memory",
  "Paint & Draw": "Neon Canvas",
  "Rock Paper Scissors": "Cyber RPS",
  "Spin The Wheel": "Roulette Rush",
  "Tower Stacker": "Sky Stacker",
  "Tic Tac Toe": "Grid Tactics",
  "Whack-a-Mole": "Whack-A-Bot",
  "Whack A Mole": "Whack-A-Bot",
  "Maze Muncher": "Maze Runner",
  "Word Guess": "Cipher Guess",
  "Math Quiz": "Neural Quiz",
  "Fishing Game": "Deep Sea Fisher",
  "Drawing Canvas": "Pixel Canvas",
  "Brick Breaker": "Neon Breaker",
  "Idle Clicker": "Idle Core",
  "Connect Four": "Grid Connect",
  "Dodge Objects": "Neon Dodge",
  "Space Invaders": "Star Invaders",
  "Car Parking": "Hover Parking",
  "Pinball Classic": "Neon Pinball",
  "Classic Pong": "Neon Pong",
  "Reaction Time": "Neural Reaction",
  "Memory Sequence": "Neural Sequence",
  "Sudoku Classic": "Grid Sudoku",
  "Trivia Quiz": "Data Quiz",
  "Word Search": "Data Search",
};

for (const [oldName, newName] of Object.entries(replacements)) {
  content = content.replace(new RegExp(`name:\\s*['"]${oldName}['"]`, 'g'), `name: '${newName}'`);
}

fs.writeFileSync(dbPath, content, 'utf8');
console.log('Renamed legacy games.');
