class Camera {
    constructor(render, p1, p2) {
        this.render = render;
        this.p1 = p1;
        this.p2 = p2;
        
        // Base viewport size
        this.baseWidth = window.innerWidth;
        this.baseHeight = window.innerHeight;
        
        // Boundaries
        this.minZoom = 0.5; // Furthest zoomed out
        this.maxZoom = 1.2; // Closest zoomed in
        this.padding = 400; // Pixels of padding around players
    }

    update() {
        if (!this.p1.composite || !this.p2.composite) return;
        
        // Get player positions
        const p1Pos = this.p1.torso.position;
        const p2Pos = this.p2.torso.position;

        // Calculate midpoint
        const midX = (p1Pos.x + p2Pos.x) / 2;
        const midY = (p1Pos.y + p2Pos.y) / 2;

        // Calculate distance between players to determine zoom
        const dx = Math.abs(p1Pos.x - p2Pos.x);
        const dy = Math.abs(p1Pos.y - p2Pos.y);
        
        // Required width/height to fit both players with padding
        const reqWidth = dx + this.padding;
        const reqHeight = dy + this.padding;

        // Calculate zoom based on aspect ratio
        const zoomX = this.baseWidth / reqWidth;
        const zoomY = this.baseHeight / reqHeight;
        
        // Take the smallest zoom to ensure both fit
        let targetZoom = Math.min(zoomX, zoomY);
        
        // Clamp zoom
        targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));

        // Calculate the new bounds for the render viewport
        const viewWidth = this.baseWidth / targetZoom;
        const viewHeight = this.baseHeight / targetZoom;

        // Center bounds around midpoint
        const bounds = {
            min: { x: midX - viewWidth / 2, y: midY - viewHeight / 2 },
            max: { x: midX + viewWidth / 2, y: midY + viewHeight / 2 }
        };

        // Smoothly interpolate current bounds to target bounds
        const lerpFactor = 0.1;
        
        this.render.bounds.min.x += (bounds.min.x - this.render.bounds.min.x) * lerpFactor;
        this.render.bounds.min.y += (bounds.min.y - this.render.bounds.min.y) * lerpFactor;
        this.render.bounds.max.x += (bounds.max.x - this.render.bounds.max.x) * lerpFactor;
        this.render.bounds.max.y += (bounds.max.y - this.render.bounds.max.y) * lerpFactor;
    }
}
