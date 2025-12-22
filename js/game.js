// Core Game Engine for "The Last Shift"
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game state
        this.state = {
            running: true,
            time: 22.0, // 10:00 PM
            shiftEnd: 6.0,
            sanity: 100,
            storeIntegrity: 100,
            companyScript: 0,
            currentNight: 1,
            objectives: [],
            completedObjectives: 0,
            gameOver: false,
            win: false
        };
        
        // Systems
        this.player = null;
        this.entities = [];
        this.items = [];
        this.tools = [];
        this.activeEffects = [];
        this.paMessages = [];
        this.directives = [];
        
        // Lighting
        this.lighting = {
            ambient: 0.1,
            emergencyLights: [],
            flickeringLights: [],
            flashlight: null
        };
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        // Map
        this.map = null;
        this.rooms = {
            mainStore: null,
            backRooms: null,
            breakRoom: null,
            freezer: null,
            office: null
        };
        
        // Audio
        this.audio = {
            muted: false,
            volume: 0.5
        };
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log("Initializing Mega-Mart...");
        
        // Generate map
        this.generateMap();
        
        // Initialize player
        this.player = new Player(400, 300, this);
        
        // Initialize lighting
        this.initLighting();
        
        // Initialize entities
        this.spawnInitialEntities();
        
        // Initialize items
        this.spawnInitialItems();
        
        // Initialize tools
        this.initTools();
        
        // Generate first directives
        this.generateDirectives();
        
        // Setup PA system
        this.paSystem = new PASystem(this);
        
        // Setup input
        this.setupInput();
        
        // Start game loop
        this.gameLoop();
        
        // Initial PA message
        setTimeout(() => {
            this.paSystem.announce("Welcome to Mega-Mart. Have a productive shift.");
        }, 1000);
    }
    
    generateMap() {
        this.map = new MegaMartMap();
        this.rooms = this.map.generateLayout();
    }
    
    initLighting() {
        // Emergency lights (red, flickering)
        for(let i = 0; i < 8; i++) {
            this.lighting.emergencyLights.push({
                x: 100 + i * 75,
                y: 50,
                radius: 60,
                color: '#ff0000',
                intensity: 0.3,
                flicker: true
            });
        }
        
        // Store lighting (white, some flickering)
        for(let x = 100; x < 700; x += 150) {
            for(let y = 100; y < 500; y += 150) {
                this.lighting.flickeringLights.push({
                    x, y,
                    radius: 100,
                    color: '#ffffaa',
                    intensity: 0.4,
                    flicker: Math.random() > 0.7
                });
            }
        }
        
        // Flashlight (attached to player)
        this.lighting.flashlight = {
            x: 0, y: 0,
            radius: 150,
            color: '#ffff99',
            intensity: 0.6,
            angle: 0,
            width: Math.PI / 3
        };
    }
    
    spawnInitialEntities() {
        // Gatherers
        for(let i = 0; i < 2; i++) {
            this.entities.push(new Gatherer(
                200 + i * 150,
                200 + i * 100,
                this
            ));
        }
        
        // Tappers (outside windows)
        for(let i = 0; i < 3; i++) {
            this.entities.push(new Tapper(
                50 + i * 250,
                50,
                this
            ));
        }
        
        // Lost Child (hidden)
        this.entities.push(new LostChild(700, 500, this));
    }
    
    spawnInitialItems() {
        // Random items throughout store
        const itemTypes = ['soda', 'battery', 'tape', 'scanner', 'airhorn', 'cleaner', 'jerky'];
        
        for(let i = 0; i < 20; i++) {
            const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            this.items.push(new Item(
                Math.random() * 700 + 50,
                Math.random() * 500 + 50,
                type,
                this
            ));
        }
        
        // Plush toy for lost child
        this.items.push(new Item(750, 520, 'plush', this));
    }
    
    initTools() {
        this.tools = [
            { type: 'scanner', name: 'Price Scanner', equipped: true },
            { type: 'flashlight', name: 'Flashlight', equipped: true },
            { type: 'airhorn', name: 'Air Horn', equipped: false },
            { type: 'cleaner', name: 'Spray Cleaner', equipped: false },
            { type: 'tape', name: 'Duct Tape', equipped: false }
        ];
        this.currentTool = 0;
    }
    
    generateDirectives() {
        const directives = [
            "Stock all end-caps with Sparkle-Cola",
            "Perform a floor buffer demonstration in Appliances by 3 AM",
            "Maximize customer satisfaction ratings",
            "Clean all spills in Aisle 7",
            "Restock freezer section",
            "Complete inventory count in Storage",
            "Test all emergency lighting",
            "File nightly report in Manager's Office"
        ];
        
        // Pick 2-3 random directives for this shift
        const count = 2 + Math.floor(Math.random() * 2);
        for(let i = 0; i < count; i++) {
            const directive = directives[Math.floor(Math.random() * directives.length)];
            if (!this.directives.includes(directive)) {
                this.directives.push(directive);
            }
        }
        
        // Update UI
        this.updateObjectiveDisplay();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Handle tool switching
            if (key === 'q') {
                this.currentTool = (this.currentTool - 1 + this.tools.length) % this.tools.length;
                this.showMessage(`Selected: ${this.tools[this.currentTool].name}`);
            }
            if (key === 'e') {
                this.currentTool = (this.currentTool + 1) % this.tools.length;
                this.showMessage(`Selected: ${this.tools[this.currentTool].name}`);
            }
            
            // Handle tool use
            if (key === 'r') {
                this.useCurrentTool();
            }
            
            // PA system
            if (key === 'p') {
                this.paSystem.makeAnnouncement();
            }
            
            // Clean action
            if (key === 'c') {
                this.cleanArea();
            }
            
            // Barricade
            if (key === 'l') {
                this.barricade();
            }
            
            // Map/Objectives
            if (key === 'm') {
                this.showObjectives();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
    }
    
    update(deltaTime) {
        if (this.state.gameOver || this.state.win) return;
        
        // Update time
        this.state.time += deltaTime * 0.01; // Scale time progression
        if (this.state.time >= 24) this.state.time = 0;
        
        // Check shift end
        if (this.state.time >= this.state.shiftEnd && this.state.time < this.state.shiftEnd + 0.1) {
            this.completeShift();
        }
        
        // Update player
        if (this.player) {
            this.player.update(deltaTime, this.keys);
            
            // Update flashlight position
            if (this.lighting.flashlight) {
                this.lighting.flashlight.x = this.player.x;
                this.lighting.flashlight.y = this.player.y;
                this.lighting.flashlight.angle = this.player.direction;
            }
            
            // Update sanity based on conditions
            this.updateSanity(deltaTime);
        }
        
        // Update entities
        for (const entity of this.entities) {
            if (entity.active) {
                entity.update(deltaTime);
                
                // Check interactions with player
                if (this.player && entity.checkPlayerProximity(this.player)) {
                    entity.interactWithPlayer(this.player);
                }
            }
        }
        
        // Update items
        for (const item of this.items) {
            item.update(deltaTime);
        }
        
        // Update effects
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.update(deltaTime);
            return effect.active;
        });
        
        // Update store integrity
        this.updateStoreIntegrity(deltaTime);
        
        // Check for auditor spawn
        this.checkAuditorSpawn();
        
        // Update PA system
        this.paSystem.update(deltaTime);
        
        // Check for entity spawns based on time
        this.checkTimeBasedEvents();
    }
    
    updateSanity(deltaTime) {
        let sanityDrain = 0;
        
        // Drain in darkness
        if (!this.player.flashlightOn && this.lighting.ambient < 0.3) {
            sanityDrain += 0.5 * deltaTime;
        }
        
        // Drain when near entities
        for (const entity of this.entities) {
            if (entity.active) {
                const dist = Math.sqrt(
                    Math.pow(entity.x - this.player.x, 2) +
                    Math.pow(entity.y - this.player.y, 2)
                );
                if (dist < 100) {
                    sanityDrain += (0.3 * (100 - dist) / 100) * deltaTime;
                }
            }
        }
        
        // Drain from low store integrity
        if (this.state.storeIntegrity < 50) {
            sanityDrain += (0.2 * (50 - this.state.storeIntegrity) / 50) * deltaTime;
        }
        
        // Apply drain
        this.state.sanity = Math.max(0, this.state.sanity - sanityDrain);
        
        // Check sanity effects
        if (this.state.sanity < 30 && Math.random() < 0.01) {
            this.triggerSanityEffect();
        }
        
        // Game over if sanity reaches 0
        if (this.state.sanity <= 0 && !this.state.gameOver) {
            this.gameOver("You've lost your mind. The store consumes you.");
        }
    }
    
    updateStoreIntegrity(deltaTime) {
        let integrityDrain = 0;
        
        // Drain from broken windows
        const brokenWindows = this.entities.filter(e => 
            e.type === 'tapper' && e.state === 'breaking'
        ).length;
        integrityDrain += brokenWindows * 0.1 * deltaTime;
        
        // Drain from entity damage
        for (const entity of this.entities) {
            if (entity.state === 'aggressive' && entity.damagingStore) {
                integrityDrain += 0.05 * deltaTime;
            }
        }
        
        // Apply drain
        this.state.storeIntegrity = Math.max(0, this.state.storeIntegrity - integrityDrain);
        
        // Effects of low integrity
        if (this.state.storeIntegrity < 30) {
            // More entities spawn
            if (Math.random() < 0.001) {
                this.spawnAdditionalEntity();
            }
            
            // Lights flicker more
            this.lighting.ambient = 0.05 + Math.random() * 0.1;
        }
        
        // Game over if store integrity reaches 0
        if (this.state.storeIntegrity <= 0 && !this.state.gameOver) {
            this.gameOver("The store has been destroyed. Corporate termination initiated.");
        }
    }
    
    triggerSanityEffect() {
        const effects = [
            { type: 'hallucination', duration: 3000 },
            { type: 'distortion', duration: 5000 },
            { type: 'whispers', duration: 4000 }
        ];
        
        const effect = effects[Math.floor(Math.random() * effects.length)];
        this.activeEffects.push(new SanityEffect(
            this.player.x,
            this.player.y,
            effect.type,
            effect.duration
        ));
        
        // Random PA message during sanity effects
        const messages = [
            "Employee, are you feeling alright?",
            "Please report to the break room for assessment.",
            "Customer satisfaction is dropping...",
            "The fog is getting thicker, isn't it?",
            "They're watching. Always watching."
        ];
        
        this.paSystem.announce(messages[Math.floor(Math.random() * messages.length)]);
    }
    
    useCurrentTool() {
        const tool = this.tools[this.currentTool];
        
        switch(tool.type) {
            case 'scanner':
                this.useScanner();
                break;
            case 'flashlight':
                this.player.toggleFlashlight();
                break;
            case 'airhorn':
                this.useAirHorn();
                break;
            case 'cleaner':
                this.useCleaner();
                break;
            case 'tape':
                this.useTape();
                break;
        }
    }
    
    useScanner() {
        // Find nearest entity or item
        let nearest = null;
        let nearestDist = Infinity;
        let type = '';
        
        // Check entities
        for (const entity of this.entities) {
            if (entity.active) {
                const dist = Math.sqrt(
                    Math.pow(entity.x - this.player.x, 2) +
                    Math.pow(entity.y - this.player.y, 2)
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = entity;
                    type = 'entity';
                }
            }
        }
        
        // Check items
        for (const item of this.items) {
            if (!item.collected) {
                const dist = Math.sqrt(
                    Math.pow(item.x - this.player.x, 2) +
                    Math.pow(item.y - this.player.y, 2)
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = item;
                    type = 'item';
                }
            }
        }
        
        if (nearest) {
            const direction = nearestDist < 200 ? 
                (nearestDist < 100 ? 'CLOSE' : 'NEARBY') : 'FAR';
            this.showMessage(`Scanner: ${type.toUpperCase()} ${direction} (${Math.floor(nearestDist)}m)`);
        }
    }
    
    useAirHorn() {
        if (!this.player.hasItem('airhorn')) {
            this.showMessage("No Air Horn in inventory!");
            return;
        }
        
        // Stun nearby entities
        for (const entity of this.entities) {
            const dist = Math.sqrt(
                Math.pow(entity.x - this.player.x, 2) +
                Math.pow(entity.y - this.player.y, 2)
            );
            if (dist < 150) {
                entity.stun(3000); // 3 second stun
            }
        }
        
        // Attract distant entities
        this.attractDistantEntities();
        
        // Use up the air horn
        this.player.useItem('airhorn');
        
        this.showMessage("AIR HORN BLAST! Entities stunned.");
    }
    
    useCleaner() {
        if (!this.player.hasItem('cleaner')) {
            this.showMessage("No Spray Cleaner in inventory!");
            return;
        }
        
        // Blind entities in front of player
        const angle = this.player.direction;
        const range = 100;
        
        for (const entity of this.entities) {
            const dist = Math.sqrt(
                Math.pow(entity.x - this.player.x, 2) +
                Math.pow(entity.y - this.player.y, 2)
            );
            
            if (dist < range) {
                const entityAngle = Math.atan2(
                    entity.y - this.player.y,
                    entity.x - this.player.x
                );
                
                // Check if entity is in cone in front of player
                if (Math.abs(entityAngle - angle) < Math.PI / 4) {
                    entity.blind(2000); // 2 second blind
                }
            }
        }
        
        // Clean blood stains
        this.cleanArea();
        
        // Use up the cleaner
        this.player.useItem('cleaner');
        
        this.showMessage("Spray Cleaner used! Entities blinded.");
    }
    
    useTape() {
        if (!this.player.hasItem('tape')) {
            this.showMessage("No Duct Tape in inventory!");
            return;
        }
        
        // Repair store integrity
        this.state.storeIntegrity = Math.min(100, this.state.storeIntegrity + 15);
        
        // Fix nearest window
        for (const entity of this.entities) {
            if (entity.type === 'tapper' && entity.state === 'breaking') {
                entity.repairWindow();
                break;
            }
        }
        
        // Use up the tape
        this.player.useItem('tape');
        
        this.showMessage("Duct Tape applied! Store integrity +15%");
    }
    
    cleanArea() {
        const cleanRadius = 50;
        let cleaned = 0;
        
        // Clean blood stains (simplified - just increase sanity)
        this.state.sanity = Math.min(100, this.state.sanity + 5);
        cleaned++;
        
        // Attract nearby gatherers (they like clean areas)
        for (const entity of this.entities) {
            if (entity.type === 'gatherer') {
                const dist = Math.sqrt(
                    Math.pow(entity.x - this.player.x, 2) +
                    Math.pow(entity.y - this.player.y, 2)
                );
                if (dist < 200) {
                    entity.moveToward(this.player.x, this.player.y);
                }
            }
        }
        
        if (cleaned > 0) {
            this.showMessage("Area cleaned! Sanity +5%");
        }
    }
    
    barricade() {
        if (!this.player.hasItem('tape') && !this.player.hasItem('scanner')) {
            this.showMessage("Need materials to barricade!");
            return;
        }
        
        // Check if near a door or window
        let canBarricade = false;
        
        // Simplified barricade logic
        for (const entity of this.entities) {
            if (entity.type === 'tapper') {
                const dist = Math.sqrt(
                    Math.pow(entity.x - this.player.x, 2) +
                    Math.pow(entity.y - this.player.y, 2)
                );
                if (dist < 50) {
                    canBarricade = true;
                    entity.repairWindow();
                    break;
                }
            }
        }
        
        if (canBarricade) {
            this.state.storeIntegrity = Math.min(100, this.state.storeIntegrity + 10);
            this.showMessage("Barricade created! Store integrity +10%");
            
            // Use materials
            if (this.player.hasItem('tape')) {
                this.player.useItem('tape');
            }
        } else {
            this.showMessage("No doors/windows nearby to barricade");
        }
    }
    
    attractDistantEntities() {
        // Attract entities from further away
        for (const entity of this.entities) {
            const dist = Math.sqrt(
                Math.pow(entity.x - this.player.x, 2) +
                Math.pow(entity.y - this.player.y, 2)
            );
            if (dist < 400 && dist > 150) {
                entity.moveToward(this.player.x, this.player.y);
            }
        }
    }
    
    checkAuditorSpawn() {
        // Auditor spawns randomly or when store integrity is low
        const hasAuditor = this.entities.some(e => e.type === 'auditor');
        
        if (!hasAuditor) {
            const spawnChance = this.state.storeIntegrity < 40 ? 0.002 : 0.0005;
            
            if (Math.random() < spawnChance) {
                this.spawnAuditor();
            }
        }
    }
    
    spawnAuditor() {
        const auditor = new Auditor(50, 50, this);
        this.entities.push(auditor);
        
        this.paSystem.announce("Corporate Audit initiated. Please maintain standards.");
        this.showMessage("WARNING: Corporate Auditor has arrived!");
    }
    
    checkTimeBasedEvents() {
        const hour = Math.floor(this.state.time);
        
        // Midnight event
        if (hour === 0 && this.state.time % 1 < 0.01) {
            this.paSystem.announce("Midnight. Fog density increasing.");
            // Increase difficulty
            this.spawnAdditionalEntity();
        }
        
        // 3 AM - "Witching hour" event
        if (hour === 3 && this.state.time % 1 < 0.01) {
            this.paSystem.announce("Critical anomaly detected. All employees maintain positions.");
            this.triggerSanityEffect();
            this.state.sanity = Math.max(10, this.state.sanity - 20);
        }
    }
    
    spawnAdditionalEntity() {
        const types = ['gatherer', 'tapper'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let x, y;
        
        if (type === 'tapper') {
            // Spawn at window
            x = Math.random() > 0.5 ? 50 : 750;
            y = Math.random() * 500 + 50;
        } else {
            // Spawn inside store
            x = Math.random() * 700 + 50;
            y = Math.random() * 500 + 50;
        }
        
        if (type === 'gatherer') {
            this.entities.push(new Gatherer(x, y, this));
        } else {
            this.entities.push(new Tapper(x, y, this));
        }
        
        this.paSystem.announce("New customer detected. Please provide assistance.");
    }
    
    completeShift() {
        this.state.win = true;
        this.state.running = false;
        
        // Calculate score
        const sanityBonus = Math.floor(this.state.sanity);
        const integrityBonus = Math.floor(this.state.storeIntegrity);
        const objectiveBonus = this.completedObjectives * 50;
        const timeBonus = Math.floor((this.state.shiftEnd - 22) * 100); // 8-hour shift
        
        const totalScore = sanityBonus + integrityBonus + objectiveBonus + timeBonus;
        
        // Award company script
        this.state.companyScript += Math.floor(totalScore / 10);
        
        // Show win screen
        const message = `
            SHIFT COMPLETE!
            
            FINAL STATS:
            Sanity: ${sanityBonus}%
            Store Integrity: ${integrityBonus}%
            Objectives: ${this.completedObjectives}/3
            Time Bonus: ${timeBonus}
            
            TOTAL SCORE: ${totalScore}
            Company Script Earned: ${Math.floor(totalScore / 10)}
            
            Congratulations, employee.
            The fog lifts... for now.
            
            Press R to work another shift.
        `;
        
        alert(message);
    }
    
    gameOver(reason) {
        this.state.gameOver = true;
        this.state.running = false;
        
        const message = `
            GAME OVER
            
            ${reason}
            
            FINAL STATS:
            Shift: #${this.state.currentNight}
            Time Survived: ${Math.floor((this.state.time - 22 + 24) % 24)} hours
            Sanity: ${Math.floor(this.state.sanity)}%
            Store Integrity: ${Math.floor(this.state.storeIntegrity)}%
            
            Press R to try again.
        `;
        
        alert(message);
    }
    
    showMessage(text) {
        const debug = document.getElementById('debug');
        if (debug) {
            debug.textContent = text;
            debug.style.color = '#ffff00';
            
            // Clear after 3 seconds
            setTimeout(() => {
                if (debug.textContent === text) {
                    debug.textContent = 'SYSTEMS NOMINAL | SHIFT ACTIVE';
                    debug.style.color = '#ffff00';
                }
            }, 3000);
        }
    }
    
    updateObjectiveDisplay() {
        const display = document.getElementById('objectiveDisplay');
        if (display && this.directives.length > 0) {
            display.innerHTML = `
                <strong>DIRECTIVES:</strong><br>
                ${this.directives.map((d, i) => 
                    `${i+1}. ${d}`
                ).join('<br>')}
            `;
        }
    }
    
    showObjectives() {
        const directives = this.directives.map((d, i) => 
            `${i+1}. ${d}`
        ).join('\n');
        
        alert(`
            SHIFT #${this.state.currentNight}
            Current Time: ${this.formatTime(this.state.time)}
            
            ACTIVE DIRECTIVES:
            ${directives}
            
            Company Script: ${this.state.companyScript}
            
            Press OK to continue.
        `);
    }
    
    formatTime(hours) {
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : h;
        return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Clear with dark color
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map
        if (this.map) {
            this.map.draw(ctx);
        }
        
        // Draw items
        for (const item of this.items) {
            if (!item.collected) {
                item.draw(ctx);
            }
        }
        
        // Draw entities
        for (const entity of this.entities) {
            if (entity.active) {
                entity.draw(ctx);
            }
        }
        
        // Draw player
        if (this.player) {
            this.player.draw(ctx);
        }
        
        // Draw effects
        for (const effect of this.activeEffects) {
            effect.draw(ctx);
        }
        
        // Draw lighting (overlay)
        this.drawLighting(ctx);
        
        // Draw debug info
        if (this.state.debug) {
            this.drawDebugInfo(ctx);
        }
    }
    
    drawLighting(ctx) {
        // Save context
        ctx.save();
        
        // Create offscreen canvas for lighting
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = this.canvas.width;
        lightCanvas.height = this.canvas.height;
        const lightCtx = lightCanvas.getContext('2d');
        
        // Fill with ambient darkness
        lightCtx.fillStyle = `rgba(0, 0, 0, ${1 - this.lighting.ambient})`;
        lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
        
        // Draw emergency lights
        for (const light of this.lighting.emergencyLights) {
            this.drawLight(lightCtx, light);
        }
        
        // Draw store lights (with flicker)
        for (const light of this.lighting.flickeringLights) {
            if (light.flicker && Math.random() > 0.7) continue; // Flicker effect
            this.drawLight(lightCtx, light);
        }
        
        // Draw flashlight if on
        if (this.player && this.player.flashlightOn && this.lighting.flashlight) {
            this.drawFlashlightBeam(lightCtx, this.lighting.flashlight);
        }
        
        // Apply lighting to main canvas
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(lightCanvas, 0, 0);
        
        // Restore context
        ctx.restore();
    }
    
    drawLight(ctx, light) {
        const gradient = ctx.createRadialGradient(
            light.x, light.y, 0,
            light.x, light.y, light.radius
        );
        
        gradient.addColorStop(0, `${light.color}${Math.floor(light.intensity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, '#00000000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawFlashlightBeam(ctx, flashlight) {
        const gradient = ctx.createRadialGradient(
            flashlight.x, flashlight.y, 20,
            flashlight.x, flashlight.y, flashlight.radius
        );
        
        gradient.addColorStop(0, `${flashlight.color}${Math.floor(flashlight.intensity * 200).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${flashlight.color}${Math.floor(flashlight.intensity * 100).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, '#00000000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        // Create cone shape
        const startAngle = flashlight.angle - flashlight.width / 2;
        const endAngle = flashlight.angle + flashlight.width / 2;
        
        ctx.moveTo(flashlight.x, flashlight.y);
        ctx.arc(flashlight.x, flashlight.y, flashlight.radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
    }
    
    drawDebugInfo(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const debugInfo = [
            `Time: ${this.formatTime(this.state.time)}`,
            `Sanity: ${Math.floor(this.state.sanity)}%`,
            `Store: ${Math.floor(this.state.storeIntegrity)}%`,
            `Entities: ${this.entities.length}`,
            `Player: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
            `Tool: ${this.tools[this.currentTool].name}`
        ];
        
        debugInfo.forEach((text, i) => {
            ctx.fillText(text, 10, 10 + i * 15);
        });
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = (currentTime - this.lastTime) || 0;
        this.lastTime = currentTime;
        
        if (this.state.running) {
            this.update(this.deltaTime);
            this.draw();
        }
        
        // Handle restart
        if (this.keys['r'] && (this.state.gameOver || this.state.win)) {
            document.location.reload();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const loading = document.getElementById('loading');
    
    if (canvas) {
        // Hide loading message
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Create and start game
        window.game = new GameEngine(canvas);
    } else {
        console.error('Canvas element not found!');
    }
});
