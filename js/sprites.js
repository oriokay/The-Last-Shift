// Sprite system for pixel art graphics
const Sprites = {
    // Player sprites (16x24 pixels)
    player: {
        idle: {
            up: [[0, 0, 16, 24], [16, 0, 16, 24]],
            down: [[0, 24, 16, 24], [16, 24, 16, 24]],
            left: [[0, 48, 16, 24], [16, 48, 16, 24]],
            right: [[0, 72, 16, 24], [16, 72, 16, 24]]
        },
        walk: {
            up: [[32, 0, 16, 24], [48, 0, 16, 24], [64, 0, 16, 24]],
            down: [[32, 24, 16, 24], [48, 24, 16, 24], [64, 24, 16, 24]],
            left: [[32, 48, 16, 24], [48, 48, 16, 24], [64, 48, 16, 24]],
            right: [[32, 72, 16, 24], [48, 72, 16, 24], [64, 72, 16, 24]]
        },
        run: {
            up: [[80, 0, 16, 24], [96, 0, 16, 24], [112, 0, 16, 24]],
            down: [[80, 24, 16, 24], [96, 24, 16, 24], [112, 24, 16, 24]],
            left: [[80, 48, 16, 24], [96, 48, 16, 24], [112, 48, 16, 24]],
            right: [[80, 72, 16, 24], [96, 72, 16, 24], [112, 72, 16, 24]]
        }
    },

    // Entity sprites (16x24 pixels)
    entities: {
        gatherer: {
            idle: [[0, 96, 16, 24], [16, 96, 16, 24]],
            walk: [[32, 96, 16, 24], [48, 96, 16, 24]],
            aggressive: [[64, 96, 16, 24], [80, 96, 16, 24]]
        },
        tapper: {
            idle: [[0, 120, 16, 24], [16, 120, 16, 24]],
            tapping: [[32, 120, 16, 24], [48, 120, 16, 24]],
            breaking: [[64, 120, 16, 24]]
        },
        auditor: {
            idle: [[0, 144, 16, 24]],
            inspecting: [[16, 144, 16, 24], [32, 144, 16, 24]],
            angry: [[48, 144, 16, 24]]
        },
        lostChild: {
            idle: [[0, 168, 12, 18]],
            crying: [[12, 168, 12, 18]],
            teleport: [[24, 168, 12, 18]]
        }
    },

    // Item sprites (16x16 pixels)
    items: {
        soda: [0, 192, 16, 16],
        battery: [16, 192, 16, 16],
        tape: [32, 192, 16, 16],
        scanner: [48, 192, 16, 16],
        airhorn: [64, 192, 16, 16],
        cleaner: [80, 192, 16, 16],
        plush: [96, 192, 16, 16],
        jerky: [112, 192, 16, 16]
    },

    // Tile sprites (32x32 pixels)
    tiles: {
        floor: [0, 208, 32, 32],
        wall: [32, 208, 32, 32],
        register: [64, 208, 32, 32],
        shelf: [96, 208, 32, 64],
        freezer: [128, 208, 32, 64],
        breakTable: [160, 208, 64, 32],
        door: [224, 208, 32, 32],
        window: [256, 208, 32, 32]
    },

    // Effects
    effects: {
        blood: [0, 272, 16, 16],
        brokenGlass: [16, 272, 16, 16],
        lightBeam: [32, 272, 64, 64],
        sanityEffect: [96, 272, 32, 32]
    },

    // Generate sprite sheet dynamically
    generateSpriteSheet: function(ctx) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const spriteCtx = canvas.getContext('2d');
        
        // Set transparent background
        spriteCtx.clearRect(0, 0, 512, 512);
        
        // ========== PLAYER SPRITES ==========
        // Uniform (light blue)
        spriteCtx.fillStyle = '#6b8cff';
        this.drawPlayerSprites(spriteCtx);
        
        // ========== ENTITY SPRITES ==========
        // Gatherer (purple uniform)
        spriteCtx.fillStyle = '#8b46c7';
        this.drawEntitySprites(spriteCtx, 96, 24);
        
        // Tapper (gray customer)
        spriteCtx.fillStyle = '#888888';
        this.drawEntitySprites(spriteCtx, 120, 24);
        
        // Auditor (black suit)
        spriteCtx.fillStyle = '#111111';
        this.drawEntitySprites(spriteCtx, 144, 24);
        
        // Lost Child (small, yellow)
        spriteCtx.fillStyle = '#ffcc00';
        this.drawSmallEntitySprites(spriteCtx, 168, 18);
        
        // ========== ITEM SPRITES ==========
        this.drawItemSprites(spriteCtx);
        
        // ========== TILE SPRITES ==========
        this.drawTileSprites(spriteCtx);
        
        // ========== EFFECT SPRITES ==========
        this.drawEffectSprites(spriteCtx);
        
        return canvas;
    },

    drawPlayerSprites: function(ctx) {
        // Player body
        for(let i = 0; i < 3; i++) {
            // Idle (facing up/down/left/right)
            this.drawHumanSprite(ctx, 0 + i*16, 0); // up
            this.drawHumanSprite(ctx, 0 + i*16, 24); // down
            this.drawHumanSprite(ctx, 0 + i*16, 48); // left
            this.drawHumanSprite(ctx, 0 + i*16, 72); // right
            
            // Walking animation frames
            this.drawHumanSprite(ctx, 32 + i*16, 0);
            this.drawHumanSprite(ctx, 32 + i*16, 24);
            this.drawHumanSprite(ctx, 32 + i*16, 48);
            this.drawHumanSprite(ctx, 32 + i*16, 72);
            
            // Running animation frames
            this.drawHumanSprite(ctx, 80 + i*16, 0);
            this.drawHumanSprite(ctx, 80 + i*16, 24);
            this.drawHumanSprite(ctx, 80 + i*16, 48);
            this.drawHumanSprite(ctx, 80 + i*16, 72);
        }
    },

    drawHumanSprite: function(ctx, x, y) {
        // Head (6x6)
        ctx.fillRect(x + 5, y + 2, 6, 6);
        
        // Body (10x12)
        ctx.fillRect(x + 3, y + 8, 10, 12);
        
        // Arms
        ctx.fillRect(x + 1, y + 8, 2, 8); // left
        ctx.fillRect(x + 13, y + 8, 2, 8); // right
        
        // Legs
        ctx.fillRect(x + 5, y + 20, 3, 4);
        ctx.fillRect(x + 8, y + 20, 3, 4);
        
        // Uniform details (darker)
        ctx.fillStyle = '#4a6cdf';
        ctx.fillRect(x + 3, y + 12, 10, 4); // shirt stripe
        ctx.fillStyle = ctx.fillStyle; // Reset to current color
    },

    drawEntitySprites: function(ctx, startY, height) {
        // Draw different poses for entities
        for(let i = 0; i < 4; i++) {
            const x = i * 16;
            // Body
            ctx.fillRect(x + 3, startY + 4, 10, height - 8);
            // Head
            ctx.fillRect(x + 5, startY, 6, 6);
            // Arms (varied poses)
            if(i === 0 || i === 2) {
                // Arms down
                ctx.fillRect(x + 1, startY + 4, 2, 8);
                ctx.fillRect(x + 13, startY + 4, 2, 8);
            } else {
                // Arms up/out
                ctx.fillRect(x + 0, startY + 2, 2, 6);
                ctx.fillRect(x + 14, startY + 2, 2, 6);
            }
        }
    },

    drawSmallEntitySprites: function(ctx, startY, height) {
        for(let i = 0; i < 3; i++) {
            const x = i * 12;
            // Smaller body
            ctx.fillRect(x + 2, startY + 3, 8, height - 6);
            // Smaller head
            ctx.fillRect(x + 4, startY, 4, 4);
        }
    },

    drawItemSprites: function(ctx) {
        // Soda can (red)
        ctx.fillStyle = '#ff5555';
        ctx.fillRect(0, 192, 14, 12);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(1, 193, 12, 2);
        
        // Battery (yellow)
        ctx.fillStyle = '#ffff55';
        ctx.fillRect(16, 192, 10, 14);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(18, 194, 6, 10);
        
        // Duct tape (gray)
        ctx.fillStyle = '#888888';
        ctx.fillRect(32, 192, 14, 10);
        ctx.fillStyle = '#666666';
        ctx.fillRect(34, 194, 10, 6);
        
        // Scanner (black with screen)
        ctx.fillStyle = '#333333';
        ctx.fillRect(48, 192, 12, 14);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(50, 194, 8, 10);
        
        // Air horn (silver)
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(64, 192, 10, 14);
        
        // Cleaner (blue)
        ctx.fillStyle = '#5555ff';
        ctx.fillRect(80, 192, 12, 14);
        
        // Plush toy (brown)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(96, 192, 12, 12);
        
        // Jerky (dark red)
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(112, 192, 14, 6);
    },

    drawTileSprites: function(ctx) {
        // Floor tile (checkered)
        ctx.fillStyle = '#222244';
        ctx.fillRect(0, 208, 32, 32);
        ctx.fillStyle = '#333355';
        for(let i = 0; i < 4; i++) {
            for(let j = 0; j < 4; j++) {
                if((i + j) % 2 === 0) {
                    ctx.fillRect(i * 8, 208 + j * 8, 8, 8);
                }
            }
        }
        
        // Wall (beige)
        ctx.fillStyle = '#d4b483';
        ctx.fillRect(32, 208, 32, 32);
        ctx.fillStyle = '#c19a6b';
        ctx.fillRect(32, 208, 32, 4); // top trim
        ctx.fillRect(32, 236, 32, 4); // bottom trim
        
        // Register (gray with display)
        ctx.fillStyle = '#666666';
        ctx.fillRect(64, 208, 32, 32);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(68, 212, 24, 8); // screen
        
        // Shelf (brown)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(96, 208, 32, 64);
        ctx.fillStyle = '#a0522d';
        // Shelves
        ctx.fillRect(96, 216, 32, 4);
        ctx.fillRect(96, 232, 32, 4);
        ctx.fillRect(96, 248, 32, 4);
        
        // Freezer (white)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(128, 208, 32, 64);
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(128, 208, 32, 8); // top
        ctx.fillRect(128, 208, 4, 64); // side
        ctx.fillRect(156, 208, 4, 64); // side
        
        // Break table (brown)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(160, 208, 64, 32);
        ctx.fillStyle = '#a0522d';
        // Table legs
        ctx.fillRect(164, 232, 4, 8);
        ctx.fillRect(216, 232, 4, 8);
        
        // Door (wood)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(224, 208, 32, 32);
        ctx.fillStyle = '#a0522d';
        // Door details
        ctx.fillRect(228, 212, 4, 4); // window
        ctx.fillRect(236, 220, 8, 4); // handle
        
        // Window (glass)
        ctx.fillStyle = '#88aaff';
        ctx.fillRect(256, 208, 32, 32);
        ctx.fillStyle = '#aaccff';
        ctx.fillRect(256, 208, 32, 4); // frame
        ctx.fillRect(256, 236, 32, 4); // frame
        ctx.fillRect(256, 208, 4, 32); // frame
        ctx.fillRect(284, 208, 4, 32); // frame
    },

    drawEffectSprites: function(ctx) {
        // Blood stain (red splatter)
        ctx.fillStyle = '#8b0000';
        for(let i = 0; i < 4; i++) {
            const size = 2 + i * 2;
            ctx.beginPath();
            ctx.arc(8 + i*4, 280, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Broken glass (light blue shards)
        ctx.fillStyle = '#aaccff';
        for(let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(20 + i*6, 280);
            ctx.lineTo(24 + i*6, 284);
            ctx.lineTo(22 + i*6, 288);
            ctx.closePath();
            ctx.fill();
        }
    },

    // Draw a sprite at coordinates
    draw: function(ctx, sprite, x, y, frame = 0) {
        let spriteData;
        
        if (Array.isArray(sprite[0])) {
            // Animation frames
            spriteData = sprite[frame % sprite.length];
        } else {
            // Single sprite
            spriteData = sprite;
        }
        
        const [sx, sy, width, height] = spriteData;
        
        // Create offscreen sprite sheet if it doesn't exist
        if (!this.spriteSheet) {
            this.spriteSheet = this.generateSpriteSheet(ctx);
        }
        
        // Draw from sprite sheet
        ctx.drawImage(
            this.spriteSheet,
            sx, sy, width, height,
            x - width/2, y - height/2, width, height
        );
    }
};

window.Sprites = Sprites;
