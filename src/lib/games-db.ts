export interface GameMeta {
  updates?: { time: string; description: string }[];
  id: string;
  title: string;
  developer: string;
  type: "3D" | "2.5D" | "2D Top-Down" | "2D Platformer" | "Retro Emulator" | "Arcade" | "Sports" | "Puzzle" | "Strategy" | "Discovery" | "App" | "Action" | "Tactical Grid" | "2.5D Fighter" | "2D RTS" | (string & {});
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
    id: "titan",
    title: "Titan",
    developer: "Xakteir Studios",
    type: "Tactical Mecha RPG",
    genre: ["Tactical Mecha Citadel", "Foundry Shop & Cores", "Online Lobbies", "Kinetic Artillery", "Mobile Friendly"],
    description: "Tactical mecha combat, citadel foundry armory upgrades, and global online score competition in a 2,000+ line Tactical Mecha RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=titan",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "20:00", description: "2,000+ Line Flagship Launch" }],
    route: "/game/titan"
  },
  {
    id: "astral",
    title: "Astral",
    developer: "Xakteir Studios",
    type: "Celestial Gravity RPG",
    genre: ["Orbital Gravity Well", "Starforge Shop & Dust", "Online Lobbies", "Slingshot Physics", "Mobile Friendly"],
    description: "Orbital gravity well slingshot physics, starforge armory upgrades, and global online score competition in a 2,000+ line Celestial RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=astral",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "20:00", description: "2,000+ Line Flagship Launch" }],
    route: "/game/astral"
  },
  {
    id: "lumen",
    title: "Lumen",
    developer: "Xakteir Studios",
    type: "Tactical Sci-Fi RPG",
    genre: ["Tactical Energy Arena", "Armory Shop & Shards", "Online Lobbies", "Companion Drones", "Mobile Friendly"],
    description: "Tactical energy grid reflection, companion drone warfare, and global online rank competition in a 2,000+ line Sci-Fi RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=lumen",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "20:00", description: "2,000+ Line Flagship Launch" }],
    route: "/game/lumen"
  },
  {
    id: "torque",
    title: "Torque",
    developer: "Xakteir Studios",
    type: "Racing",
    genre: ["Kinetic Wheel Drift", "Garage Upgrades", "Overdrive Mode", "1P / 2P Modes", "Mobile Friendly"],
    description: "Harness angular drift momentum to dodge kinetic obstacles, harvest stardust credits, and unlock garage upgrades.",
    bannerUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=torque",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:50", description: "Batch 12 Addictive Upgrade" }],
    route: "/game/torque"
  },
  {
    id: "prism",
    title: "Prism",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["Light Refraction", "Optic Lab Upgrades", "Laser Multipliers", "1P / 2P Modes", "Mobile Friendly"],
    description: "Reflect light beams using precision crystal optics to hit matching frequency targets and unlock lab upgrades.",
    bannerUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=prism",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:50", description: "Batch 12 Addictive Upgrade" }],
    route: "/game/prism"
  },
  {
    id: "surge",
    title: "Surge",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Electrical Node Jumper", "Power Grid Station", "Volt Multipliers", "1P / 2P Modes", "Mobile Friendly"],
    description: "Zap between high-voltage power grid nodes to charge energy capacitors and avoid catastrophic short circuits.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=surge",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:50", description: "Batch 12 Addictive Upgrade" }],
    route: "/game/surge"
  },
  {
    id: "orbit",
    title: "Orbit",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["Planetary Slingshot", "Gravity Well", "Orbit Trajectory", "1P / 2P Modes", "Mobile Friendly"],
    description: "Slingshot satellites through planetary gravity wells and harvest stardust without crashing into planet surfaces.",
    bannerUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=orbit",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:40", description: "Batch 11 Launch" }],
    route: "/game/orbit"
  },
  {
    id: "vapor",
    title: "Vapor",
    developer: "Xakteir Studios",
    type: "Arcade Runner",
    genre: ["Thermal Phase Shift", "Condensation Vapor", "Phase Runner", "1P / 2P Modes", "Mobile Friendly"],
    description: "Toggle thermal phase state between Gas vapor and Liquid condensate to pass matching energy barriers.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=vapor",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:40", description: "Batch 11 Launch" }],
    route: "/game/vapor"
  },
  {
    id: "matrix",
    title: "Matrix",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["Neural Node Network", "Conductive Circuit", "Grid Alignment", "1P / 2P Modes", "Mobile Friendly"],
    description: "Align interconnected neural matrix nodes to complete conductive cyber grid circuits and stabilize network flow.",
    bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=matrix",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:40", description: "Batch 11 Launch" }],
    route: "/game/matrix"
  },
  {
    id: "kinesis",
    title: "Kinesis",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["Kinetic Vector", "Particle Attraction", "Gravitational Field", "1P / 2P Modes", "Mobile Friendly"],
    description: "Control kinetic gravitational attraction nodes to draw positive energy particles while repelling negative disruptions.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=kinesis",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:30", description: "Batch 10 Launch" }],
    route: "/game/kinesis"
  },
  {
    id: "zenith",
    title: "Zenith",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["Orbital Ascent", "Altitude Peak", "Apex Platforming", "1P / 2P Modes", "Mobile Friendly"],
    description: "Ascend procedural orbital platforms to reach peak zenith altitude without misstepping into the abyss.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=zenith",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:30", description: "Batch 10 Launch" }],
    route: "/game/zenith"
  },
  {
    id: "sonar",
    title: "Sonar",
    developer: "Xakteir Studios",
    type: "Discovery",
    genre: ["Subterranean Trench", "Abyssal Echolocation", "Sonar Echo", "1P / 2P Modes", "Mobile Friendly"],
    description: "Emit active sonar echo pings to navigate pitch-black subterranean trenches and retrieve submerged relics.",
    bannerUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=sonar",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:30", description: "Batch 10 Launch" }],
    route: "/game/sonar"
  },
  {
    id: "helix",
    title: "Helix",
    developer: "Xakteir Studios",
    type: "Quantum Bio-Genetic RPG",
    genre: ["DNA Strand Splicing", "Gene Foundry Armory", "Online Lobbies", "System Command Terminal", "Mobile Friendly"],
    description: "Quantum DNA strand splicing, gene foundry armory upgrades, online leaderboards, and bio codex in a 2,000+ line Bio-Genetic RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=helix",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:00", description: "2,000+ Line Flagship Launch" }],
    route: "/game/helix"
  },
  {
    id: "chrono",
    title: "Chrono",
    developer: "Xakteir Studios",
    type: "Temporal Paradox RPG",
    genre: ["Time Dilation", "Tachyon Armory", "Online Lobbies", "System Command Terminal", "Mobile Friendly"],
    description: "Temporal paradox shifts, tachyon armory upgrades, online leaderboards, and quantum codex in a 2,000+ line Temporal Paradox RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=chrono",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:00", description: "2,000+ Line Flagship Launch" }],
    route: "/game/chrono"
  },
  {
    id: "spectra",
    title: "Spectra",
    developer: "Xakteir Studios",
    type: "Chromatic Optic RPG",
    genre: ["Prismatic Refraction", "Optic Foundry Armory", "Online Lobbies", "System Command Terminal", "Mobile Friendly"],
    description: "Prismatic beam refractions, optic armory upgrades, online leaderboards, and quantum codex in a 2,000+ line Chromatic Optic RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=spectra",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:55", description: "2,000+ Line Flagship Launch" }],
    route: "/game/spectra"
  },
  {
    id: "glitch",
    title: "Glitch",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["Cybernetic Repair", "Data Stream", "Defrag EMP Pulse", "Single Player", "Mobile Friendly"],
    description: "Ascend corrupted data streams, leap across unstable glitch platforms, collect data fragments, and release defrag EMP pulses.",
    bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=glitch",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:00", description: "Batch 8 Single-Player Launch" }],
    route: "/game/glitch"
  },
  {
    id: "drift",
    title: "Drift",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Orbital Hovercraft", "Pylon Slalom", "Nitro Boost", "Single Player", "Mobile Friendly"],
    description: "Pilot a high-speed hovercraft down narrow neon slalom tracks, drift past pylon gates, and ignite nitro thrusters.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=drift",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:00", description: "Batch 8 Single-Player Launch" }],
    route: "/game/drift"
  },
  {
    id: "aether",
    title: "Aether",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["Zero-G Stardust", "Celestial Harmony", "Harmonic Pulse", "Single Player", "Mobile Friendly"],
    description: "Absorb glowing stardust embers in zero-G deep space while repelling void shadow anomalies with harmonic EMP shockwaves.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aether",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:00", description: "Batch 8 Single-Player Launch" }],
    route: "/game/aether"
  },
  {
    id: "vortex",
    title: "Vortex",
    developer: "Xakteir Studios",
    type: "Action",
    genre: ["Gravitational Singularity", "Black Hole Pull", "Cosmic Scrap", "Antimatter Avoidance", "Mobile Friendly", "2P War"],
    description: "Steer a gravitational singularity core to pull in cosmic scrap while avoiding volatile antimatter mines.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=vortex",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:55", description: "Batch 7 Mobile Launch" }],
    route: "/game/vortex"
  },
  {
    id: "flux",
    title: "Flux",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["Electromagnetic Accelerator", "Polarity Swapping", "Particle Capture", "Mobile Friendly", "2P Duel"],
    description: "Toggle magnetic flux polarity between Positive and Negative to attract opposite charges and avoid overcharge.",
    bannerUrl: "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=flux",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:55", description: "Batch 7 Mobile Launch" }],
    route: "/game/flux"
  },
  {
    id: "trench",
    title: "Trench",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["Abyssal Submersible", "Deep Dredging", "Sonar Flares", "Benthic Ore", "Mobile Friendly", "2P Race"],
    description: "Maneuver an oceanic research submersible down deep sea trenches, trigger sonar flares, and collect benthic mineral ores.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=trench",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:55", description: "Batch 7 Mobile Launch" }],
    route: "/game/trench"
  },
  {
    id: "nexus",
    title: "Nexus",
    developer: "Xakteir Studios",
    type: "Tactical Grid RPG",
    genre: ["Sub-Atomic Quantum Grid", "Foundry Armory & Flux", "Online Lobbies", "Ion Laser Turrets", "Mobile Friendly"],
    description: "Tactical grid defense, node chain reaction raytracing, armory shop, and global online score competition in a 2,000+ line Tactical Grid RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=nexus",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:35", description: "2,000+ Line Flagship Launch" }],
    route: "/game/nexus"
  },
  {
    id: "aura",
    title: "Aura",
    developer: "Xakteir Studios",
    type: "Action",
    genre: ["Harmonic Absorption", "Color Phase Shift", "Cyan Magenta Yellow", "Mobile Friendly", "2P Duel"],
    description: "Shift your elemental aura color state between Cyan, Magenta, and Yellow to absorb matching color energy surges.",
    bannerUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aura",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:45", description: "Batch 6 Mobile Launch" }],
    route: "/game/aura"
  },
  {
    id: "cinder",
    title: "Cinder",
    developer: "Xakteir Studios",
    type: "Thermal Magma RPG",
    genre: ["Magma Eruption", "Thermal Forge Armory", "Online Lobbies", "System Command Terminal", "Mobile Friendly"],
    description: "Thermal magma eruption, forge shop upgrades, online leaderboards, and magma codex in a 2,000+ line Thermal Magma RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cinder",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "19:00", description: "2,000+ Line Flagship Launch" }],
    route: "/game/cinder"
  },
  {
    id: "pulse",
    title: "Pulse",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Rhythm", "Corridor Defense", "Beat Sync", "Synth", "Mobile Friendly", "2P Battle"],
    description: "Shift electro lanes and trigger timed pulse shockwaves on the beat to synchronize viral nodes before energy overload.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=pulse",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:30", description: "Batch 5 Mobile Launch" }],
    route: "/game/pulse"
  },
  {
    id: "aegis",
    title: "Aegis",
    developer: "Xakteir Studios",
    type: "Action",
    genre: ["Orbital Shield", "360 Deflector", "Plasma Battery", "Mobile Friendly", "2P Arena"],
    description: "Rotate a 360-degree orbital aegis barrier to deflect incoming plasma energy bolts back at hostile battery stations.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aegis",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:30", description: "Batch 5 Mobile Launch" }],
    route: "/game/aegis"
  },
  {
    id: "strata",
    title: "Strata",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["Geothermal Drill", "Tectonic Dig", "Minerals", "Magma Avoidance", "Mobile Friendly", "2P Race"],
    description: "Excavate down through geological rock strata, gather subterranean mineral gems, and avoid thermal magma pockets.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=strata",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:30", description: "Batch 5 Mobile Launch" }],
    route: "/game/strata"
  },
  {
    id: "vault",
    title: "Vault",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["Stealth", "Laser Grid", "Hacking", "Tumbler Lock", "Action", "2P Heist"],
    description: "Infiltrate high-security vault matrices, bypass sweeping laser grids, and hack electronic tumbler locks before security lockdown.",
    bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=vault",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:15", description: "Batch 4 Launch" }],
    route: "/game/vault"
  },
  {
    id: "solace",
    title: "Solace",
    developer: "Xakteir Studios",
    type: "Discovery",
    genre: ["Submarine", "Sonar", "Deep Sea", "Exploration", "Leviathan", "2P Duel"],
    description: "Navigate bioluminescent ocean caverns using sonar echoes, collect energy crystals, and evade abyssal ocean leviathans.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=solace",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:15", description: "Batch 4 Launch" }],
    route: "/game/solace"
  },
  {
    id: "forge",
    title: "Forge",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Crafting", "Plasma", "Elements", "Weapon Forge", "Action", "2P Clash"],
    description: "Catch falling fire, ice, and lightning plasma sparks to forge legendary elemental weapons on an interactive blacksmith anvil.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=forge",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:15", description: "Batch 4 Launch" }],
    route: "/game/forge"
  },
  {
    id: "cipher",
    title: "Cipher",
    developer: "Xakteir Studios",
    type: "Cyberpunk Hacking RPG",
    genre: ["Quantum Hacking Matrix", "Darknet Foundry Armory", "Online Lobbies", "System Command Terminal", "Mobile Friendly"],
    description: "Cyberpunk node overrides, darknet armory upgrades, online leaderboards, and quantum codex in a 2,000+ line Cyberpunk Hacking RPG arena.",
    bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cipher",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:55", description: "2,000+ Line Flagship Launch" }],
    route: "/game/cipher"
  },
  {
    id: "circuit",
    title: "Circuit",
    developer: "Xakteir Studios",
    type: "2D Top-Down",
    genre: ["Racing", "Drift", "Physics", "Speedcraft", "2P Duel"],
    description: "Master vector drift momentum, trigger kinetic turbo boosts, and set record lap times around high-speed neon circuits.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=circuit",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:00", description: "Batch 3 Launch" }],
    route: "/game/circuit"
  },
  {
    id: "bastion",
    title: "Bastion",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["Fortress Builder", "Tower Defense", "Wave Siege", "Co-Op", "Action"],
    description: "Construct plasma defense turrets, fortify energy barrier walls, and defend central power cores against invading alien wave sieges.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=bastion",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:00", description: "Batch 3 Launch" }],
    route: "/game/bastion"
  },
  {
    id: "cyber-helix-quantum-siege",
    title: "Cyber Helix: Quantum Siege",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "Action", "Bullet Hell", "Arcade", "Cyberpunk", "Rogue-lite"],
    description: "High-octane 2D cyberpunk Rogue-lite space interceptor shooter. Pilot apex starfighters, trigger EMP shockwaves, level up matrix perks, collect plasma energy cores, and obliterate multi-stage Helix Core boss dreadnoughts.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyber-helix-quantum-siege",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:00", description: "Official Release" }],
    route: "/game/cyber-helix-quantum-siege"
  },
  {
    id: "cyber_helix_quantum_siege",
    title: "Cyber Helix: Quantum Siege",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "Action", "Bullet Hell", "Arcade", "Cyberpunk", "Rogue-lite"],
    description: "High-octane 2D cyberpunk Rogue-lite space interceptor shooter. Pilot apex starfighters, trigger EMP shockwaves, level up matrix perks, collect plasma energy cores, and obliterate multi-stage Helix Core boss dreadnoughts.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyber-helix-quantum-siege",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "18:00", description: "Official Release" }],
    route: "/game/cyber-helix-quantum-siege"
  },
  {
    id: "plasma-strike-cyber-overdrive",
    title: "Plasma Strike: Cyber Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "Action", "Bullet Hell", "Arcade", "Cyberpunk", "Space"],
    description: "Ultra-kinetic arcade space shooter featuring dynamic boss battles, wave survival, procedural retro WebAudio synthesis, companion drones, and super nuke abilities.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=plasma-strike",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "17:00", description: "Cyber Overdrive Update" }],
    route: "/game/plasma-strike-cyber-overdrive"
  },
  {
    id: "apex",
    title: "Apex",
    developer: "Xakteir Studios",
    type: "Tactical Grid",
    genre: ["Sci-Fi", "Strategy", "Tactical", "Turn-Based", "2-Player", "Arcade", "Cyberpunk"],
    description: "Cyberpunk turn-based grid tactics. Deploy AP action point commands, leverage barrier cover, and eliminate rival squad commanders in 1P campaign or 2P local duel.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=apex",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "22:30", description: "Official Launch" }],
    route: "/game/apex"
  },
  {
    id: "rift",
    title: "Rift",
    developer: "Xakteir Studios",
    type: "2.5D Fighter",
    genre: ["Sci-Fi", "Action", "Gravity", "2-Player", "Portal", "Arcade", "Combat"],
    description: "High-speed spatial gravity & portal fighter. Step through teleport rifts, invert gravity fields, and discharge kinetic blasts in 1P spatial trials or 2P head-to-head duels.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=rift",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "22:30", description: "Official Launch" }],
    route: "/game/rift"
  },
  {
    id: "sovereign",
    title: "Sovereign",
    developer: "Xakteir Studios",
    type: "2D RTS",
    genre: ["Strategy", "RTS", "Fleet", "2-Player", "Sci-Fi", "Multiplayer", "Space Conquest"],
    description: "Orbital node space RTS. Launch starship armadas, capture planetary energy nodes, and command galactic fleet sectors in 1P galaxy conquest or 2P local fleet warfare.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=sovereign",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "22:30", description: "Official Launch" }],
    route: "/game/sovereign"
  },
  {
    id: "stasis",
    title: "Stasis",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sci-Fi", "3D", "Action", "Tactical", "Multiplayer", "2-Player", "Arcade", "Time Dilation"],
    description: "Tactical time-dilation arena combat. Freeze enemy fire, deploy localized stasis pulses, and outmaneuver combat droids in 1P survival or 2-Player head-to-head duels.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=stasis",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "22:00", description: "Official Launch" }],
    route: "/game/stasis"
  },
  {
    id: "vanguard",
    title: "Vanguard",
    developer: "Xakteir Studios",
    type: "2D Top-Down",
    genre: ["Sci-Fi", "Action", "Mech", "2-Player", "Arcade", "Cyberpunk", "Combat"],
    description: "Next-gen cybernetic mech brawler. Execute frame-perfect plasma blade parries, vent reactor core heat, and trigger homing missile barrages in intense 1v1 duels.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=vanguard",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "22:00", description: "Official Launch" }],
    route: "/game/vanguard"
  },
  {
    id: "gridiron",
    title: "Gridiron",
    developer: "Xakteir Studios",
    type: "2.5D",
    genre: ["Sports", "Action", "Arcade", "2-Player", "Physics", "Multiplayer", "Hover Sports"],
    description: "High-velocity cybernetic hover hockey. Utilize impulse thrusters and magnetic tractor beams to slam plasma pucks into goal nets in 1P league or 2P versus matches.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=gridiron",
    releaseDate: "2026",
    price: "Free",
    updates: [{ time: "22:00", description: "Official Launch" }],
    route: "/game/gridiron"
  },
  {
    id: "aetheris_astral_eclipse",
    title: "Aetheris: Astral Eclipse",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell", "Cyberpunk"],
    description: "Next-gen cybernetic rogue-lite space interceptor shooter. Pilot apex starfighters, harvest cosmic plasma, unlock tachyon matrix upgrades, and eliminate invading void dreadnoughts.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aetherisastraleclipse",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "21:00", description: "Official Game Release" }
    ],
    route: "/game/aetheris-astral-eclipse"
  },
  {
    id: "quantum_horizon_overdrive",
    title: "Quantum Horizon Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell", "Cyberpunk"],
    description: "Next-gen cybernetic rogue-lite space interceptor shooter. Pilot apex starfighters, trigger graviton EMP shockwaves, perform time-dilation iframe dashes, harvest plasma core matrix upgrades, and eliminate multi-stage Hyperion boss dreadnoughts.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=quantumhorizonoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "20:00", description: "Official Game Release" }
    ],
    route: "/game/quantum-horizon-overdrive"
  },
  {
    id: "hyper_aether_overdrive",
    title: "Hyper Aether Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell", "Cyberpunk"],
    description: "Next-gen cybernetic rogue-lite space interceptor shooter. Pilot apex starfighters, trigger graviton EMP shockwaves, perform time-dilation iframe dashes, harvest plasma core matrix upgrades, and eliminate multi-stage Hyperion boss dreadnoughts.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=hyperaetheroverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:25", description: "Official Game Release" }
    ],
    route: "/game/hyper-aether-overdrive"
  },
  {
    id: "starlight_valkyrie_horizon",
    title: "Starlight Valkyrie Horizon",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell", "Cyberpunk"],
    description: "Ultra-premium sci-fi space interceptor shooter. Command the Starlight Valkyrie flagship, deploy graviton EMP waves, unlock tachyon matrix augments, master orbital laser drone arrays, and obliterate multistage cosmic leviathans.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=starlightvalkyriehorizon",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:05", description: "Official Game Launch" }
    ],
    route: "/game/starlight-valkyrie-horizon"
  },
  {
    id: "aether_zenith_cyber_horizon",
    title: "Aether Zenith: Cyber Horizon",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell", "Cyberpunk"],
    description: "High-octane next-gen cybernetic rogue-lite space shooter. Command apex space interceptors, unleash tachyon matrix augmentations, engage in multistage dreadnought boss fights, and dominate the cosmic arena.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aetherzenithcyberhorizon",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "18:05", description: "Official Game Release" }
    ],
    route: "/game/aether-zenith-cyber-horizon"
  },
  {
    id: "neon_vanguard_overdrive",
    title: "Neon Vanguard Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell", "Cyberpunk"],
    description: "High-octane cybernetic rogue-lite space shooter. Command the Neon Vanguard interceptor, unleash EMP shockwaves, level up matrix upgrades, deploy autonomous laser drones, switch between 5 plasma weapons, and defeat alien dreadnought armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=neonvanguardoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "17:00", description: "Initial Game Launch" }
    ],
    route: "/game/neon-vanguard-overdrive"
  },
  {
    id: "cyber_phantom_odyssey",
    title: "Cyber Phantom Odyssey",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell"],
    description: "Tactical cybernetic space shooter. Command your Cyber Phantom interceptor, unleash EMP shockwaves, activate phase dashes, upgrade quantum railguns, and conquer invading dreadnought armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberphantomodyssey",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "16:10", description: "Initial Game Release" }
    ],
    route: "/game/cyber-phantom-odyssey"
  },
  {
    id: "void_sentinel_overdrive",
    title: "Void Sentinel Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell"],
    description: "Tactical cybernetic space survival. Command your Sentinel, unleash graviton shockwaves, unlock piercing quantum hyper-railguns, deploy orbital drones, and conquer alien dreadnought armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=voidsentineloverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "15:00", description: "Initial Game Launch" }
    ],
    route: "/game/void-sentinel-overdrive"
  },
  {
    id: "hyperion_void_surge",
    title: "Hyperion Void Surge",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell"],
    description: "Tactical space combat survival game. Command the Hyperion interceptor, unleash Graviton Nova EMPs, switch between 5 plasma weapon arrays, defeat void dreadnoughts, and master the orbital battlefield.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=hyperionvoidsurge",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "13:15", description: "Initial Game Release" }
    ],
    route: "/game/hyperion-void-surge"
  },
  {
    id: "solaris_valkyrie_odyssey",
    title: "Solaris Valkyrie Odyssey",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell"],
    description: "High-octane cybernetic space shooter. Command your Solaris Valkyrie interceptor, unleash EMP shockwaves, activate tachyon time shifts, upgrade plasma cannons, and destroy alien dreadnought armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=solarisvalkyrieodyssey",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:00", description: "Initial Game Release" }
    ],
    route: "/game/solaris-valkyrie-odyssey"
  },
  {
    id: "chronos_nexus_overdrive",
    title: "Chronos Nexus Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Base Defense"],
    description: "High-octane 2D cyberpunk space shooter and tactical Nexus Core defense. Command your interceptor mech, deploy time-dilation fields, execute tachyon dashes, unlock matrix upgrades, and eliminate invading AI dreadnought armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=chronosnexusoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:30", description: "Initial Game Release" }
    ],
    route: "/game/chronos-nexus-overdrive"
  },
  {
    id: "apex_valkyrie_overdrive",
    title: "Apex Valkyrie Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell"],
    description: "High-octane cybernetic space shooter. Command your Apex Valkyrie interceptor, unleash EMP shockwaves, activate tachyon time shifts, upgrade plasma cannons, and destroy alien dreadnought armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=apexvalkyrieoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:04", description: "Initial Game Launch" }
    ],
    route: "/game/apex-valkyrie-overdrive"
  },
  {
    id: "astral_pulse_overdrive",
    title: "Astral Pulse Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Bullet Hell"],
    description: "High-octane space survival arcade shooter. Command your Astral Vanguard, unleash devastating EMP shockwaves, deploy orbital defense drones, and conquer rogue cosmic armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=astralpulseoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "18:04", description: "Initial Game Launch" }
    ],
    route: "/game/astral-pulse-overdrive"
  },
  {
    id: "nebula_nexus_overdrive",
    title: "Nebula Nexus Overdrive",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival", "Base Defense"],
    description: "High-octane 2D space shooter and tactical nexus core defense. Command an apex starfighter, deploy EMP shockwaves and tachyon dashes, harvest plasma crystals, and defeat invading rogue AI armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=nebulanexusoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "17:08", description: "Initial Game Launch" }
    ],
    route: "/game/nebula-nexus-overdrive"
  },
  {
    id: "chrono_vanguard_paradox_shift",
    title: "Chrono Vanguard: Paradox Shift",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Survival"],
    description: "Pilot your apex Tachyon Vanguard starfighter in a high-octane 2D arena survival shooter. Deploy time-dilation fields, tactical dashes, plasma cannons, and conquer rogue temporal paradox armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=chronovanguard",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "16:05", description: "Initial Game Release" }
    ],
    route: "/game/chrono-vanguard-paradox-shift"
  },
  {
    id: "cyber_vortex_odyssey",
    title: "Cyber Vortex Odyssey",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Arcade", "Bullet Hell"],
    description: "High-octane 2D cyberpunk rogue-lite space arcade shooter. Command apex starfighters, unlock tactical matrix perks, collect neon credits, and conquer alien rogue AI armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cybervortexodyssey",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:05", description: "Initial Game Launch" }
    ],
    route: "/game/cyber-vortex-odyssey"
  },
  {
    id: "shadow_shinobi_platformer",
    title: "Shadow Shinobi",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D Platformer", "Action", "Cyberpunk", "Ninja", "Mobile Friendly"],
    description: "High-octane cyberpunk ninja platformer with wall-jumping, katana slicing, shuriken projectiles, and full mobile touch controls.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=shadowshinobiplatformer",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/shadow-shinobi-platformer"
  },
  {
    id: "frost_bound_odyssey",
    title: "Frostbound Quest",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D Platformer", "Precision", "Arctic", "Survival", "Mobile Friendly"],
    description: "Arctic ice precision platformer with slippery ice physics, falling icicle hazards, thermal warmth management, and mobile touch controls.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=frostboundodyssey",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/frost-bound-odyssey"
  },
  {
    id: "pyro_core_escape",
    title: "Pyro Core Escape",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D Platformer", "Magma", "Action", "Jetpack", "Mobile Friendly"],
    description: "Vertical volcanic magma escape platformer with jetpack thrusting, crumbling platforms, rising lava, and mobile touch controls.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=pyrocoreescape",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/pyro-core-escape"
  },
  {
    id: "zero_g_orbital_runner",
    title: "Zero-G Space Runner",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D Platformer", "Sci-Fi", "Gravity", "Space", "Mobile Friendly"],
    description: "Zero-gravity sci-fi space station platformer featuring instant gravity inversion, laser field obstacles, energy cells, and mobile touch controls.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=zerogorbitalrunner",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/zero-g-orbital-runner"
  },
  {
    id: "steampunk_clockwork_climb",
    title: "Steampunk Clockwork Climb",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D Platformer", "Steampunk", "Mechanical", "Tower", "Mobile Friendly"],
    description: "Brass steampunk clocktower platformer with rotating gear platforms, swinging pendulum blades, steam burst double jumps, and mobile touch controls.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=steampunkclockworkclimb",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/steampunk-clockwork-climb"
  },
    {
    id: "chronoshift_overdrive",
    title: "Chrono Dash",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D Top-Down", "Action", "Cyberpunk", "Time-Warp", "Rogue-lite", "Shooter"],
    description: "High-octane 2D cyberpunk survival shooter. Manipulate time, upgrade your mech with modular perks, and battle rogue AI armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=chronoshiftoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/chronoshift-overdrive"
  },
  {
    id: "nexus_arena_online",
    title: "Cyber Arena: Cyber Strike Online",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D Top-Down", "Action", "Cyberpunk", "Multiplayer", "Online", "PvP"],
    description: "High-octane cyberpunk arena combat featuring 1P Arcade vs AI, Local 2-Player Versus, and Real-time Online Room Matchmaking with P2P sync and live chat.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=nexusarenaonline",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/nexus-arena-online"
  },
  {
    id: "aether_mech_overdrive",
    title: "Sky Mech: Dash",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D Top-Down", "Action", "Cyberpunk", "Mech", "Sci-Fi", "Shooter"],
    description: "High-octane tactical 2D cyber-mech arcade combat. Pilot customizable combat mechs, deploy time-warp matrix abilities, level up perks, and conquer rogue AI armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aethermechoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/aether-mech-overdrive"
  },
  {
    id: "quantum_helix_cyber_odyssey",
    title: "Cyber Spin: Cyber Quest",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D", "Arcade", "Shooter", "Cyberpunk", "Space", "Action"],
    description: "High-octane 2D cyberpunk space arcade combat. Command starfighters, upgrade plasma weapons, deploy automated defense drones, and conquer rogue AI armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=quantumhelixcyberodyssey",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/quantum-helix-cyber-odyssey"
  },
  {
    id: "neon_ascent",
    title: "Neon Ascent 2D",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D", "Platformer", "Precision", "Cyberpunk", "Action"],
    description: "High-precision 2D cyberpunk platformer with wall jumping, air dashes, keycards, laser vaults, spikes, and 5 level stages.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=neonascent",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/neon-ascent"
  },
  {
    id: "quantum_tactics",
    title: "Cyber Tactics RPG",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["RPG", "Turn-Based", "Tactical", "Strategy", "Grid"],
    description: "Grid-based tactical cyberpunk turn-based RPG. Position cyber samurai, manage Action Points (AP), cast elemental spells, and defeat enemy mechs.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=quantumtactics",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/quantum-tactics"
  },
  {
    id: "orbital_puzzle",
    title: "Space Laser Puzzle",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["Puzzle", "Logic", "Optics", "Laser", "Physics"],
    description: "Physics laser optics logic puzzle. Rotate precision 45-degree mirrors and beam splitters to power target cores across 5 stages.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=orbitalpuzzle",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/orbital-puzzle"
  },
  {
    id: "vector_dash",
    title: "Vector Dash Retro",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["3D", "Runner", "Racing", "Synthwave", "Arcade"],
    description: "3D perspective synthwave cyber highway runner. Switch lanes, leap over plasma barriers, trigger nitro overdrive, and upgrade vehicle tech.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=vectordash",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/vector-dash"
  },
  {
    id: "starlight_commander",
    title: "Starlight Commander",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D Top-Down", "Shooter", "Space", "Sci-Fi", "Arcade"],
    description: "Sci-Fi vertical space arcade shooter. Pilot your starfighter through hostile armadas, unlock plasma cannons, and defeat motherships.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=starlightcommander",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/starlight-commander"
  },
  {
    id: "cyber_quest_platformer",
    title: "Cyber Quest Platformer 2D",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D", "Platformer", "Action", "Cyberpunk", "Level-Based"],
    description: "5-level precision 2D platformer with double jump, wall slide, key-door puzzles, spike hazards, and checkpoint flags.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberquestplatformer",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/cyber-quest-platformer"
  },
  {
    id: "cyber_dungeon_rpg",
    title: "Cyber Dungeon RPG 2D",
    developer: "Xakteir Studios",
    type: "Discovery",
    genre: ["2D", "RPG", "Retro", "Turn-Based", "Cyberpunk", "Strategy"],
    description: "Turn-based retro 2D grid dungeon RPG with character stat leveling, plasma spell casting, nanite healing, merchant shop, and floor boss encounters.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberdungeonrpg",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/cyber-dungeon-rpg"
  },
  {
    id: "quantum_laser_puzzle",
    title: "Cyber Laser Optics 2D",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["2D", "Puzzle", "Logic", "Optics", "Laser", "Brain"],
    description: "Raycasting optics laser logic puzzle. Rotate double-sided mirrors and beam splitters to illuminate target sensors across 10 levels.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=quantumlaserpuzzle",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/quantum-laser-puzzle"
  },
  {
    id: "neon_core_defense",
    title: "Neon Core Defense 2D",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["2D", "Strategy", "Tower Defense", "Sci-Fi", "Tactical"],
    description: "Top-down tactical 2D tower defense. Deploy plasma cannons, EMP stunners, and heavy rockets to defend the reactor core from 10 enemy waves.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=neoncoredefense",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/neon-core-defense"
  },
  {
    id: "cyber_drift_runner",
    title: "Cyber Drift Runner 2D",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D", "Arcade", "Racing", "Drift", "Synthwave", "Time Trial"],
    description: "Top-down precision 2D synthwave drift racer. Master angular drift physics, set lap time records, and race through glowing neon circuits.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberdriftrunner",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/cyber-drift-runner"
  },
  {
    id: "cyber_leap_odyssey",
    title: "CyberLeap Quest",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D", "Platformer", "Action", "Cyberpunk", "Level-Based"],
    description: "8-level precision platformer with dash mechanics, wall sliding, laser hazards, particle trails, and procedural sound FX.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberleapodyssey",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/cyber-leap-odyssey"
  },
  {
    id: "aetheria_realm_of_shadows",
    title: "Sky: Shadow Realm",
    developer: "Xakteir Studios",
    type: "2D Top-Down",
    genre: ["RPG", "Dungeon Crawler", "Turn-Based", "Fantasy", "Retro"],
    description: "Turn-based retro dungeon crawler RPG. Choose Paladin, Archmage, or Assassin, cast elemental spells, and slay the Shadow Oni.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aetheriarealmofshadows",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/aetheria-realm-of-shadows"
  },
  {
    id: "aegis_protocol_td",
    title: "Shield Code TD",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["Strategy", "Tower Defense", "Grid", "Cyberpunk", "Tactical"],
    description: "Tactical grid tower defense strategy. Build Gatling cannons, Frost beams, Plasma mortars, and Nuke launchers to defend against creep waves.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aegisprotocoltd",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/aegis-protocol-td"
  },
  {
    id: "quantum_prism_puzzle",
    title: "Cyber Light Puzzles",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["Puzzle", "Logic", "Optics", "Physics", "Laser"],
    description: "Optics physics laser grid puzzles. Rotate mirrors and beam splitters to energize target cores across 8 levels.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=quantumprismpuzzle",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/quantum-prism-puzzle"
  },
  {
    id: "synthwave_beat_rush",
    title: "Retro Beat Rush",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Arcade", "Rhythm", "Music", "Synthwave", "Neon"],
    description: "4-lane synthwave rhythm action game. Tap keys in perfect sync with electro synth beats across 3 original tracks.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=synthwavebeatrush",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/synthwave-beat-rush"
  },

  {
    id: "cyber_runner_platformer",
    title: "Cyber Runner 2D",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D", "Platformer", "Precision", "Level-Based", "Action"],
    description: "Precision 2D cyberpunk level platformer. Master double jumps, air dashes, keycards, laser vaults, and energy orb collection.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberrunnerplatformer",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/cyber-runner-platformer"
  },
  {
    id: "cyber_dungeon_rpg",
    title: "Cyber Dungeon RPG",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["2D", "RPG", "Dungeon Crawler", "Turn-Based", "Cyberpunk"],
    description: "Retro top-down grid cyberpunk RPG. Battle rogue mechs, collect credits, upgrade hero stats, and conquer sector floor bosses.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberdungeonrpg",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/cyber-dungeon-rpg"
  },
  {
    id: "quantum_grid_puzzle",
    title: "Cyber Grid Puzzle",
    developer: "Xakteir Studios",
    type: "Puzzle",
    genre: ["2D", "Puzzle", "Logic", "Laser", "Brain Teaser"],
    description: "Laser refraction logic puzzle. Rotate quantum mirrors, beam splitters, and energy filters to power target receptors.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=quantumgridpuzzle",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/quantum-grid-puzzle"
  },
  {
    id: "synthwave_velocity_runner",
    title: "Retro Velocity Runner",
    developer: "Xakteir Studios",
    type: "Sports",
    genre: ["3D", "Racing", "Runner", "Synthwave", "Arcade"],
    description: "High-speed 3D perspective synthwave highway runner. Dodge barriers, collect energy rings, and trigger nitro overdrive.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=synthwavevelocityrunner",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/synthwave-velocity-runner"
  },
  {
    id: "cyber_pinball_odyssey",
    title: "Cyber Pinball Quest",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D", "Arcade", "Physics", "Pinball", "Retro"],
    description: "Cyberpunk 2D physics pinball arcade. Trigger neon bumpers, flipper combos, quantum multipliers, and multiballs.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberpinballodyssey",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/cyber-pinball-odyssey"
  },
  {
    id: "aether_pulse_2d",
    title: "Sky Pulse 2D",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["2D", "Platformer", "Puzzle", "Level-Based", "Gravity"],
    description: "Precision 2D level-based gravity puzzle explorer. Shift gravity directions to bypass energy grids and unlock 15 sector gates.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aetherpulsed",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/aether-pulse"
  },
  {
    id: "sector_9_rpg",
    title: "Sector 9 Cyber RPG",
    developer: "Xakteir Studios",
    type: "2D Top-Down",
    genre: ["2D", "RPG", "Cyberpunk", "Turn-Based", "Tactical"],
    description: "Tactical cyberpunk turn-based RPG. Command Kai, Vex, and Lyra, hack enemy defense nodes, and conquer sector dungeons.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=sectorrpg",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/sector-9-rpg"
  },
  {
    id: "gravity_racer_2d",
    title: "Gravity Racer 2099",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D", "Racing", "Physics", "Stunt", "Arcade"],
    description: "2D physics hovercraft racing & stunt trials. Balance anti-gravity thrust, activate nitro boosts, and beat speed trial records.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=gravityracerd",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/gravity-racer"
  },
  {
    id: "nexus_grid_defense_2d",
    title: "Cyber Grid Defense",
    developer: "Xakteir Studios",
    type: "Strategy",
    genre: ["2D", "Strategy", "Tower Defense", "Tactical"],
    description: "Real-time tactical grid tower defense. Build plasma cannons, laser turrets, and defend the Nexus Core against corrupted AI node waves.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=nexusgriddefensed",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/nexus-grid-defense"
  },
  {
    id: "stellar_strike_2d",
    title: "Star Strike 2D",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["2D", "Shooter", "Arcade", "Space", "Bullet-Hell"],
    description: "Vertical arcade bullet-hell space shooter. Blast enemy interceptors, collect plasma upgrades, and defeat Dreadnought Boss Armadas.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=stellarstriked",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/stellar-strike-2d"
  },
  {
    id: "shadow_blade_2d",
    title: "Shadow Blade 2D",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["Action", "Cyberpunk", "2D", "Ninja", "Hack and Slash", "Canvas"],
    description: "High-octane 2D cyberpunk shinobi action. Slice rogue ninjas, deflect plasma bolts, execute cyber dashes, and battle Shadow Oni bosses.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=shadowbladed",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/shadow-blade"
  },
  {
    id: "cyber_nexus_survivor",
    title: "Cyber Cyber Survivor 2D",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Sci-Fi", "2D", "Action", "Rogue-lite", "Survivor", "Bullet Hell"],
    description: "Top-down 2D cyberpunk action survivor. Survive endless mech armadas, collect XP gems, unlock plasma katana perks, and defeat sector dreadnought bosses.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cybernexussurvivor",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/cyber-nexus-survivor"
  },
  {
    id: "neon_ronin",
    title: "Neon Ronin 2099",
    developer: "Xakteir Studios",
    type: "2D Platformer",
    genre: ["Action", "Cyberpunk", "2D", "Platformer", "Hack and Slash"],
    description: "Slice through rogue cyber ninjas, deflect incoming plasma bursts, execute double jumps, and unleash Cyber Blitz in 2D platforming action.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=neonronin",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/neon-ronin"
  },
  {
    id: "aether_strike",
    title: "Sky Strike 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sci-Fi", "3D", "Action", "Shooter", "Arcade"],
    description: "Pilot your apex starfighter through hostile cyber armadas. Master EMP shockwaves, homing missiles, upgrade ship systems, and conquer sector dreadnoughts.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aetherstrike",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/aether-strike"
  },
  {
    id: "stellar_overlord",
    title: "Star Boss 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sci-Fi", "3D", "Action", "Shooter", "Arcade"],
    description: "Pilot your apex cyber starfighter through hostile armadas in 3D. Master Warp Speed, EMP Shockwaves, upgrade ship subsystems, and conquer Sector Overlord Bosses.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=stellaroverlord",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/stellar-overlord"
  },
  {
    id: "chronos_protocol",
    title: "Chronos Code 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sci-Fi", "3D", "Action", "Shooter", "Bullet Time"],
    description: "Control temporal mechanics, manipulate bullet-time time dilation, trigger tachyon shockwaves, and defeat endless synthwave armadas in 3D.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=chronosprotocol",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/chronos-protocol"
  },
  {
    id: "nexus_overdrive",
    title: "Cyber Dash 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sci-Fi", "3D", "Action", "Shooter", "Space Fighter"],
    description: "Pilot your custom cyber starfighter through hostile armadas in 3D. Unleash homing missiles, activate hyper overdrive, upgrade weapons, and conquer the sector.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=nexusoverdrive",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/nexus-overdrive"
  },
  {
    id: "super_stick_battles",
    title: "Super Stick Battles",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Action", "Fighting", "Arcade", "2D"],
    description: "High-octane stickman brawler featuring intense wave survival, 1v1 AI duels, customizable cyber skins, procedural synthwave weapons, and explosive rage ultimate abilities.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=superstickbattles",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/super-stick-battles"
  },
  {
    id: "aero_phantom",
    title: "Aero Phantom 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Flight", "3D", "Action", "Dogfight", "Shooter"],
    description: "Pilot an apex supersonic jet fighter across futuristic synthwave canyons in 3D. Lock onto enemy stealth drones with heat-seeking missiles, fire plasma vulcan cannons, and deploy flare countermeasures.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=aerophantom",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/aero-phantom"
  },
  {
    id: "solar_tempest",
    title: "Solar Storm 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sci-Fi", "3D", "Action", "Shooter", "Arcade"],
    description: "Command your apex starfighter across an erupting solar flare sector in 3D. Destroy mech drones, harvest energy matrix crystals, dodge asteroids, and unleash seeker missiles.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=solartempest",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/solar-tempest"
  },
  {
    id: "hyper_horizon",
    title: "Hyper Sky 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Racing", "Sci-Fi", "3D", "Action", "Arcade"],
    description: "Pilot your synthwave apex starfighter across a 3D procedural neon horizon. Shoot rogue pylons, trigger hyper boosts, collect quantum credits, and conquer lightspeed.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=hyperhorizon",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/hyper-horizon"
  },
  {
    id: "quantum_surge",
    title: "Cyber Surge 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Action", "Sci-Fi", "3D", "Arcade"],
    description: "Blast through infinite synthwave highways in 3D. Dodge quantum barriers, trigger hyper boosts, collect shields, and set new high scores.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=quantumsurge",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/quantum-surge"
  },
  {
    id: "quantum_vanguard",
    title: "Cyber Guard 2099",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Action", "Sci-Fi", "Shooter", "Arcade"],
    description: "Pilot your apex starfighter against infinite synthwave armadas. Master time dilation, EMP blasts, procedural Web Audio SFX, and quantum arsenal upgrades.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=quantumvanguard",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/quantum-vanguard"
  },
  {
    id: "void_vanguard",
    title: "Void Guard 3D",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sci-Fi", "3D", "Action", "Shooter", "Space Fighter"],
    description: "Apex sci-fi starfighter battle simulator. Unleash EMP shockwaves, homing missile swarms, quantum beams, upgrade ship subsystems, and conquer dreadnought bosses.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=voidvanguard",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/void-vanguard"
  },
  {
    id: "cyber_pulse",
    title: "Cyber Pulse 2099",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Action", "Sci-Fi", "Shooter", "Arcade"],
    description: "Pilot your high-tech starfighter against endless swarms of rogue mechs. Upgrade weapons, unleash EMP blasts, and dominate the galaxy.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cyberpulse",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/games/cyber-pulse"
  },
  {
    id: "neon_velocity",
    title: "Neon Velocity 2099",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Racing", "Sci-Fi", "Action", "Arcade"],
    description: "Blast through neon synthwave highways at breakneck speeds. Dodge obstacles, fire plasma cannons, collect credits, and upgrade your vehicle.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=neonvelocity",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/game/neon-velocity"
  },
  {
    id: "code_arena",
    title: "Code Arena",
    developer: "Xakteir Studios",
    type: "Arcade",
    genre: ["Coding", "Multiplayer", "Competitive"],
    description: "Race against other developers to solve algorithmic challenges in real-time. The first to pass all test cases wins the battle.",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=codearena",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/games/code-arena"
  },
  {
    id: "xaksports",
    title: "XakSports",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Sports", "Multiplayer", "Physics"],
    description: "The ultimate 3D local and online multiplayer sports arena. Play 1v1 splitscreen or 4-player chaos.",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=xaksports",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/xaksports"
  },
  {
    id: "xakarena",
    title: "XakArena",
    developer: "Xakteir Studios",
    type: "3D",
    genre: ["Shooter", "Action", "FPS"],
    description: "Fast-paced 3D arena shooter powered by WebGL. Lock and load.",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=xakarena",
    releaseDate: "Coming Soon",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/xakarena"
  },
  {
    id: "retro_engine",
    title: "Retro Engine",
    developer: "Open Source",
    type: "Retro Emulator",
    genre: ["Emulator", "Classic"],
    description: "Play your favorite classic console ROMs directly in the browser using WebAssembly. Drag, drop, and play.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=retroengine",
    releaseDate: "Beta",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/games/retro"
  },
  {
    id: "titan_mech_survival",
    title: "Titan Mech Survival",
    developer: "Xakteir Studios",
    type: "2.5D",
    genre: ["Action", "Sci-Fi", "Shooter", "Survival", "Roguelike"],
    description: "Pilot apex combat titan mechs against endless rogue cyber armadas. Upgrade weapon systems, harvest energy crystals, harness quantum EMP blasts, and survive hostile sector waves.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=titanmechsurvival",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "15:00", description: "Initial Titan Mech Survival Launch" }
    ],
    route: "/game/titan-mech-survival"
  },
  {
    id: "neon_drift",
    title: "Neon Drift",
    developer: "Xakteir Studios",
    type: "2D Top-Down",
    genre: ["Racing", "Arcade"],
    description: "Top-down cyber-racing with intense drift mechanics.",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=neondrift",
    releaseDate: "2026",
    price: "$4.99",
    updates: [
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/games/play/neon_drift"
  },
  {
    id: "pixel_knight",
    title: "Pixel Knight",
    developer: "IndieForge",
    type: "2D Platformer",
    genre: ["Adventure", "Platformer"],
    description: "A classic 2D platforming adventure through dangerous dungeons.",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=pixelknight",
    releaseDate: "2026",
    price: "Free",
    updates: [
      { time: "19:29", description: "Added new characters and outfits" },
      { time: "14:20", description: "Added more fun levels!" },
      { time: "12:50", description: "Initial Update" }
    ],
    route: "/games/play/pixel_knight"
  }
];

const legacyGamesData = [
  {
    id: "aim", name: 'Aim Trainer', type: 'Arcade' },
  {
    id: "balance", name: 'Balance Board', type: 'Puzzle' },
  {
    id: "basketball", name: 'Basketball Shoot', type: 'Sports' },
  {
    id: "breaker", name: 'Neon Breaker', type: 'Arcade' },
  {
    id: "bubble", name: 'Plasma Burst', type: 'Puzzle' },
  {
    id: "clickSpeed", name: 'Click Speed', type: 'Arcade' },
  {
    id: "clicker", name: 'Idle Core', type: 'Strategy' },
  {
    id: "colorMatch", name: 'Color Match', type: 'Puzzle' },
  {
    id: "connectFour", name: 'Grid Connect', type: 'Strategy' },
  {
    id: "dodge", name: 'Neon Dodge', type: 'Arcade' },
  {
    id: "drawing", name: 'Pixel Canvas', type: 'Discovery' },
  {
    id: "fishing", name: 'Deep Sea Fisher', type: 'Arcade' },
  {
    id: "flappy", name: 'Aero Dash', type: 'Arcade' },
  {
    id: "football3D", name: 'Football 3D', type: '3D' },
  {
    id: "frogger", name: 'Neon Cross', type: 'Arcade' },
  {
    id: "golf", name: 'Cyber Golf', type: 'Sports' },
  {
    id: "gravity", name: 'Gravity Flip', type: 'Arcade' },
  {
    id: "invaders", name: 'Star Invaders', type: 'Arcade' },
  {
    id: "jump", name: 'Infinite Jump', type: 'Arcade' },
  {
    id: "knife", name: 'Knife Hit', type: 'Arcade' },
  {
    id: "match3", name: 'Cyber Match', type: 'Puzzle' },
  {
    id: "math", name: 'Neural Quiz', type: 'Puzzle' },
  {
    id: "maze", name: 'Maze Solver', type: 'Puzzle' },
  {
    id: "memory", name: 'Neural Memory', type: 'Puzzle' },
  {
    id: "minesweeper", name: 'Minesweeper', type: 'Strategy' },
  {
    id: "paint", name: 'Neon Canvas', type: 'Discovery' },
  {
    id: "parking", name: 'Hover Parking', type: 'Puzzle' },
  {
    id: "pinball", name: 'Neon Pinball', type: 'Arcade' },
  {
    id: "plinko", name: 'Plinko Drop', type: 'Arcade' },
  {
    id: "pong", name: 'Neon Pong', type: 'Arcade' },
  {
    id: "rps", name: 'Cyber RPS', type: 'Strategy' },
  {
    id: "reaction", name: 'Neural Reaction', type: 'Arcade' },
  {
    id: "sequence", name: 'Neural Sequence', type: 'Puzzle' },
  {
    id: "snake", name: 'Snake Game', type: 'Arcade' },
  {
    id: "spinWheel", name: 'Roulette Rush', type: 'Discovery' },
  {
    id: "stack", name: 'Sky Stacker', type: 'Arcade' },
  {
    id: "sudoku", name: 'Grid Sudoku', type: 'Puzzle' },
  {
    id: "tictactoe", name: 'Grid Tactics', type: 'Strategy' },
  {
    id: "towerDefense", name: 'Tower Defense', type: 'Strategy' },
  {
    id: "trivia", name: 'Data Quiz', type: 'Discovery' },
  {
    id: "tunnel3D", name: 'Tunnel 3D', type: '3D' },
  {
    id: "twoZeroFourEight", name: '2048 Puzzle', type: 'Puzzle' },
  {
    id: "typing", name: 'Typing Test', type: 'Discovery' },
  {
    id: "whack", name: 'Whack-A-Bot', type: 'Arcade' },
  {
    id: "word", name: 'Data Search', type: 'Puzzle' },
  {
    id: "xbr", name: 'XBR Arena', type: '3D' },
  {
    id: "blockDrop", name: 'Block Drop', type: 'Arcade' },
  {
    id: "mazeMuncher", name: 'Maze Runner', type: 'Arcade' },
  {
    id: "wordGuess", name: 'Cipher Guess', type: 'Puzzle' },
  {
    id: "spaceRocks", name: 'Space Rocks', type: 'Arcade' },
  {
    id: "rhythmTap", name: 'Rhythm Tap', type: 'Arcade' },
  {
    id: "aeroDrift", name: 'Aero Drift', type: 'Action' },
  {
    id: "aeroDrift2", name: 'Aero Drift2', type: 'Sports' },
  {
    id: "aeroMatch", name: 'Aero Match', type: 'Action' },
  {
    id: "aeroMatch2", name: 'Aero Match2', type: 'Arcade' },
  {
    id: "aeroSurfer", name: 'Aero Surfer', type: 'Puzzle' },
  {
    id: "aimTrainer", name: 'Aim Trainer', type: 'Sports' },
  {
    id: "aquaBlaster", name: 'Aqua Blaster', type: 'Sports' },
  {
    id: "aquaBlaster2", name: 'Aqua Blaster2', type: 'Puzzle' },
  {
    id: "aquaDrop", name: 'Aqua Drop', type: 'Action' },
  {
    id: "aquaDrop2", name: 'Aqua Drop2', type: 'Sports' },
  {
    id: "aquaMatch", name: 'Aqua Match', type: 'Puzzle' },
  {
    id: "astroDash", name: 'Astro Dash', type: 'Puzzle' },
  {
    id: "astroDash2", name: 'Astro Dash2', type: 'Arcade' },
  {
    id: "astroDrop", name: 'Astro Drop', type: 'Arcade' },
  {
    id: "astroLink", name: 'Astro Link', type: 'Puzzle' },
  {
    id: "astroSpin", name: 'Astro Spin', type: 'Strategy' },
  {
    id: "astroSpin2", name: 'Astro Spin2', type: 'Arcade' },
  {
    id: "balanceBoard", name: 'Balance Board', type: 'Action' },
  {
    id: "brickBreaker", name: 'Neon Breaker', type: 'Arcade' },
  {
    id: "bubbleShooter", name: 'Plasma Burst', type: 'Strategy' },
  {
    id: "carParking", name: 'Hover Parking', type: 'Puzzle' },
  {
    id: "chronoClash", name: 'Chrono Clash', type: 'Sports' },
  {
    id: "chronoClash2", name: 'Chrono Clash2', type: 'Action' },
  {
    id: "chronoDefender", name: 'Chrono Defender', type: 'Action' },
  {
    id: "chronoDefender2", name: 'Chrono Defender2', type: 'Sports' },
  {
    id: "chronoQuest", name: 'Chrono Quest', type: 'Sports' },
  {
    id: "cosmicBlaster", name: 'Cosmic Blaster', type: 'Sports' },
  {
    id: "cosmicBlaster2", name: 'Cosmic Blaster2', type: 'Sports' },
  {
    id: "cosmicBounce", name: 'Cosmic Bounce', type: 'Strategy' },
  {
    id: "cosmicDefender", name: 'Cosmic Defender', type: 'Puzzle' },
  {
    id: "cosmicDrop", name: 'Cosmic Drop', type: 'Strategy' },
  {
    id: "cosmicDrop2", name: 'Cosmic Drop2', type: 'Strategy' },
  {
    id: "cosmicMatch", name: 'Cosmic Match', type: 'Strategy' },
  {
    id: "crazyLink", name: 'Crazy Link', type: 'Arcade' },
  {
    id: "crazyNinja", name: 'Crazy Ninja', type: 'Arcade' },
  {
    id: "crazyNinja2", name: 'Crazy Ninja2', type: 'Puzzle' },
  {
    id: "crazyQuest", name: 'Crazy Quest', type: 'Action' },
  {
    id: "crazyQuest2", name: 'Crazy Quest2', type: 'Arcade' },
  {
    id: "crazySpin", name: 'Crazy Spin', type: 'Strategy' },
  {
    id: "crystalDrop", name: 'Crystal Drop', type: 'Puzzle' },
  {
    id: "crystalNinja", name: 'Crystal Ninja', type: 'Strategy' },
  {
    id: "crystalRacer", name: 'Crystal Racer', type: 'Action' },
  {
    id: "crystalRacer2", name: 'Crystal Racer2', type: 'Puzzle' },
  {
    id: "crystalStrike", name: 'Crystal Strike', type: 'Arcade' },
  {
    id: "crystalStrike2", name: 'Crystal Strike2', type: 'Sports' },
  {
    id: "cyberClash", name: 'Cyber Clash', type: 'Sports' },
  {
    id: "cyberDash", name: 'Cyber Dash', type: 'Action' },
  {
    id: "cyberDash2", name: 'Cyber Dash2', type: 'Action' },
  {
    id: "cyberPuzzle", name: 'Cyber Puzzle', type: 'Puzzle' },
  {
    id: "cyberSpin", name: 'Cyber Spin', type: 'Arcade' },
  {
    id: "cyberSpin2", name: 'Cyber Spin2', type: 'Sports' },
  {
    id: "cyberSpin3", name: 'Cyber Spin3', type: 'Action' },
  {
    id: "dodgeObjects", name: 'Neon Dodge', type: 'Arcade' },
  {
    id: "drawingCanvas", name: 'Pixel Canvas', type: 'Sports' },
  {
    id: "electroDash", name: 'Electro Dash', type: 'Sports' },
  {
    id: "electroRacer", name: 'Electro Racer', type: 'Arcade' },
  {
    id: "electroRacer2", name: 'Electro Racer2', type: 'Action' },
  {
    id: "electroStrike", name: 'Electro Strike', type: 'Sports' },
  {
    id: "electroStrike2", name: 'Electro Strike2', type: 'Sports' },
  {
    id: "epicClash", name: 'Epic Clash', type: 'Action' },
  {
    id: "epicDrift", name: 'Epic Drift', type: 'Sports' },
  {
    id: "epicDrift2", name: 'Epic Drift2', type: 'Puzzle' },
  {
    id: "epicMatch", name: 'Epic Match', type: 'Puzzle' },
  {
    id: "epicMatch2", name: 'Epic Match2', type: 'Action' },
  {
    id: "epicShooter", name: 'Epic Shooter', type: 'Strategy' },
  {
    id: "eternalRunner", name: 'Eternal Runner', type: 'Strategy' },
  {
    id: "finalBoss", name: 'Final Boss', type: 'Action' },
  {
    id: "fishingGame", name: 'Deep Sea Fisher', type: 'Arcade' },
  {
    id: "flappyBird", name: 'Aero Dash', type: 'Action' },
  {
    id: "galaxyBlaster", name: 'Galaxy Blaster', type: 'Arcade' },
  {
    id: "game2048", name: 'Game2048', type: 'Puzzle' },
  {
    id: "grandStrategy", name: 'Grand Strategy', type: 'Strategy' },
  {
    id: "gravityFlip", name: 'Gravity Flip', type: 'Arcade' },
  {
    id: "hyperGlider", name: 'Hyper Glider', type: 'Strategy' },
  {
    id: "hyperGlider2", name: 'Hyper Glider2', type: 'Action' },
  {
    id: "hyperKnight", name: 'Hyper Knight', type: 'Puzzle' },
  {
    id: "hyperKnight2", name: 'Hyper Knight2', type: 'Action' },
  {
    id: "hyperLink", name: 'Hyper Link', type: 'Action' },
  {
    id: "hyperRacer", name: 'Hyper Racer', type: 'Strategy' },
  {
    id: "idleClicker", name: 'Idle Core', type: 'Puzzle' },
  {
    id: "infiniteJump", name: 'Infinite Jump', type: 'Strategy' },
  {
    id: "infinityMatch", name: 'Infinity Match', type: 'Puzzle' },
  {
    id: "ironBlaster", name: 'Iron Blaster', type: 'Action' },
  {
    id: "ironForce", name: 'Iron Force', type: 'Strategy' },
  {
    id: "ironRunner", name: 'Iron Runner', type: 'Action' },
  {
    id: "ironRunner2", name: 'Iron Runner2', type: 'Sports' },
  {
    id: "ironSurfer", name: 'Iron Surfer', type: 'Strategy' },
  {
    id: "ironSurfer2", name: 'Iron Surfer2', type: 'Strategy' },
  {
    id: "knifeHit", name: 'Knife Hit', type: 'Action' },
  {
    id: "legendQuest", name: 'Legend Quest', type: 'Strategy' },
  {
    id: "lunarDefender", name: 'Lunar Defender', type: 'Arcade' },
  {
    id: "lunarRacer", name: 'Lunar Racer', type: 'Action' },
  {
    id: "lunarRunner", name: 'Lunar Runner', type: 'Puzzle' },
  {
    id: "lunarRunner2", name: 'Lunar Runner2', type: 'Action' },
  {
    id: "lunarSurfer", name: 'Lunar Surfer', type: 'Strategy' },
  {
    id: "lunarSurfer2", name: 'Lunar Surfer2', type: 'Puzzle' },
  {
    id: "magicClash", name: 'Magic Clash', type: 'Puzzle' },
  {
    id: "magicClash2", name: 'Magic Clash2', type: 'Sports' },
  {
    id: "magicDefender", name: 'Magic Defender', type: 'Strategy' },
  {
    id: "magicDefender2", name: 'Magic Defender2', type: 'Strategy' },
  {
    id: "magicKnight", name: 'Magic Knight', type: 'Puzzle' },
  {
    id: "magicSpin", name: 'Magic Spin', type: 'Arcade' },
  {
    id: "masterArcade", name: 'Master Arcade', type: 'Arcade' },
  {
    id: "mathQuiz", name: 'Neural Quiz', type: 'Strategy' },
  {
    id: "mazeSolver", name: 'Maze Solver', type: 'Strategy' },
  {
    id: "megaBounce", name: 'Mega Bounce', type: 'Puzzle' },
  {
    id: "megaGlider", name: 'Mega Glider', type: 'Strategy' },
  {
    id: "megaGlider2", name: 'Mega Glider2', type: 'Strategy' },
  {
    id: "megaKnight", name: 'Mega Knight', type: 'Sports' },
  {
    id: "megaKnight2", name: 'Mega Knight2', type: 'Sports' },
  {
    id: "megaSports", name: 'Mega Sports', type: 'Action' },
  {
    id: "megaSurfer", name: 'Mega Surfer', type: 'Strategy' },
  {
    id: "memoryCards", name: 'Neural Memory', type: 'Arcade' },
  {
    id: "memorySequence", name: 'Neural Sequence', type: 'Action' },
  {
    id: "miniGolf", name: 'Cyber Golf', type: 'Sports' },
  {
    id: "mysticRunner", name: 'Mystic Runner', type: 'Strategy' },
  {
    id: "mysticRunner2", name: 'Mystic Runner2', type: 'Action' },
  {
    id: "mysticSurfer", name: 'Mystic Surfer', type: 'Puzzle' },
  {
    id: "mysticSurfer2", name: 'Mystic Surfer2', type: 'Sports' },
  {
    id: "mysticWizard", name: 'Mystic Wizard', type: 'Action' },
  {
    id: "mythicDefender", name: 'Mythic Defender', type: 'Puzzle' },
  {
    id: "neonBounce", name: 'Neon Bounce', type: 'Arcade' },
  {
    id: "neonBounce2", name: 'Neon Bounce2', type: 'Arcade' },
  {
    id: "neonDash", name: 'Neon Dash', type: 'Action' },
  {
    id: "neonDrift", name: 'Neon Drift', type: 'Strategy' },
  {
    id: "neonKnight", name: 'Neon Knight', type: 'Arcade' },
  {
    id: "neonRunner", name: 'Neon Runner', type: 'Puzzle' },
  {
    id: "neonShooter", name: 'Neon Shooter', type: 'Strategy' },
  {
    id: "neonShooter2", name: 'Neon Shooter2', type: 'Sports' },
  {
    id: "paintDraw", name: 'Paint Draw', type: 'Strategy' },
  {
    id: "pixelBlaster", name: 'Pixel Blaster', type: 'Sports' },
  {
    id: "pixelClash", name: 'Pixel Clash', type: 'Puzzle' },
  {
    id: "pixelClash2", name: 'Pixel Clash2', type: 'Action' },
  {
    id: "pixelDefender", name: 'Pixel Defender', type: 'Strategy' },
  {
    id: "pixelDefender2", name: 'Pixel Defender2', type: 'Action' },
  {
    id: "pixelDrift", name: 'Pixel Drift', type: 'Action' },
  {
    id: "pixelKnight", name: 'Pixel Knight', type: 'Action' },
  {
    id: "pixelQuest", name: 'Pixel Quest', type: 'Sports' },
  {
    id: "pyroForce", name: 'Pyro Force', type: 'Sports' },
  {
    id: "pyroForce2", name: 'Pyro Force2', type: 'Strategy' },
  {
    id: "pyroLink", name: 'Pyro Link', type: 'Action' },
  {
    id: "pyroLink2", name: 'Pyro Link2', type: 'Arcade' },
  {
    id: "pyroStrike", name: 'Pyro Strike', type: 'Action' },
  {
    id: "quantumBounce", name: 'Quantum Bounce', type: 'Puzzle' },
  {
    id: "quantumDrift", name: 'Quantum Drift', type: 'Arcade' },
  {
    id: "quantumDrift2", name: 'Quantum Drift2', type: 'Sports' },
  {
    id: "quantumMatch", name: 'Quantum Match', type: 'Sports' },
  {
    id: "quantumMatch2", name: 'Quantum Match2', type: 'Puzzle' },
  {
    id: "quantumShooter", name: 'Quantum Shooter', type: 'Arcade' },
  {
    id: "quantumStrike", name: 'Quantum Strike', type: 'Action' },
  {
    id: "reactionTime", name: 'Neural Reaction', type: 'Action' },
  {
    id: "retroBlaster", name: 'Retro Blaster', type: 'Sports' },
  {
    id: "retroEngine", name: 'Retro Engine', type: 'Action' },
  {
    id: "retroForce", name: 'Retro Force', type: 'Action' },
  {
    id: "retroForce2", name: 'Retro Force2', type: 'Strategy' },
  {
    id: "retroLink", name: 'Retro Link', type: 'Puzzle' },
  {
    id: "retroLink2", name: 'Retro Link2', type: 'Puzzle' },
  {
    id: "retroRacer", name: 'Retro Racer', type: 'Puzzle' },
  {
    id: "rockPaperScissors", name: 'Cyber RPS', type: 'Action' },
  {
    id: "shadowBlaster", name: 'Shadow Blaster', type: 'Sports' },
  {
    id: "shadowForce", name: 'Shadow Force', type: 'Strategy' },
  {
    id: "shadowForce2", name: 'Shadow Force2', type: 'Action' },
  {
    id: "shadowGlider", name: 'Shadow Glider', type: 'Puzzle' },
  {
    id: "shadowLink", name: 'Shadow Link', type: 'Sports' },
  {
    id: "shadowLink2", name: 'Shadow Link2', type: 'Arcade' },
  {
    id: "shadowNinja", name: 'Shadow Ninja', type: 'Arcade' },
  {
    id: "solarBounce", name: 'Solar Bounce', type: 'Puzzle' },
  {
    id: "solarBounce2", name: 'Solar Bounce2', type: 'Strategy' },
  {
    id: "solarGlider", name: 'Solar Glider', type: 'Arcade' },
  {
    id: "solarNinja", name: 'Solar Ninja', type: 'Arcade' },
  {
    id: "solarShooter", name: 'Solar Shooter', type: 'Arcade' },
  {
    id: "solarShooter2", name: 'Solar Shooter2', type: 'Action' },
  {
    id: "sonicDrop", name: 'Sonic Drop', type: 'Action' },
  {
    id: "sonicGlider2", name: 'Sonic Glider2', type: 'Puzzle' },
  {
    id: "sonicGlider3", name: 'Sonic Glider3', type: 'Sports' },
  {
    id: "sonicKnight", name: 'Sonic Knight', type: 'Sports' },
  {
    id: "sonicKnight2", name: 'Sonic Knight2', type: 'Action' },
  {
    id: "spaceInvaders", name: 'Star Invaders', type: 'Action' },
  {
    id: "steelBounce", name: 'Steel Bounce', type: 'Puzzle' },
  {
    id: "steelBounce2", name: 'Steel Bounce2', type: 'Action' },
  {
    id: "steelNinja", name: 'Steel Ninja', type: 'Strategy' },
  {
    id: "steelShooter", name: 'Steel Shooter', type: 'Strategy' },
  {
    id: "steelShooter2", name: 'Steel Shooter2', type: 'Arcade' },
  {
    id: "superBlaster", name: 'Super Blaster', type: 'Arcade' },
  {
    id: "superBlaster2", name: 'Super Blaster2', type: 'Arcade' },
  {
    id: "superDrop", name: 'Super Drop', type: 'Strategy' },
  {
    id: "superDrop2", name: 'Super Drop2', type: 'Strategy' },
  {
    id: "superKnight", name: 'Super Knight', type: 'Strategy' },
  {
    id: "superRunner", name: 'Super Runner', type: 'Sports' },
  {
    id: "terraBuilder", name: 'Terra Builder', type: 'Arcade' },
  {
    id: "terraNinja", name: 'Terra Ninja', type: 'Strategy' },
  {
    id: "terraNinja2", name: 'Terra Ninja2', type: 'Puzzle' },
  {
    id: "terraQuest", name: 'Terra Quest', type: 'Strategy' },
  {
    id: "terraQuest2", name: 'Terra Quest2', type: 'Action' },
  {
    id: "ticTacToe", name: 'Grid Tactics', type: 'Arcade' },
  {
    id: "towerStacker", name: 'Sky Stacker', type: 'Puzzle' },
  {
    id: "triviaQuiz", name: 'Data Quiz', type: 'Sports' },
  {
    id: "turboForce", name: 'Turbo Force', type: 'Sports' },
  {
    id: "turboMatch", name: 'Turbo Match', type: 'Arcade' },
  {
    id: "turboNinja", name: 'Turbo Ninja', type: 'Sports' },
  {
    id: "aimTrainer", name: 'Aim Trainer', type: 'Sports' },
  {
    id: "aquaBlaster", name: 'Aqua Blaster', type: 'Sports' },
  {
    id: "aquaBlaster2", name: 'Aqua Blaster2', type: 'Puzzle' },
  {
    id: "aquaDrop", name: 'Aqua Drop', type: 'Action' },
  {
    id: "aquaDrop2", name: 'Aqua Drop2', type: 'Sports' },
  {
    id: "aquaMatch", name: 'Aqua Match', type: 'Puzzle' },
  {
    id: "astroDash", name: 'Astro Dash', type: 'Puzzle' },
  {
    id: "astroDash2", name: 'Astro Dash2', type: 'Arcade' },
  {
    id: "astroDrop", name: 'Astro Drop', type: 'Arcade' },
  {
    id: "astroLink", name: 'Astro Link', type: 'Puzzle' },
  {
    id: "astroSpin", name: 'Astro Spin', type: 'Strategy' },
  {
    id: "astroSpin2", name: 'Astro Spin2', type: 'Arcade' },
  {
    id: "balanceBoard", name: 'Balance Board', type: 'Action' },
  {
    id: "brickBreaker", name: 'Neon Breaker', type: 'Arcade' },
  {
    id: "bubbleShooter", name: 'Plasma Burst', type: 'Strategy' },
  {
    id: "carParking", name: 'Hover Parking', type: 'Puzzle' },
  {
    id: "chronoClash", name: 'Chrono Clash', type: 'Sports' },
  {
    id: "chronoClash2", name: 'Chrono Clash2', type: 'Action' },
  {
    id: "chronoDefender", name: 'Chrono Defender', type: 'Action' },
  {
    id: "chronoDefender2", name: 'Chrono Defender2', type: 'Sports' },
  {
    id: "chronoQuest", name: 'Chrono Quest', type: 'Sports' },
  {
    id: "cosmicBlaster", name: 'Cosmic Blaster', type: 'Sports' },
  {
    id: "cosmicBlaster2", name: 'Cosmic Blaster2', type: 'Sports' },
  {
    id: "cosmicBounce", name: 'Cosmic Bounce', type: 'Strategy' },
  {
    id: "cosmicDefender", name: 'Cosmic Defender', type: 'Puzzle' },
  {
    id: "cosmicDrop", name: 'Cosmic Drop', type: 'Strategy' },
  {
    id: "cosmicDrop2", name: 'Cosmic Drop2', type: 'Strategy' },
  {
    id: "cosmicMatch", name: 'Cosmic Match', type: 'Strategy' },
  {
    id: "crazyLink", name: 'Crazy Link', type: 'Arcade' },
  {
    id: "crazyNinja", name: 'Crazy Ninja', type: 'Arcade' },
  {
    id: "crazyNinja2", name: 'Crazy Ninja2', type: 'Puzzle' },
  {
    id: "crazyQuest", name: 'Crazy Quest', type: 'Action' },
  {
    id: "crazyQuest2", name: 'Crazy Quest2', type: 'Arcade' },
  {
    id: "crazySpin", name: 'Crazy Spin', type: 'Strategy' },
  {
    id: "crystalDrop", name: 'Crystal Drop', type: 'Puzzle' },
  {
    id: "crystalNinja", name: 'Crystal Ninja', type: 'Strategy' },
  {
    id: "crystalRacer", name: 'Crystal Racer', type: 'Action' },
  {
    id: "crystalRacer2", name: 'Crystal Racer2', type: 'Puzzle' },
  {
    id: "crystalStrike", name: 'Crystal Strike', type: 'Arcade' },
  {
    id: "crystalStrike2", name: 'Crystal Strike2', type: 'Sports' },
  {
    id: "cyberClash", name: 'Cyber Clash', type: 'Sports' },
  {
    id: "cyberDash", name: 'Cyber Dash', type: 'Action' },
  {
    id: "cyberDash2", name: 'Cyber Dash2', type: 'Action' },
  {
    id: "cyberPuzzle", name: 'Cyber Puzzle', type: 'Puzzle' },
  {
    id: "cyberSpin", name: 'Cyber Spin', type: 'Arcade' },
  {
    id: "cyberSpin2", name: 'Cyber Spin2', type: 'Sports' },
  {
    id: "cyberSpin3", name: 'Cyber Spin3', type: 'Action' },
  {
    id: "dodgeObjects", name: 'Neon Dodge', type: 'Arcade' },
  {
    id: "drawingCanvas", name: 'Pixel Canvas', type: 'Sports' },
  {
    id: "electroDash", name: 'Electro Dash', type: 'Sports' },
  {
    id: "electroRacer", name: 'Electro Racer', type: 'Arcade' },
  {
    id: "electroRacer2", name: 'Electro Racer2', type: 'Action' },
  {
    id: "electroStrike", name: 'Electro Strike', type: 'Sports' },
  {
    id: "electroStrike2", name: 'Electro Strike2', type: 'Sports' },
  {
    id: "epicClash", name: 'Epic Clash', type: 'Action' },
  {
    id: "epicDrift", name: 'Epic Drift', type: 'Sports' },
  {
    id: "epicDrift2", name: 'Epic Drift2', type: 'Puzzle' },
  {
    id: "epicMatch", name: 'Epic Match', type: 'Puzzle' },
  {
    id: "epicMatch2", name: 'Epic Match2', type: 'Action' },
  {
    id: "epicShooter", name: 'Epic Shooter', type: 'Strategy' },
  {
    id: "eternalRunner", name: 'Eternal Runner', type: 'Strategy' },
  {
    id: "finalBoss", name: 'Final Boss', type: 'Action' },
  {
    id: "fishingGame", name: 'Deep Sea Fisher', type: 'Arcade' },
  {
    id: "flappyBird", name: 'Aero Dash', type: 'Action' },
  {
    id: "galaxyBlaster", name: 'Galaxy Blaster', type: 'Arcade' },
  {
    id: "game2048", name: 'Game2048', type: 'Puzzle' },
  {
    id: "grandStrategy", name: 'Grand Strategy', type: 'Strategy' },
  {
    id: "gravityFlip", name: 'Gravity Flip', type: 'Arcade' },
  {
    id: "hyperGlider", name: 'Hyper Glider', type: 'Strategy' },
  {
    id: "hyperGlider2", name: 'Hyper Glider2', type: 'Action' },
  {
    id: "hyperKnight", name: 'Hyper Knight', type: 'Puzzle' },
  {
    id: "hyperKnight2", name: 'Hyper Knight2', type: 'Action' },
  {
    id: "hyperLink", name: 'Hyper Link', type: 'Action' },
  {
    id: "hyperRacer", name: 'Hyper Racer', type: 'Strategy' },
  {
    id: "idleClicker", name: 'Idle Core', type: 'Puzzle' },
  {
    id: "infiniteJump", name: 'Infinite Jump', type: 'Strategy' },
  {
    id: "infinityMatch", name: 'Infinity Match', type: 'Puzzle' },
  {
    id: "ironBlaster", name: 'Iron Blaster', type: 'Action' },
  {
    id: "ironForce", name: 'Iron Force', type: 'Strategy' },
  {
    id: "ironRunner", name: 'Iron Runner', type: 'Action' },
  {
    id: "ironRunner2", name: 'Iron Runner2', type: 'Sports' },
  {
    id: "ironSurfer", name: 'Iron Surfer', type: 'Strategy' },
  {
    id: "ironSurfer2", name: 'Iron Surfer2', type: 'Strategy' },
  {
    id: "knifeHit", name: 'Knife Hit', type: 'Action' },
  {
    id: "legendQuest", name: 'Legend Quest', type: 'Strategy' },
  {
    id: "lunarDefender", name: 'Lunar Defender', type: 'Arcade' },
  {
    id: "lunarRacer", name: 'Lunar Racer', type: 'Action' },
  {
    id: "lunarRunner", name: 'Lunar Runner', type: 'Puzzle' },
  {
    id: "lunarRunner2", name: 'Lunar Runner2', type: 'Action' },
  {
    id: "lunarSurfer", name: 'Lunar Surfer', type: 'Strategy' },
  {
    id: "lunarSurfer2", name: 'Lunar Surfer2', type: 'Puzzle' },
  {
    id: "magicClash", name: 'Magic Clash', type: 'Puzzle' },
  {
    id: "magicClash2", name: 'Magic Clash2', type: 'Sports' },
  {
    id: "magicDefender", name: 'Magic Defender', type: 'Strategy' },
  {
    id: "magicDefender2", name: 'Magic Defender2', type: 'Strategy' },
  {
    id: "magicKnight", name: 'Magic Knight', type: 'Puzzle' },
  {
    id: "magicSpin", name: 'Magic Spin', type: 'Arcade' },
  {
    id: "masterArcade", name: 'Master Arcade', type: 'Arcade' },
  {
    id: "mathQuiz", name: 'Neural Quiz', type: 'Strategy' },
  {
    id: "mazeSolver", name: 'Maze Solver', type: 'Strategy' },
  {
    id: "megaBounce", name: 'Mega Bounce', type: 'Puzzle' },
  {
    id: "megaGlider", name: 'Mega Glider', type: 'Strategy' },
  {
    id: "megaGlider2", name: 'Mega Glider2', type: 'Strategy' },
  {
    id: "megaKnight", name: 'Mega Knight', type: 'Sports' },
  {
    id: "megaKnight2", name: 'Mega Knight2', type: 'Sports' },
  {
    id: "megaSports", name: 'Mega Sports', type: 'Action' },
  {
    id: "megaSurfer", name: 'Mega Surfer', type: 'Strategy' },
  {
    id: "memoryCards", name: 'Neural Memory', type: 'Arcade' },
  {
    id: "memorySequence", name: 'Neural Sequence', type: 'Action' },
  {
    id: "miniGolf", name: 'Cyber Golf', type: 'Sports' },
  {
    id: "mysticRunner", name: 'Mystic Runner', type: 'Strategy' },
  {
    id: "mysticRunner2", name: 'Mystic Runner2', type: 'Action' },
  {
    id: "mysticSurfer", name: 'Mystic Surfer', type: 'Puzzle' },
  {
    id: "mysticSurfer2", name: 'Mystic Surfer2', type: 'Sports' },
  {
    id: "mysticWizard", name: 'Mystic Wizard', type: 'Action' },
  {
    id: "mythicDefender", name: 'Mythic Defender', type: 'Puzzle' },
  {
    id: "neonBounce", name: 'Neon Bounce', type: 'Arcade' },
  {
    id: "neonBounce2", name: 'Neon Bounce2', type: 'Arcade' },
  {
    id: "neonDash", name: 'Neon Dash', type: 'Action' },
  {
    id: "neonDrift", name: 'Neon Drift', type: 'Strategy' },
  {
    id: "neonKnight", name: 'Neon Knight', type: 'Arcade' },
  {
    id: "neonRunner", name: 'Neon Runner', type: 'Puzzle' },
  {
    id: "neonShooter", name: 'Neon Shooter', type: 'Strategy' },
  {
    id: "neonShooter2", name: 'Neon Shooter2', type: 'Sports' },
  {
    id: "paintDraw", name: 'Paint Draw', type: 'Strategy' },
  {
    id: "pixelBlaster", name: 'Pixel Blaster', type: 'Sports' },
  {
    id: "pixelClash", name: 'Pixel Clash', type: 'Puzzle' },
  {
    id: "pixelClash2", name: 'Pixel Clash2', type: 'Action' },
  {
    id: "pixelDefender", name: 'Pixel Defender', type: 'Strategy' },
  {
    id: "pixelDefender2", name: 'Pixel Defender2', type: 'Action' },
  {
    id: "pixelDrift", name: 'Pixel Drift', type: 'Action' },
  {
    id: "pixelKnight", name: 'Pixel Knight', type: 'Action' },
  {
    id: "pixelQuest", name: 'Pixel Quest', type: 'Sports' },
  {
    id: "pyroForce", name: 'Pyro Force', type: 'Sports' },
  {
    id: "pyroForce2", name: 'Pyro Force2', type: 'Strategy' },
  {
    id: "pyroLink", name: 'Pyro Link', type: 'Action' },
  {
    id: "pyroLink2", name: 'Pyro Link2', type: 'Arcade' },
  {
    id: "pyroStrike", name: 'Pyro Strike', type: 'Action' },
  {
    id: "quantumBounce", name: 'Quantum Bounce', type: 'Puzzle' },
  {
    id: "quantumDrift", name: 'Quantum Drift', type: 'Arcade' },
  {
    id: "quantumDrift2", name: 'Quantum Drift2', type: 'Sports' },
  {
    id: "quantumMatch", name: 'Quantum Match', type: 'Sports' },
  {
    id: "quantumMatch2", name: 'Quantum Match2', type: 'Puzzle' },
  {
    id: "quantumShooter", name: 'Quantum Shooter', type: 'Arcade' },
  {
    id: "quantumStrike", name: 'Quantum Strike', type: 'Action' },
  {
    id: "reactionTime", name: 'Neural Reaction', type: 'Action' },
  {
    id: "retroBlaster", name: 'Retro Blaster', type: 'Sports' },
  {
    id: "retroEngine", name: 'Retro Engine', type: 'Action' },
  {
    id: "retroForce", name: 'Retro Force', type: 'Action' },
  {
    id: "retroForce2", name: 'Retro Force2', type: 'Strategy' },
  {
    id: "retroLink", name: 'Retro Link', type: 'Puzzle' },
  {
    id: "retroLink2", name: 'Retro Link2', type: 'Puzzle' },
  {
    id: "retroRacer", name: 'Retro Racer', type: 'Puzzle' },
  {
    id: "rockPaperScissors", name: 'Cyber RPS', type: 'Action' },
  {
    id: "shadowBlaster", name: 'Shadow Blaster', type: 'Sports' },
  {
    id: "shadowForce", name: 'Shadow Force', type: 'Strategy' },
  {
    id: "shadowForce2", name: 'Shadow Force2', type: 'Action' },
  {
    id: "shadowGlider", name: 'Shadow Glider', type: 'Puzzle' },
  {
    id: "shadowLink", name: 'Shadow Link', type: 'Sports' },
  {
    id: "shadowLink2", name: 'Shadow Link2', type: 'Arcade' },
  {
    id: "shadowNinja", name: 'Shadow Ninja', type: 'Arcade' },
  {
    id: "solarBounce", name: 'Solar Bounce', type: 'Puzzle' },
  {
    id: "solarBounce2", name: 'Solar Bounce2', type: 'Strategy' },
  {
    id: "solarGlider", name: 'Solar Glider', type: 'Arcade' },
  {
    id: "solarNinja", name: 'Solar Ninja', type: 'Arcade' },
  {
    id: "solarShooter", name: 'Solar Shooter', type: 'Arcade' },
  {
    id: "solarShooter2", name: 'Solar Shooter2', type: 'Action' },
  {
    id: "sonicDrop", name: 'Sonic Drop', type: 'Action' },
  {
    id: "sonicGlider2", name: 'Sonic Glider2', type: 'Puzzle' },
  {
    id: "sonicGlider3", name: 'Sonic Glider3', type: 'Sports' },
  {
    id: "sonicKnight", name: 'Sonic Knight', type: 'Sports' },
  {
    id: "sonicKnight2", name: 'Sonic Knight2', type: 'Action' },
  {
    id: "spaceInvaders", name: 'Star Invaders', type: 'Action' },
  {
    id: "steelBounce", name: 'Steel Bounce', type: 'Puzzle' },
  {
    id: "steelBounce2", name: 'Steel Bounce2', type: 'Action' },
  {
    id: "steelNinja", name: 'Steel Ninja', type: 'Strategy' },
  {
    id: "steelShooter", name: 'Steel Shooter', type: 'Strategy' },
  {
    id: "steelShooter2", name: 'Steel Shooter2', type: 'Arcade' },
  {
    id: "superBlaster", name: 'Super Blaster', type: 'Arcade' },
  {
    id: "superBlaster2", name: 'Super Blaster2', type: 'Arcade' },
  {
    id: "superDrop", name: 'Super Drop', type: 'Strategy' },
  {
    id: "superDrop2", name: 'Super Drop2', type: 'Strategy' },
  {
    id: "superKnight", name: 'Super Knight', type: 'Strategy' },
  {
    id: "superRunner", name: 'Super Runner', type: 'Sports' },
  {
    id: "terraBuilder", name: 'Terra Builder', type: 'Arcade' },
  {
    id: "terraNinja", name: 'Terra Ninja', type: 'Strategy' },
  {
    id: "terraNinja2", name: 'Terra Ninja2', type: 'Puzzle' },
  {
    id: "terraQuest", name: 'Terra Quest', type: 'Strategy' },
  {
    id: "terraQuest2", name: 'Terra Quest2', type: 'Action' },
  {
    id: "ticTacToe", name: 'Grid Tactics', type: 'Arcade' },
  {
    id: "towerStacker", name: 'Sky Stacker', type: 'Puzzle' },
  {
    id: "triviaQuiz", name: 'Data Quiz', type: 'Sports' },
  {
    id: "turboForce", name: 'Turbo Force', type: 'Sports' },
  {
    id: "turboMatch", name: 'Turbo Match', type: 'Arcade' },
  {
    id: "turboNinja", name: 'Turbo Ninja', type: 'Sports' },
  {
    id: "turboNinja2", name: 'Turbo Ninja2', type: 'Strategy' },
  {
    id: "turboQuest", name: 'Turbo Quest', type: 'Strategy' },
  {
    id: "turboQuest2", name: 'Turbo Quest2', type: 'Strategy' },
  {
    id: "turboSurfer", name: 'Turbo Surfer', type: 'Arcade' },
  {
    id: "typingTest", name: 'Typing Test', type: 'Strategy' },
  {
    id: "ultimatePuzzle", name: 'Ultimate Puzzle', type: 'Arcade' },
  {
    id: "ultraDefender", name: 'Ultra Defender', type: 'Sports' },
  {
    id: "ultraDrift", name: 'Ultra Drift', type: 'Sports' },
  {
    id: "ultraRacer", name: 'Ultra Racer', type: 'Arcade' },
  {
    id: "ultraRacer2", name: 'Ultra Racer2', type: 'Sports' },
  {
    id: "ultraStrike", name: 'Ultra Strike', type: 'Strategy' },
  {
    id: "ultraStrike2", name: 'Ultra Strike2', type: 'Arcade' },
  {
    id: "voidDash", name: 'Void Dash', type: 'Strategy' },
  {
    id: "voidDash2", name: 'Void Dash2', type: 'Strategy' },
  {
    id: "voidShooter", name: 'Void Shooter', type: 'Action' },
  {
    id: "voidSpin", name: 'Void Spin', type: 'Action' },
  {
    id: "chronoClash", name: 'Chrono Clash', type: 'Sports' },
  {
    id: "chronoClash2", name: 'Chrono Clash2', type: 'Action' },
  {
    id: "chronoDefender", name: 'Chrono Defender', type: 'Action' },
  {
    id: "chronoDefender2", name: 'Chrono Defender2', type: 'Sports' },
  {
    id: "chronoQuest", name: 'Chrono Quest', type: 'Sports' },
  {
    id: "cosmicBlaster", name: 'Cosmic Blaster', type: 'Sports' },
  {
    id: "cosmicBlaster2", name: 'Cosmic Blaster2', type: 'Sports' },
  {
    id: "cosmicBounce", name: 'Cosmic Bounce', type: 'Strategy' },
  {
    id: "cosmicDefender", name: 'Cosmic Defender', type: 'Puzzle' },
  {
    id: "cosmicDrop", name: 'Cosmic Drop', type: 'Strategy' },
  {
    id: "cosmicDrop2", name: 'Cosmic Drop2', type: 'Strategy' },
  {
    id: "cosmicMatch", name: 'Cosmic Match', type: 'Strategy' },
  {
    id: "crazyLink", name: 'Crazy Link', type: 'Arcade' },
  {
    id: "crazyNinja", name: 'Crazy Ninja', type: 'Arcade' },
  {
    id: "crazyNinja2", name: 'Crazy Ninja2', type: 'Puzzle' },
  {
    id: "crazyQuest", name: 'Crazy Quest', type: 'Action' },
  {
    id: "crazyQuest2", name: 'Crazy Quest2', type: 'Arcade' },
  {
    id: "crazySpin", name: 'Crazy Spin', type: 'Strategy' },
  {
    id: "crystalDrop", name: 'Crystal Drop', type: 'Puzzle' },
  {
    id: "crystalNinja", name: 'Crystal Ninja', type: 'Strategy' },
  {
    id: "crystalRacer", name: 'Crystal Racer', type: 'Action' },
  {
    id: "crystalRacer2", name: 'Crystal Racer2', type: 'Puzzle' },
  {
    id: "crystalStrike", name: 'Crystal Strike', type: 'Arcade' },
  {
    id: "crystalStrike2", name: 'Crystal Strike2', type: 'Sports' },
  {
    id: "cyberClash", name: 'Cyber Clash', type: 'Sports' },
  {
    id: "cyberDash", name: 'Cyber Dash', type: 'Action' },
  {
    id: "cyberDash2", name: 'Cyber Dash2', type: 'Action' },
  {
    id: "cyberPuzzle", name: 'Cyber Puzzle', type: 'Puzzle' },
  {
    id: "cyberSpin", name: 'Cyber Spin', type: 'Arcade' },
  {
    id: "cyberSpin2", name: 'Cyber Spin2', type: 'Sports' },
  {
    id: "cyberSpin3", name: 'Cyber Spin3', type: 'Action' },
  {
    id: "dodgeObjects", name: 'Neon Dodge', type: 'Arcade' },
  {
    id: "drawingCanvas", name: 'Pixel Canvas', type: 'Sports' },
  {
    id: "electroDash", name: 'Electro Dash', type: 'Sports' },
  {
    id: "electroRacer", name: 'Electro Racer', type: 'Arcade' },
  {
    id: "electroRacer2", name: 'Electro Racer2', type: 'Action' },
  {
    id: "electroStrike", name: 'Electro Strike', type: 'Sports' },
  {
    id: "electroStrike2", name: 'Electro Strike2', type: 'Sports' },
  {
    id: "epicClash", name: 'Epic Clash', type: 'Action' },
  {
    id: "epicDrift", name: 'Epic Drift', type: 'Sports' },
  {
    id: "epicDrift2", name: 'Epic Drift2', type: 'Puzzle' },
  {
    id: "epicMatch", name: 'Epic Match', type: 'Puzzle' },
  {
    id: "epicMatch2", name: 'Epic Match2', type: 'Action' },
  {
    id: "epicShooter", name: 'Epic Shooter', type: 'Strategy' },
  {
    id: "eternalRunner", name: 'Eternal Runner', type: 'Strategy' },
  {
    id: "finalBoss", name: 'Final Boss', type: 'Action' },
  {
    id: "fishingGame", name: 'Deep Sea Fisher', type: 'Arcade' },
  {
    id: "flappyBird", name: 'Aero Dash', type: 'Action' },
  {
    id: "galaxyBlaster", name: 'Galaxy Blaster', type: 'Arcade' },
  {
    id: "game2048", name: 'Game2048', type: 'Puzzle' },
  {
    id: "grandStrategy", name: 'Grand Strategy', type: 'Strategy' },
  {
    id: "gravityFlip", name: 'Gravity Flip', type: 'Arcade' },
  {
    id: "hyperGlider", name: 'Hyper Glider', type: 'Strategy' },
  {
    id: "hyperGlider2", name: 'Hyper Glider2', type: 'Action' },
  {
    id: "hyperKnight", name: 'Hyper Knight', type: 'Puzzle' },
  {
    id: "hyperKnight2", name: 'Hyper Knight2', type: 'Action' },
  {
    id: "hyperLink", name: 'Hyper Link', type: 'Action' },
  {
    id: "hyperRacer", name: 'Hyper Racer', type: 'Strategy' },
  {
    id: "idleClicker", name: 'Idle Core', type: 'Puzzle' },
  {
    id: "infiniteJump", name: 'Infinite Jump', type: 'Strategy' },
  {
    id: "infinityMatch", name: 'Infinity Match', type: 'Puzzle' },
  {
    id: "ironBlaster", name: 'Iron Blaster', type: 'Action' },
  {
    id: "ironForce", name: 'Iron Force', type: 'Strategy' },
  {
    id: "ironRunner", name: 'Iron Runner', type: 'Action' },
  {
    id: "ironRunner2", name: 'Iron Runner2', type: 'Sports' },
  {
    id: "ironSurfer", name: 'Iron Surfer', type: 'Strategy' },
  {
    id: "ironSurfer2", name: 'Iron Surfer2', type: 'Strategy' },
  {
    id: "knifeHit", name: 'Knife Hit', type: 'Action' },
  {
    id: "legendQuest", name: 'Legend Quest', type: 'Strategy' },
  {
    id: "lunarDefender", name: 'Lunar Defender', type: 'Arcade' },
  {
    id: "lunarRacer", name: 'Lunar Racer', type: 'Action' },
  {
    id: "lunarRunner", name: 'Lunar Runner', type: 'Puzzle' },
  {
    id: "lunarRunner2", name: 'Lunar Runner2', type: 'Action' },
  {
    id: "lunarSurfer", name: 'Lunar Surfer', type: 'Strategy' },
  {
    id: "lunarSurfer2", name: 'Lunar Surfer2', type: 'Puzzle' },
  {
    id: "magicClash", name: 'Magic Clash', type: 'Puzzle' },
  {
    id: "magicClash2", name: 'Magic Clash2', type: 'Sports' },
  {
    id: "magicDefender", name: 'Magic Defender', type: 'Strategy' },
  {
    id: "magicDefender2", name: 'Magic Defender2', type: 'Strategy' },
  {
    id: "magicKnight", name: 'Magic Knight', type: 'Puzzle' },
  {
    id: "magicSpin", name: 'Magic Spin', type: 'Arcade' },
  {
    id: "masterArcade", name: 'Master Arcade', type: 'Arcade' },
  {
    id: "mathQuiz", name: 'Neural Quiz', type: 'Strategy' },
  {
    id: "mazeSolver", name: 'Maze Solver', type: 'Strategy' },
  {
    id: "megaBounce", name: 'Mega Bounce', type: 'Puzzle' },
  {
    id: "megaGlider", name: 'Mega Glider', type: 'Strategy' },
  {
    id: "megaGlider2", name: 'Mega Glider2', type: 'Strategy' },
  {
    id: "megaKnight", name: 'Mega Knight', type: 'Sports' },
  {
    id: "megaKnight2", name: 'Mega Knight2', type: 'Sports' },
  {
    id: "megaSports", name: 'Mega Sports', type: 'Action' },
  {
    id: "megaSurfer", name: 'Mega Surfer', type: 'Strategy' },
  {
    id: "memoryCards", name: 'Neural Memory', type: 'Arcade' },
  {
    id: "memorySequence", name: 'Neural Sequence', type: 'Action' },
  {
    id: "miniGolf", name: 'Cyber Golf', type: 'Sports' },
  {
    id: "mysticRunner", name: 'Mystic Runner', type: 'Strategy' },
  {
    id: "mysticRunner2", name: 'Mystic Runner2', type: 'Action' },
  {
    id: "mysticSurfer", name: 'Mystic Surfer', type: 'Puzzle' },
  {
    id: "mysticSurfer2", name: 'Mystic Surfer2', type: 'Sports' },
  {
    id: "mysticWizard", name: 'Mystic Wizard', type: 'Action' },
  {
    id: "mythicDefender", name: 'Mythic Defender', type: 'Puzzle' },
  {
    id: "neonBounce", name: 'Neon Bounce', type: 'Arcade' },
  {
    id: "neonBounce2", name: 'Neon Bounce2', type: 'Arcade' },
  {
    id: "neonDash", name: 'Neon Dash', type: 'Action' },
  {
    id: "neonDrift", name: 'Neon Drift', type: 'Strategy' },
  {
    id: "neonKnight", name: 'Neon Knight', type: 'Arcade' },
  {
    id: "neonRunner", name: 'Neon Runner', type: 'Puzzle' },
  {
    id: "neonShooter", name: 'Neon Shooter', type: 'Strategy' },
  {
    id: "neonShooter2", name: 'Neon Shooter2', type: 'Sports' },
  {
    id: "paintDraw", name: 'Paint Draw', type: 'Strategy' },
  {
    id: "pixelBlaster", name: 'Pixel Blaster', type: 'Sports' },
  {
    id: "pixelClash", name: 'Pixel Clash', type: 'Puzzle' },
  {
    id: "pixelClash2", name: 'Pixel Clash2', type: 'Action' },
  {
    id: "pixelDefender", name: 'Pixel Defender', type: 'Strategy' },
  {
    id: "pixelDefender2", name: 'Pixel Defender2', type: 'Action' },
  {
    id: "pixelDrift", name: 'Pixel Drift', type: 'Action' },
  {
    id: "pixelKnight", name: 'Pixel Knight', type: 'Action' },
  {
    id: "pixelQuest", name: 'Pixel Quest', type: 'Sports' },
  {
    id: "pyroForce", name: 'Pyro Force', type: 'Sports' },
  {
    id: "pyroForce2", name: 'Pyro Force2', type: 'Strategy' },
  {
    id: "pyroLink", name: 'Pyro Link', type: 'Action' },
  {
    id: "pyroLink2", name: 'Pyro Link2', type: 'Arcade' },
  {
    id: "pyroStrike", name: 'Pyro Strike', type: 'Action' },
  {
    id: "quantumBounce", name: 'Quantum Bounce', type: 'Puzzle' },
  {
    id: "quantumDrift", name: 'Quantum Drift', type: 'Arcade' },
  {
    id: "quantumDrift2", name: 'Quantum Drift2', type: 'Sports' },
  {
    id: "quantumMatch", name: 'Quantum Match', type: 'Sports' },
  {
    id: "quantumMatch2", name: 'Quantum Match2', type: 'Puzzle' },
  {
    id: "quantumShooter", name: 'Quantum Shooter', type: 'Arcade' },
  {
    id: "quantumStrike", name: 'Quantum Strike', type: 'Action' },
  {
    id: "reactionTime", name: 'Neural Reaction', type: 'Action' },
  {
    id: "retroBlaster", name: 'Retro Blaster', type: 'Sports' },
  {
    id: "retroEngine", name: 'Retro Engine', type: 'Action' },
  {
    id: "retroForce", name: 'Retro Force', type: 'Action' },
  {
    id: "retroForce2", name: 'Retro Force2', type: 'Strategy' },
  {
    id: "retroLink", name: 'Retro Link', type: 'Puzzle' },
  {
    id: "retroLink2", name: 'Retro Link2', type: 'Puzzle' },
  {
    id: "retroRacer", name: 'Retro Racer', type: 'Puzzle' },
  {
    id: "rockPaperScissors", name: 'Cyber RPS', type: 'Action' },
  {
    id: "shadowBlaster", name: 'Shadow Blaster', type: 'Sports' },
  {
    id: "shadowForce", name: 'Shadow Force', type: 'Strategy' },
  {
    id: "shadowForce2", name: 'Shadow Force2', type: 'Action' },
  {
    id: "shadowGlider", name: 'Shadow Glider', type: 'Puzzle' },
  {
    id: "shadowLink", name: 'Shadow Link', type: 'Sports' },
  {
    id: "shadowLink2", name: 'Shadow Link2', type: 'Arcade' },
  {
    id: "shadowNinja", name: 'Shadow Ninja', type: 'Arcade' },
  {
    id: "solarBounce", name: 'Solar Bounce', type: 'Puzzle' },
  {
    id: "solarBounce2", name: 'Solar Bounce2', type: 'Strategy' },
  {
    id: "solarGlider", name: 'Solar Glider', type: 'Arcade' },
  {
    id: "solarNinja", name: 'Solar Ninja', type: 'Arcade' },
  {
    id: "solarShooter", name: 'Solar Shooter', type: 'Arcade' },
  {
    id: "solarShooter2", name: 'Solar Shooter2', type: 'Action' },
  {
    id: "sonicDrop", name: 'Sonic Drop', type: 'Action' },
  {
    id: "sonicGlider2", name: 'Sonic Glider2', type: 'Puzzle' },
  {
    id: "sonicGlider3", name: 'Sonic Glider3', type: 'Sports' },
  {
    id: "sonicKnight", name: 'Sonic Knight', type: 'Sports' },
  {
    id: "sonicKnight2", name: 'Sonic Knight2', type: 'Action' },
  {
    id: "spaceInvaders", name: 'Star Invaders', type: 'Action' },
  {
    id: "steelBounce", name: 'Steel Bounce', type: 'Puzzle' },
  {
    id: "steelBounce2", name: 'Steel Bounce2', type: 'Action' },
  {
    id: "steelNinja", name: 'Steel Ninja', type: 'Strategy' },
  {
    id: "steelShooter", name: 'Steel Shooter', type: 'Strategy' },
  {
    id: "steelShooter2", name: 'Steel Shooter2', type: 'Arcade' },
  {
    id: "superBlaster", name: 'Super Blaster', type: 'Arcade' },
  {
    id: "superBlaster2", name: 'Super Blaster2', type: 'Arcade' },
  {
    id: "superDrop", name: 'Super Drop', type: 'Strategy' },
  {
    id: "superDrop2", name: 'Super Drop2', type: 'Strategy' },
  {
    id: "superKnight", name: 'Super Knight', type: 'Strategy' },
  {
    id: "superRunner", name: 'Super Runner', type: 'Sports' },
  {
    id: "terraBuilder", name: 'Terra Builder', type: 'Arcade' },
  {
    id: "terraNinja", name: 'Terra Ninja', type: 'Strategy' },
  {
    id: "terraNinja2", name: 'Terra Ninja2', type: 'Puzzle' },
  {
    id: "terraQuest", name: 'Terra Quest', type: 'Strategy' },
  {
    id: "terraQuest2", name: 'Terra Quest2', type: 'Action' },
  {
    id: "ticTacToe", name: 'Grid Tactics', type: 'Arcade' },
  {
    id: "towerStacker", name: 'Sky Stacker', type: 'Puzzle' },
  {
    id: "triviaQuiz", name: 'Data Quiz', type: 'Sports' },
  {
    id: "turboForce", name: 'Turbo Force', type: 'Sports' },
  {
    id: "turboMatch", name: 'Turbo Match', type: 'Arcade' },
  {
    id: "turboNinja", name: 'Turbo Ninja', type: 'Sports' },
  {
    id: "turboNinja2", name: 'Turbo Ninja2', type: 'Strategy' },
  {
    id: "turboQuest", name: 'Turbo Quest', type: 'Strategy' },
  {
    id: "turboQuest2", name: 'Turbo Quest2', type: 'Strategy' },
  {
    id: "turboSurfer", name: 'Turbo Surfer', type: 'Arcade' },
  {
    id: "typingTest", name: 'Typing Test', type: 'Strategy' },
  {
    id: "ultimatePuzzle", name: 'Ultimate Puzzle', type: 'Arcade' },
  {
    id: "ultraDefender", name: 'Ultra Defender', type: 'Sports' },
  {
    id: "ultraDrift", name: 'Ultra Drift', type: 'Sports' },
  {
    id: "ultraRacer", name: 'Ultra Racer', type: 'Arcade' },
  {
    id: "ultraRacer2", name: 'Ultra Racer2', type: 'Sports' },
  {
    id: "ultraStrike", name: 'Ultra Strike', type: 'Strategy' },
  {
    id: "ultraStrike2", name: 'Ultra Strike2', type: 'Arcade' },
  {
    id: "voidDash", name: 'Void Dash', type: 'Strategy' },
  {
    id: "voidDash2", name: 'Void Dash2', type: 'Strategy' },
  {
    id: "voidShooter", name: 'Void Shooter', type: 'Action' },
  {
    id: "voidSpin", name: 'Void Spin', type: 'Action' },
  {
    id: "voidSpin2", name: 'Void Spin2', type: 'Strategy' },
  {
    id: "whackAMole", name: 'Whack-A-Bot', type: 'Strategy' },
  {
    id: "wordSearch", name: 'Data Search', type: 'Sports' },
  {
    id: "xakArena", name: 'Xak Arena', type: 'Strategy' },
  {
    id: "xakSports", name: 'Xak Sports', type: 'Arcade' },
  {
    id: "xBRArena", name: 'X B R Arena', type: 'Puzzle' }
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
