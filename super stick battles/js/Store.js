function buyChest(tier) {
    const costs = { basic: 75, epic: 150, legendary: 250 };
    const cost = costs[tier];

    // Determine who is buying
    const buyer = document.getElementById('store-buyer').value;

    if (!GM.spendGold(buyer, cost)) {
        alert("Not enough gold!");
        return;
    }

    // Roll Rarity
    const roll = Math.random();
    const weights = RarityWeights[tier];
    let selectedRarity = 'common';
    
    if (roll < weights.legendary) {
        selectedRarity = 'legendary';
    } else if (roll < weights.legendary + weights.rare) {
        selectedRarity = 'rare';
    }

    // Pick character of that rarity
    const possibleChars = Object.values(CharacterDatabase).filter(c => c.rarity === selectedRarity);
    const unlockedChar = possibleChars[Math.floor(Math.random() * possibleChars.length)];

    // Unlock only for the buyer
    GM.unlockCharacter(buyer, unlockedChar.id);

    showUnlockModal(unlockedChar, buyer);
}

function showUnlockModal(char, buyerName) {
    const modal = document.getElementById('unlock-modal');
    const titleTxt = document.getElementById('unlock-title');
    const nameTxt = document.getElementById('unlock-name');
    
    titleTxt.innerText = `${buyerName.toUpperCase()} unlocked:`;
    nameTxt.innerText = char.name;
    
    if (char.rarity === 'legendary') nameTxt.style.color = 'var(--gold)';
    else if (char.rarity === 'rare') nameTxt.style.color = '#a855f7';
    else nameTxt.style.color = 'var(--text-main)';

    modal.classList.remove('hidden');
}

function closeUnlockModal() {
    document.getElementById('unlock-modal').classList.add('hidden');
}
