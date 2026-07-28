class Stickman {
    constructor(x, y, color, controls, world, isPlayer1, charData) {
        this.world = world;
        this.color = color;
        this.controls = controls; // { up, down, left, right }
        this.isPlayer1 = isPlayer1;
        this.charData = charData;
        
        this.maxHealth = charData.stats.hp;
        this.health = this.maxHealth;
        this.isDead = false;
        
        this.superMeter = 0;
        this.superActive = false;
        
        const headRadius = 15;
        const torsoW = 15, torsoH = 40;
        const limbW = 8, limbH = 35;
        
        const group = Matter.Body.nextGroup(true);
        const weight = charData.stats.weight;
        
        const opts = {
            collisionFilter: { group: group },
            render: { fillStyle: color },
            frictionAir: 0.05, // A bit of air friction to make it floaty
            density: 0.002 * weight
        };

        this.head = Matter.Bodies.circle(x, y - 40, headRadius, { ...opts, label: `player_head_${isPlayer1 ? '1' : '2'}` });
        this.torso = Matter.Bodies.rectangle(x, y, torsoW, torsoH, { ...opts, label: `player_torso_${isPlayer1 ? '1' : '2'}` });
        this.armL = Matter.Bodies.rectangle(x - 20, y - 10, limbW, limbH, opts);
        this.armR = Matter.Bodies.rectangle(x + 20, y - 10, limbW, limbH, opts);
        this.legL = Matter.Bodies.rectangle(x - 10, y + 30, limbW, limbH, opts);
        this.legR = Matter.Bodies.rectangle(x + 10, y + 30, limbW, limbH, opts);

        const wp = charData.weapon;
        this.weapon = Matter.Bodies.rectangle(x + 40, y, wp.width, wp.height, {
            collisionFilter: { group: group },
            render: { fillStyle: '#ffffff' },
            density: wp.density,
            label: `weapon_${isPlayer1 ? '1' : '2'}`
        });

        this.bodies = [this.head, this.torso, this.armL, this.armR, this.legL, this.legR, this.weapon];
        
        // Supreme duelist style constraints: Loose enough to flail, tight enough to stick together
        const cOpts = { stiffness: 0.8, damping: 0.1, render: { visible: false } };
        
        this.constraints = [
            Matter.Constraint.create({ bodyA: this.head, bodyB: this.torso, pointA: { x: 0, y: headRadius }, pointB: { x: 0, y: -torsoH/2 }, ...cOpts }),
            Matter.Constraint.create({ bodyA: this.torso, bodyB: this.armL, pointA: { x: -torsoW/2, y: -torsoH/2 }, pointB: { x: 0, y: -limbH/2 }, ...cOpts }),
            Matter.Constraint.create({ bodyA: this.torso, bodyB: this.armR, pointA: { x: torsoW/2, y: -torsoH/2 }, pointB: { x: 0, y: -limbH/2 }, ...cOpts }),
            Matter.Constraint.create({ bodyA: this.torso, bodyB: this.legL, pointA: { x: -torsoW/2, y: torsoH/2 }, pointB: { x: 0, y: -limbH/2 }, ...cOpts }),
            Matter.Constraint.create({ bodyA: this.torso, bodyB: this.legR, pointA: { x: torsoW/2, y: torsoH/2 }, pointB: { x: 0, y: -limbH/2 }, ...cOpts }),
            
            // Attach weapon to Right Arm firmly
            Matter.Constraint.create({
                bodyA: this.armR, bodyB: this.weapon,
                pointA: { x: 0, y: limbH/2 }, pointB: { x: -wp.width/2 + 10, y: 0 },
                stiffness: 0.9, render: { visible: false }
            })
        ];

        this.composite = Matter.Composite.create({ bodies: this.bodies, constraints: this.constraints });
        Matter.World.add(this.world, this.composite);
    }

    update(keys) {
        if (this.isDead) return;

        // Joystick Input Vector
        let dx = 0;
        let dy = 0;
        
        if (keys[this.controls.up]) dy -= 1;
        if (keys[this.controls.down]) dy += 1;
        if (keys[this.controls.left]) dx -= 1;
        if (keys[this.controls.right]) dx += 1;

        if (dx !== 0 || dy !== 0) {
            // Normalize vector
            const mag = Math.sqrt(dx*dx + dy*dy);
            dx /= mag;
            dy /= mag;

            const forceMag = this.charData.stats.speed * 2.0;
            
            // Apply lifting force to torso
            Matter.Body.applyForce(this.torso, this.torso.position, { x: dx * forceMag, y: dy * forceMag });
            
            // Rotate the weapon to point in the direction of the joystick
            const targetAngle = Math.atan2(dy, dx);
            
            // Apply torque to twist the weapon towards target angle
            const currentAngle = this.weapon.angle;
            let diff = targetAngle - currentAngle;
            // Normalize diff to -PI to PI
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            
            Matter.Body.setAngularVelocity(this.weapon, diff * 0.1);
        }

        // Super Ability
        if (keys[this.controls.super] && this.superMeter >= 100) {
            this.executeSuper(dx, dy);
        }
    }

    executeSuper(dx, dy) {
        this.superMeter = 0;
        this.updateSuperUI();
        
        const type = this.charData.super;
        if (type === "Triple Jump") {
            Matter.Body.applyForce(this.torso, this.torso.position, { x: 0, y: -0.3 });
        } else if (type === "Ground Smash") {
            Matter.Body.applyForce(this.torso, this.torso.position, { x: 0, y: 0.5 });
        } else if (type === "Dash Attack") {
            // Dash in direction of joystick, default forward
            const dashX = (dx !== 0) ? dx * 0.3 : (this.isPlayer1 ? 0.3 : -0.3);
            const dashY = dy * 0.3;
            Matter.Body.applyForce(this.torso, this.torso.position, { x: dashX, y: dashY });
        } else if (type === "Heal") {
            this.health = Math.min(this.maxHealth, this.health + (this.maxHealth * 0.3));
            this.updateHealthUI();
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        amount *= this.charData.stats.damageMult;
        this.health -= amount;
        
        // Charge super when hit
        this.superMeter = Math.min(100, this.superMeter + (amount * 2));
        this.updateSuperUI();
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        this.updateHealthUI();
    }
    
    updateHealthUI() {
        const hpPercent = (this.health / this.maxHealth) * 100;
        const healthBarId = this.isPlayer1 ? 'hud-p1-health' : 'hud-p2-health';
        document.getElementById(healthBarId).style.width = hpPercent + '%';
    }

    updateSuperUI() {
        const superBarId = this.isPlayer1 ? 'hud-p1-super' : 'hud-p2-super';
        document.getElementById(superBarId).style.width = this.superMeter + '%';
        if (this.superMeter >= 100) {
            document.getElementById(superBarId).style.background = '#ffff00';
            document.getElementById(superBarId).style.boxShadow = '0 0 10px #ffff00';
        } else {
            document.getElementById(superBarId).style.background = '#ffaa00';
            document.getElementById(superBarId).style.boxShadow = 'none';
        }
    }
    
    die() {
        this.isDead = true;
        this.constraints.forEach(c => c.stiffness = 0.01);
    }
}
