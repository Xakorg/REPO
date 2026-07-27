class GameManager {
    constructor() {
        this.p1 = this.loadProfile('p1');
        this.p2 = this.loadProfile('p2');
        
        // Give infinite gold for testing
        this.p1.gold = 999999;
        this.p2.gold = 999999;
        this.saveProfile('p1');
        this.saveProfile('p2');
        
        this.updateUI();
        this.populateLoadoutSelects();
    }

    loadProfile(playerId) {
        const defaultProfile = {
            gold: 75,
            unlocked: ["stickman"],
            selected: "stickman"
        };
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
        this.updateUI();
    }

    spendGold(playerId, amount) {
        const profile = playerId === 'p1' ? this.p1 : this.p2;
        if (profile.gold >= amount) {
            profile.gold -= amount;
            this.saveProfile(playerId);
            this.updateUI();
            return true;
        }
        return false;
    }

    unlockCharacter(playerId, charId) {
        const profile = playerId === 'p1' ? this.p1 : this.p2;
        if (!profile.unlocked.includes(charId)) {
            profile.unlocked.push(charId);
            this.saveProfile(playerId);
            this.populateLoadoutSelects();
        }
    }

    updateUI() {
        document.getElementById('p1-gold').innerText = this.p1.gold;
        document.getElementById('p2-gold').innerText = this.p2.gold;
    }

    populateLoadoutSelects() {
        const p1Select = document.getElementById('p1-char-select');
        const p2Select = document.getElementById('p2-char-select');
        
        p1Select.innerHTML = '';
        p2Select.innerHTML = '';

        this.p1.unlocked.forEach(charId => {
            const char = CharacterDatabase[charId];
            const opt = document.createElement('option');
            opt.value = charId;
            opt.innerText = char.name;
            if (this.p1.selected === charId) opt.selected = true;
            p1Select.appendChild(opt);
        });

        this.p2.unlocked.forEach(charId => {
            const char = CharacterDatabase[charId];
            const opt = document.createElement('option');
            opt.value = charId;
            opt.innerText = char.name;
            if (this.p2.selected === charId) opt.selected = true;
            p2Select.appendChild(opt);
        });

        this.updateStatsDisplay('p1', this.p1.selected);
        this.updateStatsDisplay('p2', this.p2.selected);
    }

    updateStatsDisplay(playerId, charId) {
        const statsBox = document.getElementById(`${playerId}-stats`);
        const char = CharacterDatabase[charId];
        statsBox.innerHTML = `
            <strong>HP:</strong> ${char.stats.hp}<br>
            <strong>Speed:</strong> ${char.stats.speed}<br>
            <strong>Super:</strong> ${char.super}
        `;
    }

    selectCharacter(playerId, charId) {
        const profile = playerId === 'p1' ? this.p1 : this.p2;
        profile.selected = charId;
        this.saveProfile(playerId);
        this.updateStatsDisplay(playerId, charId);
    }
}

// Global Instance
const GM = new GameManager();

// Event Listeners for Loadout
document.getElementById('p1-char-select').addEventListener('change', (e) => {
    GM.selectCharacter('p1', e.target.value);
});
document.getElementById('p2-char-select').addEventListener('change', (e) => {
    GM.selectCharacter('p2', e.target.value);
});
