class Level {
    constructor(world, mapData) {
        this.world = world;
        this.bodies = [];
        
        const opts = { isStatic: true, render: { fillStyle: '#3f3f46' }, friction: 0.8 };
        
        // Large boundaries to prevent falling off the world
        const bounds = [
            Matter.Bodies.rectangle(0, 2000, 10000, 100, opts), // Massive floor
            Matter.Bodies.rectangle(-2000, 0, 100, 4000, opts), // Left Wall
            Matter.Bodies.rectangle(2000, 0, 100, 4000, opts)  // Right Wall
        ];

        if (mapData === 'arena') {
            this.bodies.push(
                Matter.Bodies.rectangle(0, 500, 1500, 50, opts), // Main stage
                Matter.Bodies.rectangle(-400, 300, 200, 20, opts), // L plat
                Matter.Bodies.rectangle(400, 300, 200, 20, opts)  // R plat
            );
        } else if (mapData === 'islands') {
            this.bodies.push(
                Matter.Bodies.rectangle(0, 600, 400, 30, opts),
                Matter.Bodies.rectangle(-600, 400, 300, 30, opts),
                Matter.Bodies.rectangle(600, 400, 300, 30, opts),
                Matter.Bodies.rectangle(0, 200, 200, 30, opts)
            );
        } else if (mapData === 'pit') {
            this.bodies.push(
                Matter.Bodies.rectangle(-500, 500, 800, 50, opts),
                Matter.Bodies.rectangle(500, 500, 800, 50, opts),
                // The gap is in the middle. We can add a "lava" hazard later, but falling into the gap kills.
                Matter.Bodies.rectangle(0, 1200, 2000, 50, { ...opts, render: { fillStyle: '#ff0000' }, label: 'lava' })
            );
        } else if (mapData === 'bridge') {
            this.bodies.push(
                Matter.Bodies.rectangle(0, 500, 400, 30, opts) // Only one narrow bridge, huge drop
            );
        } else if (mapData === 'stairway') {
            this.bodies.push(
                Matter.Bodies.rectangle(-400, 800, 200, 20, opts),
                Matter.Bodies.rectangle(-200, 600, 200, 20, opts),
                Matter.Bodies.rectangle(0, 400, 200, 20, opts),
                Matter.Bodies.rectangle(200, 200, 200, 20, opts),
                Matter.Bodies.rectangle(400, 0, 200, 20, opts)
            );
        } else if (mapData === 'bouncy') {
            const bouncyOpts = { ...opts, restitution: 1.5 }; // Super bouncy
            this.bodies.push(
                Matter.Bodies.rectangle(0, 700, 1500, 50, bouncyOpts),
                Matter.Bodies.rectangle(-300, 400, 200, 20, bouncyOpts),
                Matter.Bodies.rectangle(300, 400, 200, 20, bouncyOpts)
            );
        } else if (mapData === 'cage') {
            this.bodies.push(
                Matter.Bodies.rectangle(0, 800, 1000, 50, opts), // Floor
                Matter.Bodies.rectangle(-500, 400, 50, 800, opts), // Left Wall
                Matter.Bodies.rectangle(500, 400, 50, 800, opts), // Right Wall
                Matter.Bodies.rectangle(0, 0, 1000, 50, opts) // Ceiling
            );
        } else {
            // Check custom maps
            const customMaps = JSON.parse(localStorage.getItem('ssb_custom_maps') || '{}');
            if (customMaps[mapData]) {
                customMaps[mapData].forEach(rect => {
                    this.bodies.push(Matter.Bodies.rectangle(
                        rect.x + rect.w/2, 
                        rect.y + rect.h/2, 
                        rect.w, 
                        rect.h, 
                        opts
                    ));
                });
            }
        }
        
        Matter.World.add(this.world, bounds);
        Matter.World.add(this.world, this.bodies);
    }
}
