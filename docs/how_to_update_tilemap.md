# 📝 如何修改Tilemap并更新配置

本文档详细说明如何修改tilemap、更新素材配置文件，并在代码中应用新的素材。

## 🎯 概述

在本项目中，素材管理采用三层架构：
1. **Tilemap文件** (`game.json`) - 定义地图布局和对象位置
2. **配置中心** (`AssetConfig.ts`) - 统一管理所有素材的key和路径
3. **游戏代码** - 使用配置中的常量引用素材

这种架构避免了key在多处重复定义，减少了维护成本和出错概率。

## 📋 快速指南

### 场景1：添加新的地形瓦片

假设你要添加一个新的地形瓦片"石头块"：

#### 步骤1：准备素材文件
```
public/assets/tilemap/tiles/stone_block.png
```

#### 步骤2：更新配置文件
```typescript
// src/game/config/AssetConfig.ts

export const ASSET_KEYS = {
    IMAGES: {
        // ...existing
        STONE_BLOCK: 'stone_block'  // 添加新的key
    }
};

export const ASSET_PATHS = {
    IMAGES: {
        // ...existing
        [ASSET_KEYS.IMAGES.STONE_BLOCK]: 'tilemap/tiles/stone_block.png'
    }
};

export const TILEMAP_TILESETS = {
    // ...existing
    STONE_BLOCK: 'stone_block'  // tilemap中使用的tileset名称
};
```

#### 步骤3：在Tilemap中使用
编辑 `public/assets/tilemap/scenes/game.json`：
```json
{
    "tilesets": [
        // ...existing tilesets
        {
            "firstgid": 3,
            "image": "../tiles/stone_block.png",
            "imageheight": 64,
            "imagewidth": 64,
            "name": "stone_block",  // 对应 TILEMAP_TILESETS.STONE_BLOCK
            "tilecount": 1,
            "tileheight": 64,
            "tilewidth": 64
        }
    ]
}
```

#### 步骤4：在Game场景中加载
```typescript
// src/game/scenes/Game.ts
const stoneBlock = this.map.addTilesetImage(
    TILEMAP_TILESETS.STONE_BLOCK,
    ASSET_KEYS.IMAGES.STONE_BLOCK
);

// 创建图层时包含新的tileset
const allTilesets = [terrainCenter!, terrainTop!, stoneBlock!];
const layer = this.map.createLayer('Level1', allTilesets, 0, 0);
```

### 场景2：添加新的游戏对象

假设你要添加一个新的敌人"蝙蝠"：

#### 步骤1：准备素材文件
```
public/assets/enemy/bat.png
public/assets/enemy/bat.json  # 精灵图集配置
```

#### 步骤2：更新配置文件
```typescript
// src/game/config/AssetConfig.ts

export const ASSET_KEYS = {
    ATLASES: {
        // ...existing
        BAT: 'bat'  // 新的精灵图集
    },
    ANIMATIONS: {
        // ...existing
        BAT: {
            FLY: 'bat-fly',
            ATTACK: 'bat-attack'
        }
    }
};

export const ASSET_PATHS = {
    ATLASES: {
        // ...existing
        [ASSET_KEYS.ATLASES.BAT]: {
            texture: 'enemy/bat.png',
            atlas: 'enemy/bat.json'
        }
    }
};

export const TILEMAP_OBJECTS = {
    ENEMY: {
        // ...existing
        BAT: 'bat'  // tilemap中的对象名
    }
};
```

#### 步骤3：创建游戏对象类
```typescript
// src/game/objects/enemy/Bat.ts
import { Scene, Physics } from 'phaser';
import { ASSET_KEYS } from '../../config/AssetConfig';

export class Bat extends Physics.Arcade.Sprite {
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, ASSET_KEYS.ATLASES.BAT, 'fly/frame0000');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 创建动画
        this.createAnimations();
        this.play(ASSET_KEYS.ANIMATIONS.BAT.FLY);
    }
    
    private createAnimations(): void {
        if (!this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.BAT.FLY)) {
            this.scene.anims.create({
                key: ASSET_KEYS.ANIMATIONS.BAT.FLY,
                frames: this.scene.anims.generateFrameNames(
                    ASSET_KEYS.ATLASES.BAT,
                    {
                        prefix: 'fly/frame',
                        start: 0,
                        end: 3,
                        zeroPad: 4
                    }
                ),
                frameRate: 10,
                repeat: -1
            });
        }
    }
}
```

#### 步骤4：在Tilemap中添加对象
编辑 `public/assets/tilemap/scenes/game.json`：
```json
{
    "layers": [
        {
            "name": "Objects",
            "objects": [
                // ...existing objects
                {
                    "gid": 0,
                    "name": "bat",  // 对应 TILEMAP_OBJECTS.ENEMY.BAT
                    "type": "enemy",
                    "x": 500,
                    "y": 300,
                    "width": 64,
                    "height": 64
                }
            ]
        }
    ]
}
```

#### 步骤5：在Game场景中处理
```typescript
// src/game/scenes/Game.ts
import { Bat } from '../objects/enemy/Bat';

// 在创建对象的循环中
if (obj.type === 'enemy' && obj.name === TILEMAP_OBJECTS.ENEMY.BAT) {
    const bat = new Bat(this, x, y);
    this.enemiesGroup.add(bat);
}

// 添加碰撞检测
this.physics.add.overlap(this.player, this.enemiesGroup, this.handleEnemyCollision);
```

### 场景3：修改现有对象的素材

假设你要替换金币的图片：

#### 步骤1：替换素材文件
将新的图片放到：
```
public/assets/tilemap/tiles/coin_silver.png  # 新图片
```

#### 步骤2：更新路径配置
```typescript
// src/game/config/AssetConfig.ts
export const ASSET_PATHS = {
    IMAGES: {
        // ...
        [ASSET_KEYS.IMAGES.COIN]: 'tilemap/tiles/coin_silver.png'  // 更新路径
    }
};
```

完成！所有使用 `ASSET_KEYS.IMAGES.COIN` 的地方都会自动使用新图片。

## 🔧 详细说明

### AssetConfig.ts 结构

```typescript
// 1. Key定义 - 所有素材的唯一标识符
export const ASSET_KEYS = {
    IMAGES: {          // 单张图片
        BACKGROUND: 'background',
        COIN: 'coin',
        // ...
    },
    ATLASES: {         // 精灵图集
        PLAYER: 'player',
        FROG: 'frog',
        // ...
    },
    TILEMAPS: {        // 地图文件
        GAME: 'tilemap'
    },
    ANIMATIONS: {      // 动画名称
        PLAYER: {
            IDLE: 'player-idle',
            WALK: 'player-walk',
            // ...
        }
    }
};

// 2. 路径映射 - key到实际文件路径的映射
export const ASSET_PATHS = {
    IMAGES: {
        [ASSET_KEYS.IMAGES.COIN]: 'tilemap/tiles/coin_gold.png',
        // ...
    },
    ATLASES: {
        [ASSET_KEYS.ATLASES.PLAYER]: {
            texture: 'player/character_purple.png',
            atlas: 'player/character_purple.json'
        },
        // ...
    }
};

// 3. Tilemap相关常量
export const TILEMAP_OBJECTS = {  // tilemap中的对象名
    ENEMY: { FROG: 'frog' },
    COLLECTIBLE: { COIN: 'coin', KEY: 'key' },
    // ...
};

export const TILEMAP_TILESETS = {  // tileset名称
    TERRAIN_GRASS_CENTER: 'terrain_grass_block_center',
    // ...
};
```

### Preloader 自动加载机制

Preloader场景会自动加载所有配置的资源：

```typescript
// src/game/scenes/Preloader.ts
preload() {
    this.load.setPath('assets');
    
    // 自动加载所有精灵图集
    for (const [key, paths] of Object.entries(ASSET_PATHS.ATLASES)) {
        this.load.atlas(key, paths.texture, paths.atlas);
    }
    
    // 自动加载所有图片
    for (const [key, path] of Object.entries(ASSET_PATHS.IMAGES)) {
        if (key !== ASSET_KEYS.IMAGES.BACKGROUND) {  // 背景在Boot中加载
            this.load.image(key, path);
        }
    }
    
    // 加载tilemap
    this.load.tilemapTiledJSON(
        ASSET_KEYS.TILEMAPS.GAME,
        ASSET_PATHS.TILEMAPS[ASSET_KEYS.TILEMAPS.GAME]
    );
}
```

### Tilemap JSON 结构

```json
{
    "width": 25,        // 地图宽度（格子数）
    "height": 19,       // 地图高度（格子数）
    "tilewidth": 64,    // 每个格子宽度（像素）
    "tileheight": 64,   // 每个格子高度（像素）
    
    "tilesets": [      // 瓦片集定义
        {
            "firstgid": 1,  // 第一个tile的全局ID
            "image": "../tiles/terrain_grass_block_center.png",
            "name": "terrain_grass_block_center",  // 对应配置中的名称
            "tilecount": 1
        }
    ],
    
    "layers": [
        {
            "name": "Level1",
            "type": "tilelayer",    // 地形层
            "data": [0,0,1,2,...]   // tile索引数组
        },
        {
            "name": "Objects",
            "type": "objectgroup",  // 对象层
            "objects": [
                {
                    "name": "coin",  // 对应 TILEMAP_OBJECTS
                    "type": "collectible",
                    "x": 128,
                    "y": 768,
                    "width": 64,
                    "height": 64
                }
            ]
        }
    ]
}
```

## ⚠️ 注意事项

### 1. 坐标系统
- Tilemap中对象的(x,y)是**左上角**坐标
- Phaser精灵的锚点默认在**中心**
- 转换公式：
  ```typescript
  const x = obj.x + obj.width / 2;
  const y = obj.y + obj.height / 2;
  ```

### 2. 命名约定
- Key使用大写下划线：`COIN_GOLD`
- 值使用小写下划线：`coin_gold`
- 动画名使用连字符：`player-idle`

### 3. 资源组织
```
assets/
├── player/          # 玩家相关
├── enemy/           # 敌人相关
├── tilemap/
│   ├── scenes/      # 地图文件
│   └── tiles/       # 瓦片图片
└── ui/              # UI元素
```

### 4. 类型安全
使用 `as const` 确保类型安全：
```typescript
export const ASSET_KEYS = {
    // ...
} as const;

// 使用时有完整的类型提示
this.load.image(ASSET_KEYS.IMAGES.COIN, path);  // ✅ 类型安全
this.load.image('coin', path);                   // ❌ 字符串字面量
```

## 🚀 最佳实践

1. **先更新配置，再修改代码**
   - 总是先在 `AssetConfig.ts` 中定义key
   - 然后在代码中使用配置的常量

2. **保持一致性**
   - Tilemap中的对象名要与配置中的一致
   - 动画名称要有明确的命名规范

3. **分组管理**
   - 相关的素材放在同一目录
   - 配置中也按类型分组

4. **版本控制**
   - 修改配置文件时写清晰的commit信息
   - 说明添加/修改了哪些素材

5. **测试验证**
   - 修改后运行游戏确认素材正确加载
   - 检查控制台是否有加载错误

## 📚 常见问题

### Q: 素材没有加载？
A: 检查：
1. 文件路径是否正确
2. `ASSET_PATHS` 中是否配置了路径
3. Preloader是否会自动加载该类型资源

### Q: Tilemap对象没有创建？
A: 检查：
1. 对象的name是否与 `TILEMAP_OBJECTS` 中定义的一致
2. Game场景中是否处理了该类型对象
3. 坐标转换是否正确

### Q: 动画播放失败？
A: 检查：
1. 动画key是否在 `ASSET_KEYS.ANIMATIONS` 中定义
2. 精灵图集的帧名是否正确
3. 动画是否已创建（检查 `anims.exists()`）

## 🎯 总结

通过统一的配置系统，我们实现了：
- ✅ 单一数据源，避免重复定义
- ✅ 类型安全，IDE智能提示
- ✅ 易于维护，修改一处即可
- ✅ 自动加载，减少手动工作

遵循本文档的步骤，你可以轻松地添加、修改和管理游戏素材，保持代码的整洁和可维护性。