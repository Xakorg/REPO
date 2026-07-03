export const ALL_SHOP_ITEMS = [
  // Hats (11 items)
  { id: 1, name: "Classic Top Hat", category: "Hats", type: 'hat', key: 'tophat', price: 500, color: "text-zinc-300", bg: "bg-zinc-500/10", rarity: "Rare", description: "A sophisticated black top hat for the distinguished member." },
  { id: 2, name: "Royal Crown", category: "Hats", type: 'hat', key: 'crown', price: 2000, color: "text-amber-400", bg: "bg-amber-500/10", rarity: "Mythic", description: "A golden crown studded with precious gems." },
  { id: 3, name: "Wizard Hat", category: "Hats", type: 'hat', key: 'wizard', price: 800, color: "text-purple-400", bg: "bg-purple-500/10", rarity: "Epic", description: "A mystical purple hat imbued with arcane power." },
  { id: 4, name: "Party Hat", category: "Hats", type: 'hat', key: 'party', price: 200, color: "text-pink-400", bg: "bg-pink-500/10", rarity: "Common", description: "A colorful cone hat for celebrations." },
  { id: 5, name: "Cowboy Hat", category: "Hats", type: 'hat', key: 'cowboy', price: 450, color: "text-amber-700", bg: "bg-amber-700/10", rarity: "Rare", description: "A rugged western hat for the bold adventurer." },
  { id: 6, name: "Halo", category: "Hats", type: 'hat', key: 'halo', price: 1500, color: "text-yellow-300", bg: "bg-yellow-500/10", rarity: "Legendary", description: "A divine golden halo that floats above your head." },
  { id: 7, name: "Devil Horns", category: "Hats", type: 'hat', key: 'horns', price: 1200, color: "text-red-500", bg: "bg-red-500/10", rarity: "Epic", description: "Dark crimson horns for the mischievous troublemaker." },
  { id: 8, name: "Baseball Cap", category: "Hats", type: 'hat', key: 'cap', price: 150, color: "text-blue-500", bg: "bg-blue-500/10", rarity: "Common", description: "A casual cap worn backwards for that cool vibe." },
  { id: 9, name: "Viking Helmet", category: "Hats", type: 'hat', key: 'viking', price: 900, color: "text-gray-400", bg: "bg-gray-500/10", rarity: "Epic", description: "A battle-worn helmet with mighty horns." },
  { id: 10, name: "Chef Hat", category: "Hats", type: 'hat', key: 'chef', price: 350, color: "text-white", bg: "bg-white/10", rarity: "Uncommon", description: "A tall white toque for the culinary master." },
  { id: 11, name: "Galactic Crown", category: "Hats", type: 'hat', key: 'crown', price: 5000, color: "text-indigo-400", bg: "bg-indigo-500/20", rarity: "Exotic", description: "A crown forged in the heart of a dying star. Rarely seen." },

  // Auras (20 items)
  { id: 12, name: "Neon Pulse Aura", category: "Auras", type: 'aura', key: 'neon', price: 450, color: "text-blue-500", bg: "bg-blue-500/10", rarity: "Epic", description: "A high-frequency rhythmic pulse around your avatar." },
  { id: 13, name: "Cyber Glitch Aura", category: "Auras", type: 'aura', key: 'glitch', price: 600, color: "text-primary", bg: "bg-primary/10", rarity: "Legendary", description: "Distort the boundaries of your profile with digital artifacts." },
  { id: 14, name: "Divine Shine Aura", category: "Auras", type: 'aura', key: 'gold', price: 1200, color: "text-amber-500", bg: "bg-amber-500/10", rarity: "Mythic", description: "Radiate energy from the Hub's original power source." },
  { id: 15, name: "Cosmic Void Aura", category: "Auras", type: 'aura', key: 'glitch', price: 1800, color: "text-purple-600", bg: "bg-purple-600/10", rarity: "Mythic", description: "The essence of the cosmos swirls around you." },
  { id: 16, name: "Fire Aura", category: "Auras", type: 'aura', key: 'gold', price: 700, color: "text-orange-500", bg: "bg-orange-500/10", rarity: "Epic", description: "Blazing flames dance around your avatar." },
  { id: 17, name: "Ice Aura", category: "Auras", type: 'aura', key: 'neon', price: 700, color: "text-cyan-400", bg: "bg-cyan-500/10", rarity: "Epic", description: "Crystalline ice particles orbit your presence." },
  { id: 18, name: "Dark Matter Aura", category: "Auras", type: 'aura', key: 'glitch', price: 4500, color: "text-slate-900", bg: "bg-slate-900/50", rarity: "Exotic", description: "An aura that consumes light itself." },
  { id: 19, name: "Emerald Glow", category: "Auras", type: 'aura', key: 'neon', price: 300, color: "text-emerald-400", bg: "bg-emerald-500/10", rarity: "Rare", description: "A soothing green aura." },
  { id: 20, name: "Ruby Radiance", category: "Auras", type: 'aura', key: 'gold', price: 800, color: "text-red-500", bg: "bg-red-500/10", rarity: "Epic", description: "A fierce red light." },
  { id: 21, name: "Phantom Mist", category: "Auras", type: 'aura', key: 'glitch', price: 1500, color: "text-zinc-400", bg: "bg-zinc-500/10", rarity: "Legendary", description: "Ethereal fog surrounds you." },
  { id: 22, name: "Solar Flare", category: "Auras", type: 'aura', key: 'gold', price: 2200, color: "text-yellow-500", bg: "bg-yellow-500/10", rarity: "Mythic", description: "Blinding solar energy." },
  { id: 23, name: "Lunar Eclipse", category: "Auras", type: 'aura', key: 'glitch', price: 2100, color: "text-indigo-500", bg: "bg-indigo-500/10", rarity: "Mythic", description: "The shadow of the moon." },
  { id: 24, name: "Toxic Fumes", category: "Auras", type: 'aura', key: 'neon', price: 400, color: "text-green-500", bg: "bg-green-500/10", rarity: "Uncommon", description: "Green biohazard mist." },
  { id: 25, name: "Holy Light", category: "Auras", type: 'aura', key: 'gold', price: 1000, color: "text-yellow-200", bg: "bg-yellow-200/10", rarity: "Epic", description: "Blessed light of the heavens." },
  { id: 26, name: "Shadow Step", category: "Auras", type: 'aura', key: 'glitch', price: 900, color: "text-gray-800", bg: "bg-gray-800/10", rarity: "Rare", description: "Darkness trails your movements." },
  { id: 27, name: "Crystal Shards", category: "Auras", type: 'aura', key: 'neon', price: 1300, color: "text-blue-300", bg: "bg-blue-300/10", rarity: "Legendary", description: "Floating crystal fragments." },
  { id: 28, name: "Crimson Storm", category: "Auras", type: 'aura', key: 'glitch', price: 1600, color: "text-rose-600", bg: "bg-rose-600/10", rarity: "Legendary", description: "A violent red tempest." },
  { id: 29, name: "Golden Leaves", category: "Auras", type: 'aura', key: 'gold', price: 500, color: "text-amber-600", bg: "bg-amber-600/10", rarity: "Rare", description: "Autumn leaves falling eternally." },
  { id: 30, name: "Prismatic Shield", category: "Auras", type: 'aura', key: 'neon', price: 2500, color: "text-pink-300", bg: "bg-pink-300/10", rarity: "Mythic", description: "A rainbow colored energy shield." },
  { id: 31, name: "Abyssal Void", category: "Auras", type: 'aura', key: 'glitch', price: 6000, color: "text-fuchsia-900", bg: "bg-fuchsia-900/50", rarity: "Exotic", description: "The deepest, darkest energy." },

  // Nameplates (15 items)
  { id: 32, name: "Electric Blue Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 300, color: "text-blue-400", bg: "bg-blue-400/10", rarity: "Rare", description: "A vibrant cyan signature for your profile." },
  { id: 33, name: "Gold Elite Tag", category: "Name Plates", type: 'nameplate', key: 'gold', price: 850, color: "text-amber-500", bg: "bg-amber-500/10", rarity: "Legendary", description: "The standard of excellence in the multiverse." },
  { id: 34, name: "Pro Nameplate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 1200, color: "text-purple-400", bg: "bg-purple-500/10", rarity: "Legendary", description: "A gradient nameplate that shifts between purple and pink." },
  { id: 35, name: "Rainbow Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 2500, color: "text-pink-500", bg: "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10", rarity: "Mythic", description: "A nameplate that cycles through all colors." },
  { id: 36, name: "Ruby Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 600, color: "text-red-500", bg: "bg-red-500/10", rarity: "Rare", description: "A deep red nameplate." },
  { id: 37, name: "Emerald Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 600, color: "text-emerald-500", bg: "bg-emerald-500/10", rarity: "Rare", description: "A vibrant green nameplate." },
  { id: 38, name: "Diamond Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 1500, color: "text-cyan-300", bg: "bg-cyan-300/10", rarity: "Mythic", description: "Sparkling diamond texture." },
  { id: 39, name: "Obsidian Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 1000, color: "text-zinc-800", bg: "bg-zinc-800/10", rarity: "Epic", description: "Dark, sleek volcanic glass." },
  { id: 40, name: "Amethyst Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 900, color: "text-fuchsia-400", bg: "bg-fuchsia-400/10", rarity: "Epic", description: "A mysterious purple crystal." },
  { id: 41, name: "Topaz Plate", category: "Name Plates", type: 'nameplate', key: 'gold', price: 700, color: "text-yellow-400", bg: "bg-yellow-400/10", rarity: "Rare", description: "Bright yellow gemstone plate." },
  { id: 42, name: "Sapphire Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 800, color: "text-blue-600", bg: "bg-blue-600/10", rarity: "Epic", description: "Deep blue sea color." },
  { id: 43, name: "Pearl Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 1100, color: "text-gray-100", bg: "bg-gray-100/10", rarity: "Legendary", description: "Elegant white iridescent plate." },
  { id: 44, name: "Opal Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 1600, color: "text-teal-200", bg: "bg-teal-200/10", rarity: "Mythic", description: "A shifting, multi-colored pastel plate." },
  { id: 45, name: "Magma Plate", category: "Name Plates", type: 'nameplate', key: 'gold', price: 950, color: "text-orange-600", bg: "bg-orange-600/10", rarity: "Epic", description: "A nameplate that burns." },
  { id: 46, name: "Void Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 4000, color: "text-slate-900", bg: "bg-slate-900/50", rarity: "Exotic", description: "A plate that absorbs all light." },

  // Decorations (20 items)
  { id: 47, name: "Space Cat Orbit", category: "Decorations", type: 'decor', key: 'cat', price: 1500, color: "text-rose-500", bg: "bg-rose-500/10", rarity: "Mythic", description: "An animated cat that orbits your identity." },
  { id: 48, name: "Star Trail", category: "Decorations", type: 'decor', key: 'stars', price: 800, color: "text-yellow-400", bg: "bg-yellow-500/10", rarity: "Epic", description: "Tiny stars trail behind your cursor." },
  { id: 49, name: "Lightning Bolt", category: "Decorations", type: 'decor', key: 'lightning', price: 600, color: "text-yellow-500", bg: "bg-yellow-500/10", rarity: "Rare", description: "Electric bolts crackle around your profile." },
  { id: 50, name: "Cherry Blossom", category: "Decorations", type: 'decor', key: 'sakura', price: 1000, color: "text-pink-300", bg: "bg-pink-300/10", rarity: "Legendary", description: "Delicate pink petals float around you." },
  { id: 51, name: "Ghost Pet", category: "Decorations", type: 'decor', key: 'ghost', price: 700, color: "text-gray-300", bg: "bg-gray-300/10", rarity: "Epic", description: "A spooky companion." },
  { id: 52, name: "Skull Pet", category: "Decorations", type: 'decor', key: 'skull', price: 750, color: "text-zinc-100", bg: "bg-zinc-100/10", rarity: "Epic", description: "A cursed skull companion." },
  { id: 53, name: "Mini Bot", category: "Decorations", type: 'decor', key: 'bot', price: 1200, color: "text-blue-300", bg: "bg-blue-300/10", rarity: "Legendary", description: "A helpful little drone." },
  { id: 54, name: "Fireflies", category: "Decorations", type: 'decor', key: 'stars', price: 500, color: "text-lime-400", bg: "bg-lime-400/10", rarity: "Rare", description: "Small glowing bugs." },
  { id: 55, name: "Snowflakes", category: "Decorations", type: 'decor', key: 'stars', price: 500, color: "text-sky-200", bg: "bg-sky-200/10", rarity: "Rare", description: "Falling winter snow." },
  { id: 56, name: "Autumn Leaves", category: "Decorations", type: 'decor', key: 'sakura', price: 550, color: "text-orange-400", bg: "bg-orange-400/10", rarity: "Rare", description: "Crisp autumn foliage." },
  { id: 57, name: "Magic Sparks", category: "Decorations", type: 'decor', key: 'stars', price: 900, color: "text-purple-300", bg: "bg-purple-300/10", rarity: "Epic", description: "Arcane energy sparks." },
  { id: 58, name: "Golden Coins", category: "Decorations", type: 'decor', key: 'stars', price: 1100, color: "text-yellow-400", bg: "bg-yellow-400/10", rarity: "Legendary", description: "Raining wealth." },
  { id: 59, name: "Hearts", category: "Decorations", type: 'decor', key: 'sakura', price: 300, color: "text-red-400", bg: "bg-red-400/10", rarity: "Uncommon", description: "Floating symbols of love." },
  { id: 60, name: "Music Notes", category: "Decorations", type: 'decor', key: 'stars', price: 400, color: "text-zinc-400", bg: "bg-zinc-400/10", rarity: "Rare", description: "Melodies in the air." },
  { id: 61, name: "Bubbles", category: "Decorations", type: 'decor', key: 'stars', price: 250, color: "text-cyan-200", bg: "bg-cyan-200/10", rarity: "Common", description: "Soap bubbles floating up." },
  { id: 62, name: "Butterflies", category: "Decorations", type: 'decor', key: 'sakura', price: 850, color: "text-pink-400", bg: "bg-pink-400/10", rarity: "Epic", description: "Beautiful flying insects." },
  { id: 63, name: "Bats", category: "Decorations", type: 'decor', key: 'ghost', price: 650, color: "text-zinc-800", bg: "bg-zinc-800/10", rarity: "Rare", description: "Creatures of the night." },
  { id: 64, name: "Floating Orbs", category: "Decorations", type: 'decor', key: 'stars', price: 1300, color: "text-indigo-300", bg: "bg-indigo-300/10", rarity: "Legendary", description: "Mysterious glowing spheres." },
  { id: 65, name: "Alien Pet", category: "Decorations", type: 'decor', key: 'bot', price: 1800, color: "text-lime-500", bg: "bg-lime-500/10", rarity: "Mythic", description: "A companion from another world." },
  { id: 66, name: "Dragon Hatchling", category: "Decorations", type: 'decor', key: 'cat', price: 4800, color: "text-red-600", bg: "bg-red-600/20", rarity: "Exotic", description: "A tiny, fire-breathing friend." },

  // Pets (3 items)
  { id: 67, name: "Cyber Wolf", category: "Pets", type: 'pet', key: 'cyberwolf', price: 6000, color: "text-sky-400", bg: "bg-sky-500/10", rarity: "Exotic", description: "A loyal holographic wolf companion." },
  { id: 68, name: "Mini Dragon", category: "Pets", type: 'pet', key: 'minidragon', price: 4500, color: "text-red-500", bg: "bg-red-500/10", rarity: "Mythic", description: "A small fire-breathing dragon." },
  { id: 69, name: "Void Entity", category: "Pets", type: 'pet', key: 'voidentity', price: 8000, color: "text-purple-500", bg: "bg-purple-600/20", rarity: "Exotic", description: "An entity from the deep void." },

  // Banners (3 items)
  { id: 70, name: "Matrix Rain", category: "Banners", type: 'banner', key: 'matrix', price: 2000, color: "text-green-500", bg: "bg-green-500/10", rarity: "Legendary", description: "Falling green code background." },
  { id: 71, name: "Retrowave Sunset", category: "Banners", type: 'banner', key: 'retrowave', price: 2500, color: "text-pink-500", bg: "bg-pink-500/10", rarity: "Mythic", description: "A retro 80s synthwave sunset." },
  { id: 72, name: "Galactic Void", category: "Banners", type: 'banner', key: 'galactic', price: 3500, color: "text-indigo-400", bg: "bg-indigo-500/10", rarity: "Exotic", description: "Stare into the endless galaxy." },

  // NEW COSMETICS FOR THE 5 NEW SETS
  // Hats
  { id: 73, name: "Golden Crown", category: "Hats", type: 'hat', key: 'golden_crown', price: 10000, color: "text-yellow-400", bg: "bg-yellow-500/10", rarity: "Exotic", description: "An animated crown dripping in gold and sparkles." },
  { id: 74, name: "Admin Hacker Crown", category: "Hats", type: 'hat', key: 'admin_crown', price: 999999, color: "text-green-500", bg: "bg-green-500/10", rarity: "Exotic", description: "A glitching black and green crown for system administrators." },
  { id: 75, name: "Rainbow Crown", category: "Hats", type: 'hat', key: 'rainbow_crown', price: 8500, color: "text-pink-500", bg: "bg-pink-500/10", rarity: "Exotic", description: "A crown that cycles through every color in the spectrum." },
  { id: 76, name: "Magic Hat", category: "Hats", type: 'hat', key: 'magic_hat', price: 7000, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", rarity: "Mythic", description: "A mystical witch hat that pulses with arcane energy." },
  
  // Decors & Pets
  { id: 77, name: "Golden Sparkles", category: "Decorations", type: 'decor', key: 'golden_sparkles', price: 5000, color: "text-yellow-300", bg: "bg-yellow-300/10", rarity: "Mythic", description: "Golden sparkles floating around your profile." },
  { id: 78, name: "Admin Glitch", category: "Decorations", type: 'decor', key: 'admin_glitch', price: 999999, color: "text-green-500", bg: "bg-green-500/10", rarity: "Exotic", description: "Matrix code cascading over your entire profile card." },
  { id: 79, name: "Sports Stickmen", category: "Decorations", type: 'decor', key: 'stickmen', price: 4000, color: "text-orange-500", bg: "bg-orange-500/10", rarity: "Epic", description: "Stickmen playing sports around your avatar." },
  { id: 80, name: "Flying Magic Cat", category: "Decorations", type: 'decor', key: 'flying_cat', price: 6500, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", rarity: "Mythic", description: "A magical black cat flying on a broomstick." },
  { id: 81, name: "Uni Kitty", category: "Pets", type: 'pet', key: 'uni_kitty', price: 9500, color: "text-pink-400", bg: "bg-pink-400/10", rarity: "Exotic", description: "A magical unicorn kitty flying with a rainbow trail." },

  // Banners
  { id: 82, name: "Golden Background", category: "Banners", type: 'banner', key: 'golden', price: 6000, color: "text-yellow-600", bg: "bg-yellow-600/10", rarity: "Mythic", description: "A pure golden gradient background with sparkles." },
  { id: 83, name: "Hacker Matrix", category: "Banners", type: 'banner', key: 'hacker', price: 999999, color: "text-green-500", bg: "bg-green-500/10", rarity: "Exotic", description: "Intense binary code falling in the background." },
  { id: 84, name: "Rainbow Flow", category: "Banners", type: 'banner', key: 'rainbow', price: 7500, color: "text-red-500", bg: "bg-red-500/10", rarity: "Exotic", description: "A beautiful moving rainbow gradient." },
  { id: 85, name: "Sports Stadium", category: "Banners", type: 'banner', key: 'sports', price: 3500, color: "text-green-700", bg: "bg-green-700/10", rarity: "Epic", description: "A sports field background." },
  { id: 86, name: "Magic Night", category: "Banners", type: 'banner', key: 'magic', price: 5500, color: "text-fuchsia-900", bg: "bg-fuchsia-900/10", rarity: "Mythic", description: "A mystical purple starry night." },

  // Nameplates
  { id: 87, name: "Golden Plate", category: "Name Plates", type: 'nameplate', key: 'golden', price: 3500, color: "text-yellow-400", bg: "bg-yellow-400/10", rarity: "Mythic", description: "A shining golden nameplate." },
  { id: 88, name: "Hacker Plate", category: "Name Plates", type: 'nameplate', key: 'hacker', price: 999999, color: "text-green-500", bg: "bg-green-500/10", rarity: "Exotic", description: "Animated binary around your name." },
  { id: 89, name: "Rainbow Plate", category: "Name Plates", type: 'nameplate', key: 'rainbow', price: 4500, color: "text-pink-500", bg: "bg-pink-500/10", rarity: "Exotic", description: "A smoothly color-shifting nameplate." },
  { id: 90, name: "Sports Plate", category: "Name Plates", type: 'nameplate', key: 'sports', price: 2000, color: "text-orange-500", bg: "bg-orange-500/10", rarity: "Epic", description: "A nameplate featuring sports balls." },
  { id: 91, name: "Magic Plate", category: "Name Plates", type: 'nameplate', key: 'magic', price: 3000, color: "text-fuchsia-400", bg: "bg-fuchsia-400/10", rarity: "Mythic", description: "A glowing purple magic nameplate." },
];

export const ALL_SHOP_SETS = [
  {
    id: "golden",
    name: "Golden Set",
    description: "Drape yourself in royal heritage. Includes the golden crown, sparkles, and a pure golden gradient background.",
    price: 24500,
    items: [
      { type: 'hat', key: 'golden_crown' },
      { type: 'decor', key: 'golden_sparkles' },
      { type: 'nameplate', key: 'golden' },
      { type: 'banner', key: 'golden' }
    ],
    itemsList: ["Golden Crown", "Golden Sparkles", "Golden Plate", "Golden Background"],
    bg: "bg-gradient-to-br from-[#2d1a00] to-[#1c1917]",
    accentColor: "#f59e0b",
    rarity: "Mythic"
  },
  {
    id: "rainbow",
    name: "Rainbow Set",
    description: "A spectacularly colorful set featuring a color-changing crown and the magical flying Uni Kitty.",
    price: 30000,
    items: [
      { type: 'hat', key: 'rainbow_crown' },
      { type: 'nameplate', key: 'rainbow' },
      { type: 'pet', key: 'uni_kitty' },
      { type: 'banner', key: 'rainbow' }
    ],
    itemsList: ["Rainbow Crown", "Rainbow Plate", "Uni Kitty Pet", "Rainbow Flow Banner"],
    bg: "bg-gradient-to-br from-[#1a0a1a] to-[#2d001a]",
    accentColor: "#ec4899",
    rarity: "Exotic"
  },
  {
    id: "sports",
    name: "Sports Set",
    description: "Show your athletic side with this stadium background, sports nameplate, and animated stickmen.",
    price: 9500,
    items: [
      { type: 'decor', key: 'stickmen' },
      { type: 'nameplate', key: 'sports' },
      { type: 'banner', key: 'sports' }
    ],
    itemsList: ["Sports Stickmen", "Sports Plate", "Sports Stadium"],
    bg: "bg-gradient-to-br from-[#022c22] to-[#064e3b]",
    accentColor: "#ea580c",
    rarity: "Epic"
  },
  {
    id: "magic",
    name: "Magic Set",
    description: "A mystical set featuring a witch hat, mysterious purple starry night, and a flying black cat.",
    price: 22000,
    items: [
      { type: 'hat', key: 'magic_hat' },
      { type: 'decor', key: 'flying_cat' },
      { type: 'nameplate', key: 'magic' },
      { type: 'banner', key: 'magic' }
    ],
    itemsList: ["Magic Hat", "Flying Magic Cat", "Magic Plate", "Magic Night"],
    bg: "bg-gradient-to-br from-[#2e1065] to-[#17052e]",
    accentColor: "#c084fc",
    rarity: "Mythic"
  },
  {
    id: "admin",
    name: "Admin Set",
    description: "For system administrators only. Intense binary code, glitching crown, and green matrix overflow.",
    price: 999999,
    items: [
      { type: 'hat', key: 'admin_crown' },
      { type: 'decor', key: 'admin_glitch' },
      { type: 'nameplate', key: 'hacker' },
      { type: 'banner', key: 'hacker' }
    ],
    itemsList: ["Admin Hacker Crown", "Admin Glitch", "Hacker Plate", "Hacker Matrix"],
    bg: "bg-gradient-to-br from-[#052e16] to-[#022c22]",
    accentColor: "#22c55e",
    rarity: "Exotic",
    isAdmin: true
  }
];
