export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 720;

export const WORLD_HEIGHT = 1000000;

export const GRAVITY_Y = 1500;
export const JUMP_VELOCITY = 790;
export const PLAYER_RADIUS = 16;
export const MOVE_SPEED = 300;

// Highest vertical distance the ball can reach in a single jump.
export const MAX_JUMP_HEIGHT = Math.round((JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY_Y));

export const PLATFORM_WIDTH = 85;
export const PLATFORM_HEIGHT = 18;

// From 700 m, platform widths vary within this range.
export const PLATFORM_WIDTH_VARY_START = 7000;
export const PLATFORM_MIN_WIDTH = 55;
export const PLATFORM_MAX_WIDTH = 130;

// Platform rows are always spaced well below the jump height so every
// platform is reachable and the player can never get stuck.
export const PLATFORM_MIN_GAP = Math.round(MAX_JUMP_HEIGHT * 0.35);
export const PLATFORM_MAX_GAP = Math.round(MAX_JUMP_HEIGHT * 0.6);
export const MAX_REACH = 100;
export const START_PLATFORM_WIDTH = 170;

// Difficulty. Distances are in px climbed (score shows px / 10 as meters).
export const MOVING_PLATFORM_START = 3000; // 300 m
export const MOVING_PLATFORM_BASE_SPEED = 40;
export const MOVING_PLATFORM_SPEED_PER_KM = 30; // extra px/s per 1000 m climbed
export const MOVING_PLATFORM_MAX_SPEED = 220;
export const MOVING_SPEED_JITTER = 0.3; // random +/-30% so platforms don't all match speed

export const OBSTACLE_START = 10000; // 1000 m
export const OBSTACLE_BASE_CHANCE = 0.35;
export const OBSTACLE_MAX_CHANCE = 0.65;
export const OBSTACLE_RADIUS = 16;

// Powerups. Spawn distances are in px climbed (score shows px / 10 as meters).
export const POWERUP_RADIUS = 14;
export const POWERUP_FLOAT = 35; // floats this many px above its platform

export const SHIELD_START = OBSTACLE_START; // 1000 m
export const SHIELD_EVERY = 2500; // one shield per 250 m

export const SUPER_JUMP_START = 0; // available from the start
export const SUPER_JUMP_EVERY = 6000; // one super jump per 600 m
export const SUPER_JUMP_MULTIPLIER = 10; // x10 the base jump height
export const SUPER_JUMP_HEIGHT = MAX_JUMP_HEIGHT * SUPER_JUMP_MULTIPLIER;
export const SUPER_JUMP_VELOCITY = Math.round(Math.sqrt(2 * GRAVITY_Y * SUPER_JUMP_HEIGHT));

export const EXTRA_LIFE_START = 0; // available from the start
export const EXTRA_LIFE_EVERY = 10000; // one extra life per 1000 m

export const SAVE_PLATFORM_WIDTH = 55; // green mini platform spawned to save the player

// Platform durability (uses counted per landing/touch).
export const PLATFORM_DURABLE_START = 8000; // 800 m: 2 touches (yellow -> red -> gone)
export const PLATFORM_WEAK_START = 13000; // 1300 m: 1 touch (red -> gone)

export const PLAYER_SCREEN_Y = 260;
export const DEATH_MARGIN = 40;
