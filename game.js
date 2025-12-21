// ==================== GAME STATE ====================
const GameState = {
    player: null,
    entities: [],
    items: [],
    time: 22.0, // 10:00 PM in decimal (22.0 = 10:00 PM)
    shiftEnd: 6.0, // 6:00 AM
    sanity: 100,
    storeIntegrity: 100,
    isFlashlightOn: true,
    gameOver: false,
    debugMode: true
};

// ==================== PLAYER CLASS ====================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 3;
        this.inventory = [];
        this.selectedItem = 0;
        this.flashlightBattery = 100;
        this.lastSanityDrain = 0;
    }

    move(keys) {
        let dx = 0, dy = 0;
        
        if (keys['w'] || keys['ArrowUp']) dy -= this.speed;
        if (keys['s'] || keys['ArrowDown']) dy += this.speed;
        if (keys['a'] || keys['ArrowLeft']) dx -= this.speed;
        if (keys['d'] || keys['ArrowRight']) dx += this.speed;
        
        // Simple collision with walls (store boundaries)
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (newX > 0 && newX < 780) this.x = newX;
        if (newY > 0 && newY < 580) this.y = newY;
        
        // Drain flashlight battery
        if (GameState.isFlashlightOn && this.flashlightBattery > 0) {
            this.flashlightBattery -= 0.02;
            if (this.flashlightBattery < 0) {
                this.flashlightBattery = 0;
                GameState.isFlashlightOn = false;
            }
        }
    }

    updateSanity() {
        // Drain sanity if in dark areas
        const now = Date.now();
        if (now - this.lastSanityDrain > 1000) { // Every second
            if (!GameState.isFlashlightOn && GameState.sanity > 0) {
                GameState.sanity -= 2;
                if (GameState.sanity < 0) GameState.sanity = 0;
            }
            this.lastSanityDrain = now;
        }
        
        // Game over if sanity reaches 0
        if (GameState.sanity <= 0 && !GameState.gameOver) {
            GameState.gameOver = true;
            alert("GAME OVER: You've lost your mind. The store consumes you.\n\nRefresh to try again.");
        }
    }
}

// ==================== ENTITY CLASSES ====================
class Entity {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.speed = 1;
        this.state = 'wandering'; // wandering, chasing, shopping
        this.targetItem = null;
        this.basket = [];
    }

    update(player) {
        switch(this.type) {
            case 'gatherer':
                this.updateGatherer(player);
                break;
            case 'tapper':
                this.updateTapper(player);
                break;
        }
    }

    updateGatherer(player) {
        // Simple wandering AI
        if (Math.random() < 0.02) {
            this.speed = 0.5 + Math.random() * 1.5;
        }
        
        // Occasionally change direction
        if (Math.random() < 0.05) {
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }
        
        // Move
        if (this.vx && this.vy) {
            this.x += this.vx;
            this.y += this.vy;
            
            // Boundary check
            this.x = Math.max(20, Math.min(780, this.x));
            this.y = Math.max(20, Math.min(580, this.y));
        }
        
        // Check distance to player
        const distToPlayer = Math.sqrt(
            Math.pow(this.x - player.x, 2) + 
            Math.pow(this.y - player.y, 2)
        );
        
        // Become aggressive if too close to player
        if (distToPlayer < 60 && this.state !== 'chasing') {
            this.state = 'chasing';
            this.speed = 2.5;
        }
        
        // Chase player if aggressive
        if (this.state === 'chasing' && distToPlayer > 30) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
    }

    updateTapper(player) {
        // Tappers stay near windows (edges)
        if (!this.vx || !this.vy) {
            this.vx = 0;
            this.vy = 0.5;
        }
        
        this.y += this.vy;
        
        // Bounce at edges
        if (this.y < 50 || this.y > 550) {
            this.vy *= -1;
        }
    }
}

// ==================== ITEM CLASS ====================
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 10;
        this.height = 10;
        this.collected = false;
        this.vx = 0;
        this.vy = 0;
        
        // Define item properties
        this.properties = {
            'soda': { color: '#ff5555', name: 'Sparkle-Cola', sanityRestore: 30 },
            'battery': { color: '#ffff55', name: 'Battery', flashlightRestore: 50 },
            'tape': { color: '#888888', name: 'Duct Tape', storeRepair: 10 }
        };
    }

    update() {
        if (this.vx !== 0 || this.vy !== 0) {
            this.x += this.vx;
            this.y += this.vy;
            
            // Slow down
            this.vx *= 0.95;
            this.vy *= 0.95;
            
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
            if (Math.abs(this.vy) < 0.1) this.vy = 0;
        }
    }
}

// ==================== STORE GENERATION ====================
function generateStore() {
    // Create items
    for (let i = 0; i < 15; i++) {
        GameState.items.push(new Item(
            Math.random() * 700 + 50,
            Math.random() * 500 + 50,
            ['soda', 'battery', 'tape'][Math.floor(Math.random() * 3)]
        ));
    }
    
    // Create entities
    GameState.entities.push(new Entity(100, 100, 'gatherer'));
    GameState.entities.push(new Entity(700, 300, 'gatherer'));
    GameState.entities.push(new Entity(50, 200, 'tapper'));
    
    // Initialize player
    GameState.player = new Player(400, 300);
}

// ==================== INPUT HANDLING ====================
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Handle specific keys
    switch(e.key.toLowerCase()) {
        case 'f':
            GameState.isFlashlightOn = !GameState.isFlashlightOn && GameState.player.flashlightBattery > 0;
            break;
            
        case ' ':
            // Pick up nearest item
            let nearestItem = null;
            let nearestDist = 50; // Pickup radius
            
            for (const item of GameState.items) {
                if (item.collected) continue;
                
                const dist = Math.sqrt(
                    Math.pow(item.x - GameState.player.x, 2) + 
                    Math.pow(item.y - GameState.player.y, 2)
                );
                
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestItem = item;
                }
            }
            
            if (nearestItem) {
                nearestItem.collected = true;
                GameState.player.inventory.push(nearestItem);
                updateDebug(`Picked up: ${nearestItem.properties[nearestItem.type].name}`);
                
                // Use item immediately for simplicity
                useItem(nearestItem);
            }
            break;
            
        case 'l':
            // "Lock" doors - repair store integrity slightly
            if (GameState.storeIntegrity < 100) {
                GameState.storeIntegrity = Math.min(100, GameState.storeIntegrity + 5);
                updateDebug("Door secured. Store integrity +5%");
            }
            break;
            
        case 'r':
            // Reset game (for debugging)
            if (GameState.debugMode) {
                document.location.reload();
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ==================== ITEM USAGE ====================
function useItem(item) {
    const props = item.properties[item.type];
    
    switch(item.type) {
        case 'soda':
            GameState.sanity = Math.min(100, GameState.sanity + props.sanityRestore);
            updateDebug(`Drank ${props.name}. Sanity +${props.sanityRestore}%`);
            break;
            
        case 'battery':
            GameState.player.flashlightBattery = Math.min(100, GameState.player.flashlightBattery + props.flashlightRestore);
            updateDebug(`Installed ${props.name}. Flashlight +${props.flashlightRestore}%`);
            break;
            
        case 'tape':
            GameState.storeIntegrity = Math.min(100, GameState.storeIntegrity + props.storeRepair);
            updateDebug(`Used ${props.name}. Store +${props.storeRepair}%`);
            break;
    }
    
    // Remove from inventory
    const index = GameState.player.inventory.indexOf(item);
    if (index > -1) {
        GameState.player.inventory.splice(index, 1);
    }
}

// ==================== GAME LOOP ====================
function gameLoop() {
    if (GameState.gameOver) return;
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update game time
    GameState.time += 0.001; // Fast-forward for demo
    if (GameState.time >= 24) GameState.time = 0;
    
    // Update UI
    updateUI();
    
    // Update player
    if (GameState.player) {
        GameState.player.move(keys);
        GameState.player.updateSanity();
        
        // Random store integrity drain
        if (Math.random() < 0.005 && GameState.storeIntegrity > 0) {
            GameState.storeIntegrity -= 1;
        }
    }
    
    // Update entities
    for (const entity of GameState.entities) {
        if (GameState.player) entity.update(GameState.player);
    }
    
    // Update items
    for (const item of GameState.items) {
        item.update();
    }
    
    // Draw everything
    drawStore(ctx);
    drawItems(ctx);
    drawEntities(ctx);
    if (GameState.player) drawPlayer(ctx);
    drawFlashlight(ctx);
    
    // Check win condition
    if (GameState.time >= GameState.shiftEnd && GameState.time < 6.1) {
        GameState.gameOver = true;
        alert("SHIFT COMPLETE!\n\nYou survived the night. The fog lifts... for now.\n\nYour final stats:\nSanity: " + 
              Math.floor(GameState.sanity) + "%\nStore Integrity: " + 
              Math.floor(GameState.storeIntegrity) + "%\n\nRefresh to work another shift.");
    }
    
    requestAnimationFrame(gameLoop);
}

// ==================== DRAWING FUNCTIONS ====================
function drawStore(ctx) {
    // Draw floor
    ctx.fillStyle = '#222244';
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw grid lines (store aisles)
    ctx.strokeStyle = '#333366';
    ctx.lineWidth = 2;
    
    for (let x = 100; x < 800; x += 150) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
    }
    
    // Draw windows (edges)
    ctx.strokeStyle = '#5555ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 800, 600);
    
    // Draw store integrity cracks
    if (GameState.storeIntegrity < 50) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const length = 20 + Math.random() * 30;
            const angle = Math.random() * Math.PI * 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }
    }
}

function drawPlayer(ctx) {
    const p = GameState.player;
    
    // Player body
    ctx.fillStyle = GameState.sanity > 30 ? '#00aaff' : '#ff5500';
    ctx.fillRect(p.x - p.width/2, p.y - p.height/2, p.width, p.height);
    
    // Player face (indicates direction)
    ctx.fillStyle = '#ffffff';
    const faceOffset = 5;
    ctx.fillRect(p.x + faceOffset - p.width/2, p.y - 3, 4, 6);
    
    // Flashlight indicator
    if (GameState.isFlashlightOn) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
}

function drawEntities(ctx) {
    for (const entity of GameState.entities) {
        switch(entity.type) {
            case 'gatherer':
                ctx.fillStyle = entity.state === 'chasing' ? '#ff0000' : '#880088';
                break;
            case 'tapper':
                ctx.fillStyle = '#008888';
                break;
        }
        
        ctx.fillRect(entity.x - entity.width/2, entity.y - entity.height/2, entity.width, entity.height);
        
        // Draw basket for gatherers
        if (entity.type === 'gatherer') {
            ctx.fillStyle = '#886600';
            ctx.fillRect(entity.x + 10, entity.y - 5, 8, 10);
        }
    }
}

function drawItems(ctx) {
    for (const item of GameState.items) {
        if (item.collected) continue;
        
        const props = item.properties[item.type];
        ctx.fillStyle = props.color;
        ctx.fillRect(item.x - item.width/2, item.y - item.height/2, item.width, item.height);
        
        // Draw a slight glow
        ctx.shadowColor = props.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(item.x - item.width/2, item.y - item.height/2, item.width, item.height);
        ctx.shadowBlur = 0;
    }
}

function drawFlashlight(ctx) {
    if (!GameState.isFlashlightOn || !GameState.player) return;
    
    const p = GameState.player;
    
    // Create flashlight cone (gradient)
    const gradient = ctx.createRadialGradient(
        p.x, p.y, 10,
        p.x, p.y, 150
    );
    
    // Adjust based on battery
    const alpha = GameState.player.flashlightBattery / 100;
    gradient.addColorStop(0, `rgba(255, 255, 200, ${0.3 * alpha})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 150, ${0.1 * alpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    // Simple cone facing right (for demo)
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, 150, -Math.PI/4, Math.PI/4);
    ctx.closePath();
    ctx.fill();
}

// ==================== UI FUNCTIONS ====================
function updateUI() {
    // Update sanity bar
    document.getElementById('sanityBar').style.width = GameState.sanity + '%';
    document.getElementById('sanityBar').style.background = 
        GameState.sanity > 50 ? '#0f0' : 
        GameState.sanity > 20 ? '#ff0' : '#f00';
    
    // Update store integrity bar
    document.getElementById('storeBar').style.width = GameState.storeIntegrity + '%';
    document.getElementById('storeBar').style.background = 
        GameState.storeIntegrity > 60 ? '#0f0' : 
        GameState.storeIntegrity > 30 ? '#ff0' : '#f00';
    
    // Update time display
    const hours = Math.floor(GameState.time);
    const minutes = Math.floor((GameState.time - hours) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours;
    document.getElementById('timeDisplay').textContent = 
        `SHIFT: ${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    // Update debug info
    if (GameState.debugMode) {
        const p = GameState.player;
        updateDebug(
            `Pos: (${Math.floor(p.x)}, ${Math.floor(p.y)}) | ` +
            `Battery: ${Math.floor(p.flashlightBattery)}% | ` +
            `Inventory: ${p.inventory.length} items | ` +
            `Entities: ${GameState.entities.length}`
        );
    }
}

function updateDebug(text) {
    document.getElementById('debug').textContent = `DEBUG: ${text}`;
}

// ==================== INITIALIZATION ====================
window.onload = function() {
    generateStore();
    updateDebug("Game started! Collect items (SPACE), use flashlight (F), secure doors (L)");
    gameLoop();
};
