// Global Game State
let engine, render, runner, world;
let p1, p2;
let level;
let camera;
let gameMode = 'deathmatch';
let mapSelection = 'arena';
let isPlaying = false;
let roundOver = false;
let p1Wins = 0, p2Wins = 0;
let survivalWave = 0;
let aiEnemies = [];

const keys = {};

function initGame() {
    engine = Matter.Engine.create();
    world = engine.world;
    engine.gravity.y = 1.0;

    render = Matter.Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: 'transparent',
            hasBounds: true // Enable camera bounds
        }
    });

    Matter.Render.run(render);
    runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    Matter.Events.on(engine, 'collisionStart', handleCollisions);
    Matter.Events.on(engine, 'collisionActive', handleActiveCollisions);

    // Main render loop override for builder and custom drawing
    Matter.Events.on(render, 'afterRender', () => {
        if (isBuilding) {
            const ctx = render.context;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.strokeStyle = '#fff';
            
            // Draw origin crosshair for reference
            ctx.beginPath();
            ctx.moveTo(window.innerWidth/2, 0);
            ctx.lineTo(window.innerWidth/2, window.innerHeight);
            ctx.moveTo(0, window.innerHeight/2);
            ctx.lineTo(window.innerWidth, window.innerHeight/2);
            ctx.stroke();

            // Draw saved rects
            builderRects.forEach(r => {
                ctx.fillRect(r.x + window.innerWidth/2, r.y + window.innerHeight/2, r.w, r.h);
            });
            
            // Draw current drawing rect
            if (isDrawing) {
                // Get current mouse from event (rough approximation, we don't have mouse move hooked up globally, 
                // but this gives a quick builder experience). We can skip dynamic drag-draw for MVP.
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameMode = document.getElementById('game-mode-select').value;
    mapSelection = document.getElementById('map-select').value;
    
    // Hide UI, Show Game Overlay
    document.getElementById('ui-container').classList.add('hidden');
    document.getElementById('game-overlay').classList.remove('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');

    p1Wins = 0; p2Wins = 0; survivalWave = 0;
    
    resetRound();
    isPlaying = true;
}

function resetRound() {
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
    roundOver = false;
    aiEnemies = [];

    // Load map
    level = new Level(world, mapSelection);

    // Get selected characters
    const p1CharData = JSON.parse(JSON.stringify(CharacterDatabase[GM.p1.selected]));
    const p2CharData = JSON.parse(JSON.stringify(CharacterDatabase[GM.p2.selected]));

    // Modifiers
    if (gameMode === 'juggernaut') {
        p1CharData.stats.hp *= 3;
        p1CharData.stats.weight *= 2;
        p1CharData.stats.speed *= 0.5;
    }

    // Spawn players
    p1 = new Stickman(-200, 300, 'var(--p1-color)', { up: 'KeyW', left: 'KeyA', right: 'KeyD', attack: 'Space', super: 'KeyE' }, world, true, p1CharData);
    p2 = new Stickman(200, 300, 'var(--p2-color)', { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', attack: 'Enter', super: 'ShiftRight' }, world, false, p2CharData);

    camera = new Camera(render, p1, p2);
    
    updateHUD();
}

function updateHUD() {
    document.getElementById('hud-p1-name').innerText = CharacterDatabase[GM.p1.selected].name;
    document.getElementById('hud-p2-name').innerText = CharacterDatabase[GM.p2.selected].name;
    p1.updateHealthUI();
    p1.updateSuperUI();
    p2.updateHealthUI();
    p2.updateSuperUI();
}

function handleCollisions(event) {
    if (!isPlaying || roundOver) return;

    event.pairs.forEach(pair => {
        const a = pair.bodyA;
        const b = pair.bodyB;
        
        // Lava instant death
        if (a.label === 'lava' || b.label === 'lava') {
            if (a.label.includes('player_torso_1') || b.label.includes('player_torso_1')) p1.takeDamage(9999);
            if (a.label.includes('player_torso_2') || b.label.includes('player_torso_2')) p2.takeDamage(9999);
        }

        const relVel = Matter.Vector.sub(a.velocity, b.velocity);
        const impact = Matter.Vector.magnitude(relVel);

        if (impact > 10) {
            checkDamage(a, b, impact);
            checkDamage(b, a, impact);
        }
    });
}

function handleActiveCollisions(event) {
    if (!isPlaying || roundOver) return;
    
    // Reset grounded state at start of check
    p1.isGrounded = false;
    p2.isGrounded = false;

    event.pairs.forEach(pair => {
        const a = pair.bodyA;
        const b = pair.bodyB;
        
        if (a.isStatic || b.isStatic) {
            if (a.label.includes('_1') || b.label.includes('_1')) p1.isGrounded = true;
            if (a.label.includes('_2') || b.label.includes('_2')) p2.isGrounded = true;
        }
    });
}

function checkDamage(attacker, defender, impact) {
    if (attacker.label.startsWith('weapon_')) {
        const isP1Weapon = attacker.label.includes('_1');
        const target = isP1Weapon ? p2 : p1; // For now ignoring AI targets for simplicity
        
        if (defender.label.includes(isP1Weapon ? '_2' : '_1')) {
            let dmg = impact * 0.8;
            if (defender.label.includes('head')) dmg *= 2;
            target.takeDamage(dmg);
            checkWinCondition();
        }
    }
}

function checkWinCondition() {
    if (roundOver) return;

    if (p1.isDead || p2.isDead) {
        roundOver = true;
        
        let winner = null;
        if (p1.isDead && p2.isDead) winner = 'draw';
        else if (p1.isDead) { winner = 'p2'; p2Wins++; }
        else { winner = 'p1'; p1Wins++; }

        setTimeout(() => handleRoundEnd(winner), 2000); // 2 second delay to watch ragdoll
    }
}

function handleRoundEnd(winner) {
    if (gameMode === 'bo3' && (p1Wins < 2 && p2Wins < 2)) {
        resetRound();
        return;
    }

    // Match Over
    isPlaying = false;
    const modal = document.getElementById('game-over-modal');
    const winTxt = document.getElementById('winner-text');
    const rewTxt = document.getElementById('reward-text');
    
    modal.classList.remove('hidden');
    
    if (winner === 'draw') {
        winTxt.innerText = "DRAW!";
        rewTxt.innerText = "P1: +10 Gold | P2: +10 Gold";
        GM.addGold('p1', 10);
        GM.addGold('p2', 10);
    } else {
        winTxt.innerText = winner === 'p1' ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!";
        winTxt.style.color = winner === 'p1' ? 'var(--p1-color)' : 'var(--p2-color)';
        rewTxt.innerText = "Winner: +50 Gold | Loser: +10 Gold";
        
        if (winner === 'p1') { GM.addGold('p1', 50); GM.addGold('p2', 10); }
        else { GM.addGold('p2', 50); GM.addGold('p1', 10); }
    }
}

function gameLoop() {
    if (isPlaying && !roundOver) {
        p1.update(keys);
        p2.update(keys);
        if (camera) camera.update();
        
        // Out of bounds death (falling too far)
        if (p1.torso.position.y > 2000) p1.takeDamage(9999);
        if (p2.torso.position.y > 2000) p2.takeDamage(9999);
        checkWinCondition();
    }
    requestAnimationFrame(gameLoop);
}

// Input Listeners
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// UI Buttons
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('return-menu-btn').addEventListener('click', () => {
    document.getElementById('game-overlay').classList.add('hidden');
    document.getElementById('ui-container').classList.remove('hidden');
    Matter.World.clear(world); // Clear game bodies so they don't render behind UI
});

window.onload = initGame;
