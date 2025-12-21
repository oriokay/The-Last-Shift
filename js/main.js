// ==================== GAME STATE ====================
const GameState = {
    player: null,
    entities: [],
    items: [],
    time: 22.0, // 10:00 PM in decimal
    shiftEnd: 6.0, // 6:00 AM
    sanity: 100,
    storeIntegrity: 100,
    isFlashlightOn: true,
    gameOver: false,
    debugMode: true,
    keys: {}
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
        this.flashlightBattery = 100;
        this.lastSanityDrain = 0;
    }

    move() {
        let dx = 0, dy = 0;
        
        if (GameState.keys['w'] || GameState.keys['arrowup']) dy -= this.speed;
        if (GameState.keys['s'] || GameState.keys['arrowdown']) dy += this.speed;
        if (GameState.keys['a'] || GameState.keys['arrowleft']) dx -= this.speed;
        if (GameState.keys['d'] || GameState.keys['arrowright']) dx += this.speed;
        
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (newX > 0 && newX < 780) this.x = newX;
        if (newY > 0 && newY < 580) this.y = newY;
        
        if (GameState.isFlashlightOn && this.flashlightBattery > 0) {
            this.flashlightBattery -= 0.02;
            if (this.flashlightBattery < 0) {
                this.flashlightBattery = 0;
                GameState.isFlashlightOn = false;
            }
        }
    }

    updateSanity() {
        const now = Date.now();
        if (now - this.lastSanityDrain > 1000) {
            if (!GameState.isFlashlightOn && GameState.sanity > 0) {
                GameState.sanity -= 2;
                if (GameState.sanity < 0) GameState.sanity = 0;
            }
            this.lastSanityDrain = now;
        }
        
        if (GameState.sanity <= 0 && !GameState.gameOver) {
            GameState.gameOver = true;
            alert("GAME OVER: You've lost your mind.\n\nRefresh to try again.");
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
        this.state = 'wandering';
        this.vx = 0;
        this.vy = 0;
        
        if (!this.vx) {
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }
    }

    update(player) {
        if (this.type === 'gatherer') {
            this.updateGatherer(player);
        } else if (this.type === 'tapper') {
            this.updateTapper();
        }
    }

    updateGatherer(player) {
        if (Math.random() < 0.02) {
            this.speed = 0.5 + Math.random() * 1.5;
        }
        
        if (Math.random() < 0.05) {
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.x = Math.max(20, Math.min(780, this.x));
        this.y = Math.max(20, Math.min(580, this.y));
        
        const distToPlayer = Math.sqrt(
            Math.pow(this.x - player.x, 2) + 
            Math.pow(this.y - player.y, 2)
        );
        
        if (distToPlayer < 60 && this.state !== 'chasing') {
            this.state = 'chasing';
            this.speed = 2.5;
        }
        
        if (this.state === 'chasing' && distToPlayer > 30) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
    }

    updateTapper() {
        if (!this.vx || !this.vy) {
            this.vx = 0;
            this.vy = 0.5;
        }
        
        this.y += this.vy;
        
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
            
            this.vx *= 0.95;
            this.vy *= 0.95;
            
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
            if (Math.abs(this.vy) < 0.1) this.vy = 0;
        }
    }
}

// ==================== GAME FUNCTIONS ====================
function generateStore() {
    for (let i = 0; i < 10; i++) {
        GameState.items.push(new Item(
            Math.random() * 700 + 50,
            Math.random() * 500 + 50,
            ['soda', 'battery', 'tape'][Math.floor(Math.random() * 3)]
        ));
    }
    
    GameState.entities.push(new Entity(100, 100, 'gatherer'));
    GameState.entities.push(new Entity(700, 300, 'gatherer'));
    GameState.entities.push(new Entity(50, 200, 'tapper'));
    
    GameState.player = new Player(400, 300);
}

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
    
    const index = GameState.player.inventory.indexOf(item);
    if (index > -1) {
        GameState.player.inventory.splice(index, 1);
    }
}

// ==================== DRAWING FUNCTIONS ====================
function drawStore(ctx) {
    ctx.fillStyle = '#111133';
    ctx.fillRect(0, 0, 800, 600);
    
    ctx.strokeStyle = '#333366';
    ctx.lineWidth = 2;
    
    for (let x = 100; x < 800; x += 150) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
    }
    
    ctx.strokeStyle = '#5555ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 800, 600);
    
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
    
    ctx.fillStyle = GameState.sanity > 30 ? '#00aaff' : '#ff5500';
    ctx.fillRect(p.x - p.width/2, p.y - p.height/2, p.width, p.height);
    
    ctx.fillStyle = '#ffffff';
    const faceOffset = 5;
    ctx.fillRect(p.x + faceOffset - p.width/2, p.y - 3, 4, 6);
    
    if (GameState.isFlashlightOn) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
}

function drawEntities(ctx) {
    for (const entity of GameState.entities) {
        ctx.fillStyle = entity.type === 'gatherer' 
            ? (entity.state === 'chasing' ? '#ff0000' : '#880088')
            : '#008888';
        
        ctx.fillRect(entity.x - entity.width/2, entity.y - entity.height/2, entity.width, entity.height);
        
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
        
        ctx.shadowColor = props.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(item.x - item.width/2, item.y - item.height/2, item.width, item.height);
        ctx.shadowBlur = 0;
    }
}

function drawFlashlight(ctx) {
    if (!GameState.isFlashlightOn || !GameState.player) return;
    
    const p = GameState.player;
    const alpha = GameState.player.flashlightBattery / 100;
    
    const gradient = ctx.createRadialGradient(
        p.x, p.y, 10,
        p.x, p.y, 150
    );
    
    gradient.addColorStop(0, `rgba(255, 255, 200, ${0.3 * alpha})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 150, ${0.1 * alpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, 150, -Math.PI/4, Math.PI/4);
    ctx.closePath();
    ctx.fill();
}

// ==================== UI FUNCTIONS ====================
function updateUI() {
    const sanityBar = document.getElementById('sanityBar');
    const storeBar = document.getElementById('storeBar');
    const timeDisplay = document.getElementById('timeDisplay');
    
    if (sanityBar) {
        sanityBar.style.width = GameState.sanity + '%';
        sanityBar.style.background = 
            GameState.sanity > 50 ? '#0f0' : 
            GameState.sanity > 20 ? '#ff0' : '#f00';
    }
    
    if (storeBar) {
        storeBar.style.width = GameState.storeIntegrity + '%';
        storeBar.style.background = 
            GameState.storeIntegrity > 60 ? '#0f0' : 
            GameState.storeIntegrity > 30 ? '#ff0' : '#f00';
    }
    
    if (timeDisplay) {
        const hours = Math.floor(GameState.time);
        const minutes = Math.floor((GameState.time - hours) * 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours > 12 ? hours - 12 : hours;
        timeDisplay.textContent = 
            `SHIFT: ${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
}

function updateDebug(text) {
    const debug = document.getElementById('debug');
    if (debug) {
        debug.textContent = `DEBUG: ${text}`;
    }
}

// ==================== INPUT HANDLING ====================
window.addEventListener('keydown', (e) => {
    GameState.keys[e.key.toLowerCase()] = true;
    
    switch(e.key.toLowerCase()) {
        case 'f':
            GameState.isFlashlightOn = !GameState.isFlashlightOn && GameState.player.flashlightBattery > 0;
            break;
            
        case ' ':
            if (!GameState.player) return;
            
            let nearestItem = null;
            let nearestDist = 50;
            
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
                useItem(nearestItem);
            }
            break;
            
        case 'l':
            if (GameState.storeIntegrity < 100) {
                GameState.storeIntegrity = Math.min(100, GameState.storeIntegrity + 5);
                updateDebug("Door secured. Store integrity +5%");
            }
            break;
            
        case 'r':
            document.location.reload();
            break;
    }
});

window.addEventListener('keyup', (e) => {
    GameState.keys[e.key.toLowerCase()] = false;
});

// ==================== GAME LOOP ====================
function gameLoop() {
    if (GameState.gameOver) return;
    
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    GameState.time += 0.001;
    if (GameState.time >= 24) GameState.time = 0;
    
    updateUI();
    
    if (GameState.player) {
        GameState.player.move();
        GameState.player.updateSanity();
        
        if (Math.random() < 0.005 && GameState.storeIntegrity > 0) {
            GameState.storeIntegrity -= 1;
        }
    }
    
    for (const entity of GameState.entities) {
        if (GameState.player) entity.update(GameState.player);
    }
    
    for (const item of GameState.items) {
        item.update();
    }
    
    drawStore(ctx);
    drawItems(ctx);
    drawEntities(ctx);
    if (GameState.player) drawPlayer(ctx);
    drawFlashlight(ctx);
    
    if (GameState.time >= GameState.shiftEnd && GameState.time < 6.1) {
        GameState.gameOver = true;
        alert("SHIFT COMPLETE!\n\nYou survived the night!\n\nFinal stats:\nSanity: " + 
              Math.floor(GameState.sanity) + "%\nStore: " + 
              Math.floor(GameState.storeIntegrity) + "%");
    }
    
    requestAnimationFrame(gameLoop);
}

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
    console.log("The Last Shift - Initializing...");
    
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
    
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    
    generateStore();
    updateDebug("Game started! Collect items (SPACE), use flashlight (F)");
    
    gameLoop();
    console.log("Game loop started successfully!");
});
