export const ASSET_KEYS = {
    IMAGES: {
        BACKGROUND: 'background',
        PLATFORM: 'platform',
        TERRAIN_GRASS_CENTER: 'terrain_grass_block_center',
        TERRAIN_GRASS_TOP: 'terrain_grass_block_top',
        SPIKES: 'spikes',
        FLAG: 'flag',
        COIN: 'coin',
        KEY: 'key'
    },
    ATLASES: {
        PLAYER: 'player',
        FROG: 'frog'
    },
    TILEMAPS: {
        GAME: 'tilemap'
    },
    ANIMATIONS: {
        PLAYER: {
            IDLE: 'player-idle',
            WALK: 'player-walk',
            JUMP: 'player-jump'
        },
        FROG: {
            IDLE: 'frog-idle',
            JUMP: 'frog-jump',
            REST: 'frog-rest'
        }
    }
} as const;

export const ASSET_PATHS = {
    IMAGES: {
        [ASSET_KEYS.IMAGES.BACKGROUND]: 'bg.png',
        [ASSET_KEYS.IMAGES.PLATFORM]: 'bg.png',
        [ASSET_KEYS.IMAGES.TERRAIN_GRASS_CENTER]: 'tilemap/tiles/terrain_grass_block_center.png',
        [ASSET_KEYS.IMAGES.TERRAIN_GRASS_TOP]: 'tilemap/tiles/terrain_grass_block_top.png',
        [ASSET_KEYS.IMAGES.SPIKES]: 'tilemap/tiles/spikes.png',
        [ASSET_KEYS.IMAGES.FLAG]: 'tilemap/tiles/flag_green_a.png',
        [ASSET_KEYS.IMAGES.COIN]: 'tilemap/tiles/coin_gold.png',
        [ASSET_KEYS.IMAGES.KEY]: 'tilemap/tiles/hud_key_green.png'
    },
    ATLASES: {
        [ASSET_KEYS.ATLASES.PLAYER]: {
            texture: 'player/character_purple.png',
            atlas: 'player/character_purple.json'
        },
        [ASSET_KEYS.ATLASES.FROG]: {
            texture: 'enemy/frog.png',
            atlas: 'enemy/frog.json'
        }
    },
    TILEMAPS: {
        [ASSET_KEYS.TILEMAPS.GAME]: 'tilemap/scenes/game.json'
    }
} as const;

export const TILEMAP_OBJECTS = {
    ENEMY: {
        FROG: 'frog'
    },
    COLLECTIBLE: {
        COIN: 'coin',
        KEY: 'key'
    },
    HAZARD: {
        SPIKE: 'spike'
    },
    GOAL: {
        FLAG: 'flag'
    }
} as const;

export const TILEMAP_TILESETS = {
    TERRAIN_GRASS_CENTER: 'terrain_grass_block_center',
    TERRAIN_GRASS_TOP: 'terrain_grass_block_top'
} as const;