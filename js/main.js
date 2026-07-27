// Game State
let engine, render, runner, world;
let p1, p2, level;
let gameOver = false;

// Input State
const keys = {};

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

function init() {
    // Setup Matter.js
    engine = Matter.Engine.create();
    world = engine.world;
    
    // Set slightly lower gravity for floatier combat
    engine.gravity.y = 0.8;

    render = Matter.Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            wireframes: false,
            background: 'transparent'
        }
    });

    // Make canvas appear behind UI
    render.canvas.style.position = 'absolute';
    render.canvas.style.zIndex = '-1';
    render.canvas.style.top = '50%';
    render.canvas.style.left = '50%';
    render.canvas.style.transform = 'translate(-50%, -50%)';

    // Create Level
    level = new Level(world, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Create Players
    // P1 (Left Side, Cyan)
    p1 = new Stickman(200, 200, '#00f3ff', {
        up: 'KeyW',
        left: 'KeyA',
        right: 'KeyD',
        attack: 'Space'
    }, world, true);

    // P2 (Right Side, Pink/Red)
    p2 = new Stickman(800, 200, '#ff0055', {
        up: 'ArrowUp',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        attack: 'Enter'
    }, world, false);

    // Run Engine
    Matter.Render.run(render);
    runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    
    // Setup collision listener for damage
    Matter.Events.on(engine, 'collisionStart', handleCollisions);

    // Start Game Loop
    requestAnimationFrame(gameLoop);
}

function handleCollisions(event) {
    if (gameOver) return;

    const pairs = event.pairs;
    
    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;
        
        // Calculate collision impact force
        const relativeVelocity = Matter.Vector.sub(bodyA.velocity, bodyB.velocity);
        const impact = Matter.Vector.magnitude(relativeVelocity);
        
        // Only trigger damage on significant impacts
        if (impact > 15) {
            checkDamage(bodyA, bodyB, impact);
            checkDamage(bodyB, bodyA, impact);
        }
    }
}

function checkDamage(attackerBody, defenderBody, impact) {
    // If a weapon hits a body part
    if (attackerBody.label.startsWith('weapon_')) {
        const isP1Weapon = attackerBody.label.includes('_1');
        const defender = isP1Weapon ? p2 : p1;
        
        // Make sure we are hitting the other player
        if (defenderBody.label.includes(isP1Weapon ? '_2' : '_1')) {
            // Damage scaling based on impact
            let baseDamage = impact * 0.5;
            
            // Headshots do more damage
            if (defenderBody.label.includes('head')) {
                baseDamage *= 2;
            }
            
            defender.takeDamage(baseDamage);
            checkGameOver();
        }
    }
}

function checkGameOver() {
    if (p1.isDead || p2.isDead) {
        gameOver = true;
        const gameOverUI = document.getElementById('game-over');
        const winnerText = document.getElementById('winner-text');
        
        gameOverUI.classList.remove('hidden');
        
        if (p1.isDead && p2.isDead) {
            winnerText.innerText = 'DRAW!';
            winnerText.style.color = '#fff';
        } else if (p1.isDead) {
            winnerText.innerText = 'PLAYER 2 WINS!';
            winnerText.style.color = 'var(--p2-color)';
        } else {
            winnerText.innerText = 'PLAYER 1 WINS!';
            winnerText.style.color = 'var(--p1-color)';
        }
    }
}

function resetGame() {
    // Clear physics world
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
    
    // Hide UI
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('p1-health').style.width = '100%';
    document.getElementById('p2-health').style.width = '100%';
    
    gameOver = false;
    
    // Re-create Level and Players
    level = new Level(world, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p1 = new Stickman(200, 200, '#00f3ff', {
        up: 'KeyW',
        left: 'KeyA',
        right: 'KeyD',
        attack: 'Space'
    }, world, true);

    p2 = new Stickman(800, 200, '#ff0055', {
        up: 'ArrowUp',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        attack: 'Enter'
    }, world, false);
}

function gameLoop() {
    if (!gameOver) {
        p1.update(keys);
        p2.update(keys);
    } else {
        // Keep checking for bodies to fall if game is over
        // But players can't move
    }
    
    requestAnimationFrame(gameLoop);
}

// Event Listeners
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.getElementById('restart-btn').addEventListener('click', () => {
    resetGame();
});

// Start Game
window.onload = init;
