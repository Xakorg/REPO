class GameManager {
    constructor() {
        this.p1 = this.loadProfile('p1');
        this.p2 = this.loadProfile('p2');
        
        // Setup character lists for the selector
        this.allCharIds = Object.keys(CharacterDatabase);
        this.p1SelectIndex = this.allCharIds.indexOf(this.p1.selected);
        this.p2SelectIndex = this.allCharIds.indexOf(this.p2.selected);
        
        if (this.p1SelectIndex === -1) this.p1SelectIndex = 0;
        if (this.p2SelectIndex === -1) this.p2SelectIndex = 0;

        this.updateCustomUI();
    }

    loadProfile(playerId) {
        const defaultProfile = { gold: 1000, unlocked: ["stickman"], selected: "stickman" };
        const saved = localStorage.getItem(`ssb_${playerId}`);
        return saved ? JSON.parse(saved) : defaultProfile;
    }

    saveProfile(playerId) {
        const profile = playerId === 'p1' ? this.p1 : this.p2;
        localStorage.setItem(`ssb_${playerId}`, JSON.stringify(profile));
    }

    addGold(playerId, amount) {
        const profile = playerId === 'p1' ? this.p1 : this.p2;
        profile.gold += amount;
        this.saveProfile(playerId);
        this.updateCustomUI();
    }

    spendGold(playerId, amount) {
        const profile = playerId === 'p1' ? this.p1 : this.p2;
        if (profile.gold >= amount) {
            profile.gold -= amount;
            this.saveProfile(playerId);
            this.updateCustomUI();
            return true;
        }
        return false;
    }

    changeSkin(playerId, dir) {
        let idx = playerId === 'p1' ? this.p1SelectIndex : this.p2SelectIndex;
        idx += dir;
        
        if (idx < 0) idx = this.allCharIds.length - 1;
        if (idx >= this.allCharIds.length) idx = 0;
        
        if (playerId === 'p1') this.p1SelectIndex = idx;
        else this.p2SelectIndex = idx;
        
        this.updateCustomUI();
    }

    buyOrEquipSkin(playerId) {
        const profile = playerId === 'p1' ? this.p1 : this.p2;
        const idx = playerId === 'p1' ? this.p1SelectIndex : this.p2SelectIndex;
        const charId = this.allCharIds[idx];
        const char = CharacterDatabase[charId];
        
        if (profile.unlocked.includes(charId)) {
            // Equip
            profile.selected = charId;
            this.saveProfile(playerId);
        } else {
            // Buy
            const cost = char.rarity === 'legendary' ? 250 : char.rarity === 'rare' ? 150 : 100;
            if (this.spendGold(playerId, cost)) {
                profile.unlocked.push(charId);
                profile.selected = charId;
                this.saveProfile(playerId);
            } else {
                alert("Not enough gold!");
            }
        }
        this.updateCustomUI();
    }

    updateCustomUI() {
        document.getElementById('custom-gold').innerText = `P1: ${this.p1.gold} | P2: ${this.p2.gold}`;
        
        const p1CharId = this.allCharIds[this.p1SelectIndex];
        const p2CharId = this.allCharIds[this.p2SelectIndex];
        
        document.getElementById('p1-skin-name').innerText = CharacterDatabase[p1CharId].name;
        document.getElementById('p2-skin-name').innerText = CharacterDatabase[p2CharId].name;
        
        const p1Btn = document.getElementById('p1-buy-btn');
        const p2Btn = document.getElementById('p2-buy-btn');
        
        if (this.p1.unlocked.includes(p1CharId)) {
            p1Btn.innerText = this.p1.selected === p1CharId ? "EQUIPPED" : "EQUIP";
            p1Btn.style.background = this.p1.selected === p1CharId ? "#555" : "var(--btn-color)";
        } else {
            const cost = CharacterDatabase[p1CharId].rarity === 'legendary' ? 250 : CharacterDatabase[p1CharId].rarity === 'rare' ? 150 : 100;
            p1Btn.innerText = `BUY (${cost}g)`;
            p1Btn.style.background = "var(--gold)";
        }
        
        if (this.p2.unlocked.includes(p2CharId)) {
            p2Btn.innerText = this.p2.selected === p2CharId ? "EQUIPPED" : "EQUIP";
            p2Btn.style.background = this.p2.selected === p2CharId ? "#555" : "var(--btn-color)";
        } else {
            const cost = CharacterDatabase[p2CharId].rarity === 'legendary' ? 250 : CharacterDatabase[p2CharId].rarity === 'rare' ? 150 : 100;
            p2Btn.innerText = `BUY (${cost}g)`;
            p2Btn.style.background = "var(--gold)";
        }
    }
}

// Global Instance
const GM = new GameManager();

function showMenu(menuId) {
    document.querySelectorAll('.ui-layer').forEach(el => el.classList.add('hidden'));
    document.getElementById(menuId).classList.remove('hidden');
}

// Event Listeners for UI
document.getElementById('btn-1p').addEventListener('click', () => alert("1 Player vs AI coming soon!"));
document.getElementById('btn-2p').addEventListener('click', () => showMenu('lobby-menu'));
document.getElementById('btn-survival').addEventListener('click', () => alert("Survival coming soon!"));
document.getElementById('btn-custom').addEventListener('click', () => showMenu('custom-menu'));
document.getElementById('btn-map').addEventListener('click', () => alert("Map Editor coming soon!"));

function changeSkin(playerId, dir) { GM.changeSkin(playerId, dir); }
document.getElementById('p1-buy-btn').addEventListener('click', () => GM.buyOrEquipSkin('p1'));
document.getElementById('p2-buy-btn').addEventListener('click', () => GM.buyOrEquipSkin('p2'));

let currentMapIdx = 0;
const maps = ['arena', 'islands', 'pit', 'bridge', 'stairway', 'bouncy', 'cage'];
function changeMap(dir) {
    currentMapIdx += dir;
    if (currentMapIdx < 0) currentMapIdx = maps.length - 1;
    if (currentMapIdx >= maps.length) currentMapIdx = 0;
    document.getElementById('map-name').innerText = maps[currentMapIdx].toUpperCase();
}
