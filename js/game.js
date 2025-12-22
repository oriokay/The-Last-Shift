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
