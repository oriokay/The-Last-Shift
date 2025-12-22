// js/player.js
class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 16;
        this.height = 24;
        this.speed = 2;
        this.runSpeed = 4;
        this.direction = 0; // radians
        this.animationFrame = 0;
        this.lastAnimationTime = 0;
        this.isRunning = false;
        this.flashlightOn = true;
        this.inventory = [];
        this.sanity = 100;
        this.maxSanity = 100;
        
        // Sprite state
        this.spriteState = 'idle';
        this.facing = 'down';
    }
    
    update(deltaTime, keys) {
        // Movement
        let dx = 0, dy = 0;
        this.isRunning = false;
        
        if (keys['shift']) {
            this.isRunning = true;
            this.speed = this.runSpeed;
            // Running drains sanity
            this.sanity = Math.max(0, this.sanity - deltaTime * 0.01);
        } else {
            this.speed = 2;
        }
        
        if (keys['w'] || keys['arrowup']) {
            dy -= this.speed;
            this.facing = 'up';
            this.direction = -Math.PI / 2;
        }
        if (keys['s'] || keys['arrowdown']) {
            dy += this.speed;
            this.facing = 'down';
            this.direction = Math.PI / 2;
        }
        if (keys['a'] || keys['arrowleft']) {
            dx -= this.speed;
            this.facing = 'left';
            this.direction = Math.PI;
        }
        if (keys['d'] || keys['arrowright']) {
            dx += this.speed;
            this.facing = 'right';
            this.direction = 0;
        }
        
        // Update position with collision
        this.x += dx;
        this.y += dy;
        
        // Keep in bounds
        this.x = Math.max(this.width/2, Math.min(800 - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(600 - this.height/2, this.y));
        
        // Update animation
        if (dx !== 0 || dy !== 0) {
            this.spriteState = this.isRunning ? 'run' : 'walk';
            this.animationFrame = (this.animationFrame + 1) % 3;
        } else {
            this.spriteState = 'idle';
        }
        
        // Check for item pickup
        if (keys[' ']) { // Space bar
            this.tryPickupItem();
        }
    }
    
    draw(ctx) {
        // Get sprite based on state and facing direction
        const sprite = Sprites.player[this.spriteState][this.facing][this.animationFrame % 3];
        
        // Draw player sprite
        Sprites.draw(ctx, Sprites.player[this.spriteState][this.facing], this.x, this.y, this.animationFrame);
        
        // Draw flashlight indicator
        if (this.flashlightOn) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    toggleFlashlight() {
        this.flashlightOn = !this.flashlightOn;
        this.game.showMessage(`Flashlight ${this.flashlightOn ? 'ON' : 'OFF'}`);
    }
    
    tryPickupItem() {
        // Find nearest item
        let nearestItem = null;
        let nearestDist = 50; // Pickup radius
        
        for (const item of this.game.items) {
            if (!item.collected) {
                const dist = Math.sqrt(
                    Math.pow(item.x - this.x, 2) + 
                    Math.pow(item.y - this.y, 2)
                );
                
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestItem = item;
                }
            }
        }
        
        if (nearestItem) {
            nearestItem.collected = true;
            this.inventory.push(nearestItem);
            this.game.showMessage(`Picked up: ${nearestItem.name}`);
            
            // Special effects for certain items
            if (nearestItem.type === 'soda') {
                this.sanity = Math.min(this.maxSanity, this.sanity + 30);
                this.game.state.sanity = this.sanity;
                this.game.showMessage("Sparkle-Cola consumed! Sanity +30%");
            }
        }
    }
    
    hasItem(type) {
        return this.inventory.some(item => item.type === type);
    }
    
    useItem(type) {
        const index = this.inventory.findIndex(item => item.type === type);
        if (index > -1) {
            this.inventory.splice(index, 1);
            return true;
        }
        return false;
    }
}
