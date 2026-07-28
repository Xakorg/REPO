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
    // Hide UI, Show Game Overlay
    document.getElementById('lobby-menu').classList.add('hidden');
    document.getElementById('game-overlay').classList.remove('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');

    const rules = document.getElementById('rules-mode').value;
    maxWins = rules === 'bo3' ? 2 : 1;
    p1Wins = 0; p2Wins = 0;
    
    resetRound();
    isPlaying = true;
}

function resetRound() {
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
    roundOver = false;
    aiEnemies = [];

    // Load map
    
    // Cleanup previous round
    if (p1) Matter.Composite.remove(engine.world, p1.composite);
    if (p2) Matter.Composite.remove(engine.world, p2.composite);
    if (currentLevel) {
        currentLevel.bodies.forEach(b => Matter.Composite.remove(engine.world, b));
    }
    
    document.getElementById('hud-p1-health').style.width = '100%';
    document.getElementById('hud-p2-health').style.width = '100%';

    // Get selected characters
    const p1Char = CharacterDatabase[GM.p1.selected] || CharacterDatabase["stickman"];
    const p2Char = CharacterDatabase[GM.p2.selected] || CharacterDatabase["stickman"];
    
    // Get map
    const mapVal = maps[currentMapIdx];
    currentLevel = new Level(engine.world, mapVal);

    // Instantiate players
    p1 = new Stickman(-200, 300, '#00ffff', { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', super: 'Space' }, engine.world, true, p1Char);
    p2 = new Stickman(200, 300, '#ff0055', { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', super: 'ShiftRight' }, engine.world, false, p2Char);

    camera = new Camera(render, p1, p2);
    
    // UI Init
    p1.updateHealthUI();
    p1.updateSuperUI();
    p2.updateHealthUI();
    p2.updateSuperUI();
}

function updateHUD() {
    p1.updateHealthUI();
    p2.updateHealthUI();
}

function handleCollisions(event) {
    if (!isPlaying || roundOver) return;

    event.pairs.forEach(pair => {
        const a = pair.bodyA;
        const b = pair.bodyB;
        
        // No more isGrounded logic needed, but lava still works
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
        
        if (isP1Weapon && defender.label.includes('_2') && !defender.label.startsWith('weapon')) {
            p2.takeDamage(impact);
            checkWinCondition();
        } else if (!isP1Weapon && defender.label.includes('_1') && !defender.label.startsWith('weapon')) {
            p1.takeDamage(impact);
            checkWinCondition();
        }
    }
}

function checkWinCondition() {
    if (roundOver) return;

    if (p1.isDead || p2.isDead) {
        let winner = null;
        if (p1.isDead && p2.isDead) winner = 0; // Draw
        else if (p1.isDead) winner = 2;
        else winner = 1;

        setTimeout(() => endRound(winner), 2000);
    }
}

function endRound(winner) {
    if (roundOver) return;
    roundOver = true;
    
    if (winner === 1) p1Wins++;
    if (winner === 2) p2Wins++;
    
    if (p1Wins >= maxWins || p2Wins >= maxWins) {
        // Game Over
        const modal = document.getElementById('game-over-modal');
        const text = document.getElementById('winner-text');
        
        modal.classList.remove('hidden');
        text.innerText = winner === 1 ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!";
        text.style.color = winner === 1 ? "var(--p1-color)" : "var(--p2-color)";
        
        // Give Gold
        if (winner === 1) { GM.addGold('p1', 50); GM.addGold('p2', 10); }
        else { GM.addGold('p2', 50); GM.addGold('p1', 10); }
    } else {
        setTimeout(startRound, 2000);
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
document.getElementById('btn-start-match').addEventListener('click', startGame);

document.getElementById('return-menu-btn').addEventListener('click', () => {
    document.getElementById('game-overlay').classList.add('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');
    showMenu('main-menu');
    isPlaying = false;
    
    if (p1) { Matter.Composite.remove(engine.world, p1.composite); p1 = null; }
    if (p2) { Matter.Composite.remove(engine.world, p2.composite); p2 = null; }
    if (currentLevel) {
        currentLevel.bodies.forEach(b => Matter.Composite.remove(engine.world, b));
        currentLevel = null;
    }
});

window.onload = initGame;
