const fs = require('fs');

const elements = ["Fire", "Ice", "Shadow", "Light", "Toxic", "Cyber", "Void", "Crystal", "Blood", "Storm"];
const classes = [
    { name: "Ninja", hp: 80, speed: 0.005, jump: 0.16, damageMult: 0.8, weight: 0.7, wp: "dagger", wpW: 50, wpH: 6, wpD: 0.0005, sup: "Triple Jump" },
    { name: "Brute", hp: 150, speed: 0.002, jump: 0.08, damageMult: 1.5, weight: 1.8, wp: "hammer", wpW: 60, wpH: 25, wpD: 0.003, sup: "Ground Smash" },
    { name: "Mage", hp: 70, speed: 0.004, jump: 0.14, damageMult: 1.1, weight: 0.8, wp: "staff", wpW: 90, wpH: 8, wpD: 0.001, sup: "Heal" },
    { name: "Brawler", hp: 120, speed: 0.004, jump: 0.12, damageMult: 1.0, weight: 1.1, wp: "gloves", wpW: 30, wpH: 30, wpD: 0.001, sup: "Dash Attack" },
    { name: "Sniper", hp: 90, speed: 0.004, jump: 0.13, damageMult: 2.0, weight: 0.9, wp: "rifle", wpW: 120, wpH: 8, wpD: 0.001, sup: "Dash Attack" },
    { name: "Knight", hp: 130, speed: 0.003, jump: 0.11, damageMult: 1.2, weight: 1.4, wp: "greatsword", wpW: 100, wpH: 12, wpD: 0.002, sup: "Heal" },
    { name: "Ghost", hp: 60, speed: 0.006, jump: 0.18, damageMult: 1.1, weight: 0.5, wp: "scythe", wpW: 90, wpH: 20, wpD: 0.0005, sup: "Triple Jump" },
    { name: "Mecha", hp: 200, speed: 0.0015, jump: 0.06, damageMult: 1.8, weight: 2.5, wp: "axe", wpW: 70, wpH: 35, wpD: 0.005, sup: "Ground Smash" },
    { name: "Samurai", hp: 100, speed: 0.0045, jump: 0.13, damageMult: 1.3, weight: 1.0, wp: "katana", wpW: 110, wpH: 5, wpD: 0.0008, sup: "Dash Attack" },
    { name: "Vampire", hp: 85, speed: 0.005, jump: 0.15, damageMult: 1.2, weight: 0.8, wp: "claws", wpW: 40, wpH: 15, wpD: 0.0005, sup: "Heal" }
];

const CharacterDatabase = {};
let count = 0;

// Manually add the classic stickman
CharacterDatabase["stickman"] = {
    id: "stickman",
    name: "Classic Stickman",
    rarity: "common",
    stats: { hp: 100, speed: 0.003, jump: 0.12, damageMult: 1.0, weight: 1.0 },
    weapon: { type: "sword", width: 80, height: 10, density: 0.001 },
    super: "Dash Attack"
};

for (const el of elements) {
    for (const cls of classes) {
        count++;
        const id = `${el.toLowerCase()}_${cls.name.toLowerCase()}`;
        
        // Determine rarity (pseudo-random based on hash or just sequence)
        let rarity = "common";
        if (count % 10 === 0) rarity = "legendary";
        else if (count % 3 === 0) rarity = "rare";

        // Boost stats based on rarity
        let multiplier = 1.0;
        if (rarity === "rare") multiplier = 1.2;
        if (rarity === "legendary") multiplier = 1.5;

        CharacterDatabase[id] = {
            id: id,
            name: `${el} ${cls.name}`,
            rarity: rarity,
            stats: {
                hp: Math.floor(cls.hp * multiplier),
                speed: Number((cls.speed * (rarity === 'legendary' ? 1.1 : 1.0)).toFixed(4)),
                jump: Number((cls.jump * (rarity === 'legendary' ? 1.1 : 1.0)).toFixed(3)),
                damageMult: Number((cls.damageMult * multiplier).toFixed(2)),
                weight: cls.weight
            },
            weapon: {
                type: cls.wp,
                width: cls.wpW,
                height: cls.wpH,
                density: cls.wpD
            },
            super: cls.sup
        };
    }
}

const fileContent = `const CharacterDatabase = ${JSON.stringify(CharacterDatabase, null, 4)};

const RarityWeights = {
    "basic": { common: 0.7, rare: 0.25, legendary: 0.05 },
    "epic": { common: 0, rare: 0.8, legendary: 0.2 },
    "legendary": { common: 0, rare: 0.2, legendary: 0.8 }
};
`;

fs.writeFileSync('js/Characters.js', fileContent);
console.log("Generated 100+ characters into Characters.js");
