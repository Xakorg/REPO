class Level {
    constructor(world, width, height) {
        this.world = world;
        this.width = width;
        this.height = height;
        
        // Static bodies
        const opts = { isStatic: true, render: { fillStyle: '#2a2a35' }, friction: 0.8 };
        
        this.bodies = [
            // Floor
            Matter.Bodies.rectangle(width/2, height - 20, width, 40, opts),
            // Left Wall
            Matter.Bodies.rectangle(10, height/2, 20, height, opts),
            // Right Wall
            Matter.Bodies.rectangle(width - 10, height/2, 20, height, opts),
            // Ceiling
            Matter.Bodies.rectangle(width/2, 10, width, 20, opts),
            
            // Platforms
            Matter.Bodies.rectangle(200, height - 150, 150, 20, opts),
            Matter.Bodies.rectangle(width - 200, height - 150, 150, 20, opts),
            Matter.Bodies.rectangle(width/2, height - 300, 200, 20, opts)
        ];
        
        Matter.World.add(this.world, this.bodies);
    }
}
