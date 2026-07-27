class Stickman {
    constructor(x, y, color, controls, world, isPlayer1) {
        this.world = world;
        this.color = color;
        this.controls = controls; // { up, left, right, attack }
        this.isPlayer1 = isPlayer1;
        
        this.health = 100;
        this.isDead = false;
        
        // Physics dimensions
        const headRadius = 15;
        const torsoW = 15, torsoH = 45;
        const limbW = 10, limbH = 40;
        
        // Unique group so body parts don't collide with each other
        const group = Matter.Body.nextGroup(true);
        
        const commonOpts = {
            collisionFilter: { group: group },
            render: { fillStyle: color },
            friction: 0.8,
            restitution: 0.1
        };

        // Create parts
        this.head = Matter.Bodies.circle(x, y - 50, headRadius, {
            ...commonOpts,
            label: `player_head_${isPlayer1 ? '1' : '2'}`
        });
        
        this.torso = Matter.Bodies.rectangle(x, y, torsoW, torsoH, {
            ...commonOpts,
            label: `player_torso_${isPlayer1 ? '1' : '2'}`
        });
        
        this.armL = Matter.Bodies.rectangle(x - 20, y - 10, limbW, limbH, commonOpts);
        this.armR = Matter.Bodies.rectangle(x + 20, y - 10, limbW, limbH, commonOpts);
        this.legL = Matter.Bodies.rectangle(x - 10, y + 40, limbW, limbH, commonOpts);
        this.legR = Matter.Bodies.rectangle(x + 10, y + 40, limbW, limbH, commonOpts);

        // Weapon
        this.weapon = Matter.Bodies.rectangle(
            isPlayer1 ? x + 40 : x - 40, 
            y, 
            80, 
            10, 
            {
                collisionFilter: { group: group },
                render: { fillStyle: '#ffffff' },
                density: 0.05,
                label: `weapon_${isPlayer1 ? '1' : '2'}`
            }
        );

        this.bodies = [this.head, this.torso, this.armL, this.armR, this.legL, this.legR, this.weapon];
        
        // Constraints
        const stiffnessOpts = { stiffness: 0.9, render: { visible: false } };
        
        this.constraints = [
            // Head to Torso
            Matter.Constraint.create({
                bodyA: this.head, bodyB: this.torso,
                pointA: { x: 0, y: headRadius }, pointB: { x: 0, y: -torsoH/2 },
                ...stiffnessOpts
            }),
            // Arms to Torso
            Matter.Constraint.create({
                bodyA: this.torso, bodyB: this.armL,
                pointA: { x: -torsoW/2, y: -torsoH/2 + 5 }, pointB: { x: 0, y: -limbH/2 },
                ...stiffnessOpts
            }),
            Matter.Constraint.create({
                bodyA: this.torso, bodyB: this.armR,
                pointA: { x: torsoW/2, y: -torsoH/2 + 5 }, pointB: { x: 0, y: -limbH/2 },
                ...stiffnessOpts
            }),
            // Legs to Torso
            Matter.Constraint.create({
                bodyA: this.torso, bodyB: this.legL,
                pointA: { x: -torsoW/2, y: torsoH/2 }, pointB: { x: 0, y: -limbH/2 },
                ...stiffnessOpts
            }),
            Matter.Constraint.create({
                bodyA: this.torso, bodyB: this.legR,
                pointA: { x: torsoW/2, y: torsoH/2 }, pointB: { x: 0, y: -limbH/2 },
                ...stiffnessOpts
            }),
            // Weapon to Right Arm (or left if P2)
            Matter.Constraint.create({
                bodyA: this.isPlayer1 ? this.armR : this.armL, 
                bodyB: this.weapon,
                pointA: { x: 0, y: limbH/2 }, 
                pointB: { x: this.isPlayer1 ? -30 : 30, y: 0 },
                ...stiffnessOpts
            })
        ];

        this.composite = Matter.Composite.create({
            bodies: this.bodies,
            constraints: this.constraints
        });

        Matter.World.add(this.world, this.composite);
    }

    update(keys) {
        if (this.isDead) return;

        const force = 0.003;
        const jumpForce = 0.12;

        // Apply movement forces to the torso
        if (keys[this.controls.left]) {
            Matter.Body.applyForce(this.torso, this.torso.position, { x: -force, y: 0 });
        }
        if (keys[this.controls.right]) {
            Matter.Body.applyForce(this.torso, this.torso.position, { x: force, y: 0 });
        }
        
        // Jump if near the ground
        if (keys[this.controls.up]) {
            if (Math.abs(this.torso.velocity.y) < 1) {
                Matter.Body.applyForce(this.torso, this.torso.position, { x: 0, y: -jumpForce });
            }
        }
        
        // Attack logic: Swing weapon by rotating it
        if (keys[this.controls.attack]) {
             const spinDir = this.isPlayer1 ? 0.05 : -0.05;
             Matter.Body.applyForce(this.weapon, { x: this.weapon.position.x + (this.isPlayer1 ? 20 : -20), y: this.weapon.position.y }, { x: 0, y: -0.01 });
             Matter.Body.setAngularVelocity(this.weapon, spinDir);
        }
        
        // Keep torso upright
        Matter.Body.setAngle(this.torso, 0);
        Matter.Body.setAngularVelocity(this.torso, 0);
        
        // Keep head upright relative to torso
        Matter.Body.setAngle(this.head, 0);
        Matter.Body.setAngularVelocity(this.head, 0);
    }
    
    takeDamage(amount) {
        if (this.isDead) return;
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        // Update UI
        const healthBarId = this.isPlayer1 ? 'p1-health' : 'p2-health';
        document.getElementById(healthBarId).style.width = this.health + '%';
        
        return this.health;
    }
    
    die() {
        this.isDead = true;
        // Make joints loose when dead for ragdoll effect
        this.constraints.forEach(c => {
            c.stiffness = 0.01;
        });
        
        // Stop forcing upright
    }
}
