////// Planet
// Radii: Height at which stuff is put
const PLANET_RADIUS = 16;
const MAN_RADIUS = PLANET_RADIUS-0.02;
const CAMERA_RADIUS = PLANET_RADIUS+0.75;
const MACHINE_RADIUS = PLANET_RADIUS-0.03;
const TERRAFORMER_RADIUS = PLANET_RADIUS-0.15;
const BIOMES = ["MountainBiome","AridBiome","CityBiome",
                "MountainBiome","AridBiome","CityBiome"];
// Stuff having to do with the "nice zone"
const NICE_ZONE_SIZE = 48;
const ZONE_SPEED = 0.1;
const ZONE_STARTING_ANGLE = 0.4+Math.PI; //Radians
const TEMPERATURE_SCALE = 1.6;
const TERRAFORMING_SPEED = 1; // When winning the game

// Physics (maily used for items)
const GRAVITY = 2;
const PARTICLE_FRICTION = 0.6; // Friction when in contact with planet
const PARTICLE_ELASTICITY = 1.3; // Elasticity off of planet surface

// Man
const MAN_SPEED = 4;
const MAN_FRAME_TIME = 0.3/MAN_SPEED;
const MAN_WALK_SATISFACTION_RANGE = 0.1;
const MAN_JUMP_VEL = 1.5;
const MAN_INVENTORY_HEIGHT = PLANET_RADIUS*1.013;
const MAN_INVENTORY_BEHIND = 0.20;
const MAN_INVENTORY_FORCE = 32;
const MAN_INVENTORY_DRAG = 0.2;

// Camera
const CAMERA_SPEED = MAN_SPEED*1.2;
const ZOOM_SPEED = 0.25;
const MIN_ZOOM = 0.0001;//0.04;
const MAX_ZOOM = 0.5;

// Items
const ITEM_CLICK_RADIUS = 0.25;
const ITEM_JUMP_FREQUENCY = 3;
const ITEM_JUMP_POWER = 0.3;
const ITEM_SCALE = 0.5;
const ITEM_SLOT_SCALE_SPEED = 8;

const WORLD_ITEM_SCATTER = {'metal':10};

// Machines
const ITEM_SLOT_FORCE = 32;
const ITEM_SLOT_DRAG = 0.2;

const MACHINE_SLOT_SPACING = 0.2;
const MACHINE_SLOT_X = 0.4;
const MACHINE_SLOT_Y = 0.3;
const MACHINE_SIZE = 0.6;

const RUNNING_WIGGLE_SPEED = 24;
const RUNNING_WIGGLE_MAGNITUDE = 0.005;
const CONSTRUCTION_ANIM_FRAME_TIME = 0.6;


// Item names: "battery","water","carbon","metal"
const MACHINE_CONFIG = {
    'boiler':{
        image: "Machimes/battery-steam.png",
        components: {"metal":2}, // Materials required to build the object.
        consume_time: 2, // Seconds after which the input is consumed
        produce_time: 1, // Seconds between each production
        stock: 2, // The number of times more input slot than one run's requirements
        consumes: {"water":1}, // What gets consumed with each consumption
        produces: {"battery":1}, // What gets shot out with each production 
    },
    'engine':{
        image: "Machimes/battery-combustiom.png",
        components: {"metal":2},
        consume_time: 2,
        produce_time: 1,
        stock: 2,
        consumes: {"carbon":1},
        produces: {"battery":1},
    },
    'carbon':{
        image: "Machimes/carbom.png",
        components: {"metal":2},
        consume_time: 2,
        produce_time: 1,
        stock: 2,
        consumes: {"battery":1},
        produces: {"carbon":1},
    },
    'metal':{
        image: "Machimes/metal.png",
        components: {"metal":2},
        consume_time: 2,
        produce_time: 1,
        stock: 2,
        consumes: {"battery":1},
        produces: {"metal":1},
    },
    'water':{
        image: "Machimes/water.png",
        components: {"metal":2},
        consume_time: 2, 
        produce_time: 1,
        stock: 2,
        consumes: {"battery":1},
        produces: {"water":1},
    },
    'terraformer':{
        image: "Machimes/terraformer.png",
        components: {"metal":4},
        consume_time: 2000000000000, 
        produce_time: 2000000000000,
        stock: 1,
        consumes: {"carbon":2,"water":2,},
        produces: {"battery":8},
    },
};

