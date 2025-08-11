# 🎮 Phaser 3 平台游戏项目文档

## 📁 项目结构概览

```
template-vite-ts/
├── public/
│   └── assets/
│       ├── tilemap/
│       │   ├── scenes/
│       │   │   ├── game.json          # 当前游戏地图数据
│       │   │   ├── game_easy.json     # 简单版地图备份
│       │   │   └── game_hard.json     # 困难版地图
│       │   └── tiles/
│       │       ├── terrain_grass_block_center.png
│       │       ├── terrain_grass_block_top.png
│       │       ├── spikes.png
│       │       ├── coin_gold.png
│       │       ├── hud_key_green.png
│       │       └── flag_green_a.png
│       ├── player/
│       │   ├── character_purple.png   # 玩家精灵图
│       │   └── character_purple.json  # 精灵图集配置
│       └── enemy/
│           ├── frog.png              # 青蛙敌人精灵图
│           ├── frog.json             # 青蛙图集配置
│           └── frog_animators.json   # 青蛙动画配置
├── src/
│   ├── game/
│   │   ├── main.ts                  # 游戏配置和初始化
│   │   ├── config/
│   │   │   └── AssetConfig.ts       # 🆕 统一素材配置中心
│   │   ├── scenes/
│   │   │   ├── Boot.ts              # 启动场景
│   │   │   ├── Preloader.ts         # 资源预加载场景
│   │   │   ├── MainMenu.ts          # 主菜单场景
│   │   │   ├── Game.ts              # 主游戏场景
│   │   │   ├── GameOver.ts          # 游戏结束场景
│   │   │   └── MapEditor.ts         # 地图编辑器场景
│   │   └── objects/
│   │       ├── player/
│   │       │   └── Player.ts        # 玩家类
│   │       ├── enemy/
│   │       │   └── Frog.ts          # 青蛙敌人类
│   │       ├── spike/
│   │       │   └── Spike.ts         # 尖刺陷阱类
│   │       ├── coin/
│   │       │   └── Coin.ts          # 金币收集品类
│   │       ├── key/
│   │       │   └── Key.ts           # 钥匙类
│   │       └── flag/
│   │           └── Flag.ts          # 终点旗帜类
│   ├── main.ts                      # 应用入口
│   └── editor.html                  # Web地图编辑器
├── vite/
│   └── config.dev.mjs               # Vite开发配置
├── package.json
└── index.html                       # HTML入口
```

## 🆕 素材配置系统

### **统一配置中心** (`src/game/config/AssetConfig.ts`)

为了解决素材key在多处重复定义的问题，我们引入了统一的配置系统：

```typescript
export const ASSET_KEYS = {
    IMAGES: {
        BACKGROUND: 'background',
        COIN: 'coin',
        KEY: 'key',
        FLAG: 'flag',
        SPIKES: 'spikes',
        // ...
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
        [ASSET_KEYS.IMAGES.COIN]: 'tilemap/tiles/coin_gold.png',
        // ...
    },
    // ...
};
```

**优势**：
- ✅ **单一数据源**：所有素材key集中管理
- ✅ **类型安全**：TypeScript提供完整的类型检查
- ✅ **智能提示**：IDE自动完成和重构支持
- ✅ **易于维护**：新增素材只需修改一处
- ✅ **避免拼写错误**：使用常量而非字符串字面量

**使用示例**：
```typescript
// 在Preloader中自动加载所有配置的资源
for (const [key, paths] of Object.entries(ASSET_PATHS.ATLASES)) {
    this.load.atlas(key, paths.texture, paths.atlas);
}

// 在游戏对象中使用
super(scene, x, y, ASSET_KEYS.IMAGES.COIN);

// 播放动画
this.play(ASSET_KEYS.ANIMATIONS.PLAYER.IDLE);
```

## 🔧 核心文件详解

### 1. **游戏配置文件** (`src/game/main.ts`)
```typescript
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },  // 重力设置
            debug: false
        }
    },
    scene: [Boot, Preloader, MainMenu, MainGame, GameOver, MapEditor]
};
```
**作用**: 定义游戏的基础配置
**注意事项**: 
- 重力值影响跳跃高度，需要与Player类的跳跃力配合调整
- scene数组顺序决定了启动顺序

### 2. **主游戏场景** (`src/game/scenes/Game.ts`)
**核心功能**:
- 加载tilemap和创建地形
- 从object layer创建所有游戏对象
- 处理碰撞检测
- 管理UI显示

**关键代码段**:
```typescript
import { ASSET_KEYS, TILEMAP_OBJECTS, TILEMAP_TILESETS } from '../config/AssetConfig';

// 使用配置创建tilemap
this.map = this.make.tilemap({ key: ASSET_KEYS.TILEMAPS.GAME });

// 添加tilesets
const terrainCenter = this.map.addTilesetImage(
    TILEMAP_TILESETS.TERRAIN_GRASS_CENTER, 
    ASSET_KEYS.IMAGES.TERRAIN_GRASS_CENTER
);

// 从object layer创建对象
const objectLayer = this.map.getObjectLayer('Objects');
objectLayer.objects.forEach((obj: any) => {
    const x = obj.x + obj.width / 2;
    const y = obj.y + obj.height / 2;
    
    // 使用配置中的对象类型
    if (obj.type === 'collectible' && obj.name === TILEMAP_OBJECTS.COLLECTIBLE.COIN) {
        const coin = new Coin(this, x, y);
        this.coinsGroup.add(coin);
    }
    // ...
});
```

**易踩坑点**:
- ⚠️ Tiled对象坐标系统：对象的(x,y)是左上角，需要加上width/2和height/2转换为中心点
- ⚠️ 对象在tilemap中的y坐标可能需要调整，避免卡在地形里
- ⚠️ 碰撞组必须在创建对象前初始化

### 3. **玩家类** (`src/game/objects/player/Player.ts`)
**核心功能**:
- 基础移动和跳跃
- 墙跳机制
- 蓄力跳跃
- 生命值系统
- 动画管理

**关键特性**:
```typescript
private wallJumpForce: number = 200;      // 墙跳水平推力
private chargeJumpMultiplier: number = 1.8; // 蓄力跳倍数
private invulnerabilityDuration: number = 1500; // 无敌时间
```

**易踩坑点**:
- ⚠️ 动画必须在创建时检查是否已存在，避免重复创建
- ⚠️ 墙跳检测需要同时检查blocked.left/right和velocity.y
- ⚠️ 蓄力条UI元素需要设置setScrollFactor(0)以固定在屏幕上

### 4. **青蛙敌人类** (`src/game/objects/enemy/Frog.ts`)
**AI行为**:
- 定期跳跃巡逻
- 检测玩家并追击
- 可被踩踏消灭

**关键代码**:
```typescript
// 玩家检测
const player = this.scene.children.getByName('player');
if (player && distance < 200) {
    this.direction = player.x > this.x ? 1 : -1;
    this.jump();
}
```

**易踩坑点**:
- ⚠️ 动画帧名必须与atlas JSON完全匹配（如'idle/frame0000'）
- ⚠️ 需要给玩家设置name属性才能被敌人检测到
- ⚠️ 碰撞检测需要区分踩踏（从上方）和普通碰撞

### 5. **Tilemap数据** (`public/assets/tilemap/scenes/game.json`)
**结构说明**:
```json
{
    "layers": [
        {
            "type": "tilelayer",    // 地形层
            "data": [...]           // tile索引数组
        },
        {
            "type": "objectgroup",  // 对象层
            "objects": [...]        // 游戏对象数组
        }
    ]
}
```

**Tile索引含义**:
- 0: 空
- 1: 草地块中心
- 2: 草地块顶部

**易踩坑点**:
- ⚠️ data数组是行优先存储（先横后竖）
- ⚠️ 对象的gid=0表示没有关联的tile图像
- ⚠️ 修改地图后要确保所有对象y坐标正确，避免卡在地形里

### 6. **收集品类** (`Coin.ts`, `Key.ts`)
**共同特点**:
- 旋转/漂浮动画
- 收集时的粒子效果
- 一次性收集机制

**易踩坑点**:
- ⚠️ 必须使用staticGroup而不是普通group，否则会受重力影响
- ⚠️ 收集后要设置标志避免重复收集

### 7. **地图编辑器** (`src/editor.html`)
**功能特性**:
- 可视化编辑
- 导入/导出Tiled格式
- 实时预览

**导出格式转换**:
```javascript
// 内部格式 -> Tiled格式
objects: mapData.objects.map(obj => ({
    gid: 0,
    name: obj.type,
    type: getObjectType(obj.type),  // 类型映射
    x: obj.x,
    y: obj.y
}))
```

**易踩坑点**:
- ⚠️ 导出时对象类型需要正确映射（coin/key→collectible, spike→hazard等）
- ⚠️ 坐标系统差异：编辑器使用左上角，游戏可能需要中心点

## 🎯 设计模式和架构

### 场景管理模式
```
Boot → Preloader → MainMenu → Game/MapEditor
                        ↓
                    GameOver → MainMenu
```

### 对象继承结构
```
Phaser.Physics.Arcade.Sprite
    ├── Player (复杂移动机制)
    ├── Frog (AI行为)
    ├── Spike (静态危险物)
    ├── Coin (可收集)
    ├── Key (特殊收集品)
    └── Flag (目标点)
```

### 事件系统
```typescript
// Player发出事件
this.emit('damage', health);
this.emit('death');

// Game场景监听
player.on('damage', (health) => this.updateHealthUI(health));
player.on('death', () => this.scene.restart());
```

## ⚠️ 常见问题和解决方案

### 1. **对象穿过地形**
**问题**: 对象y坐标设置不当
**解决**: 确保对象y坐标在平台上方（平台y - 对象height/2）

### 2. **动画播放错误**
**问题**: "Cannot read properties of undefined (reading 'play')"
**解决**: 
- 确保动画已创建
- 检查帧名是否正确
- 添加安全检查：`if (this.scene.anims.exists('animation-name'))`

### 3. **碰撞检测失效**
**问题**: 对象之间没有碰撞
**解决**:
- 确保使用正确的组类型（staticGroup vs group）
- 检查碰撞设置顺序（必须在对象创建后）
- 验证碰撞回调函数参数

### 4. **地图加载失败**
**问题**: tilemap显示不正确
**解决**:
- 检查tileset的firstgid值
- 确保图片路径正确
- 验证layer名称匹配

### 5. **UI元素随相机移动**
**问题**: 血量条等UI随玩家移动
**解决**: 设置`setScrollFactor(0)`固定在屏幕上

## 🚀 扩展建议

1. **添加新敌人类型**
   - 继承基础Enemy类
   - 实现不同的AI行为
   - 添加到object layer类型映射

2. **新增游戏机制**
   - 双段跳/三段跳
   - 冲刺能力
   - 时间限制

3. **关卡系统**
   - 多个地图文件
   - 关卡选择菜单
   - 进度保存

4. **音效系统**
   - 背景音乐
   - 动作音效
   - 环境音

## 🎮 游戏操作说明

### 基础控制
- **方向键左/右**: 移动
- **方向键上**: 跳跃
- **方向键下**: 下蹲
- **Shift + 上**: 蓄力跳跃
- **M键**: 进入地图编辑器（游戏中）

### 高级技巧
- **墙跳**: 贴墙滑落时按跳跃
- **蓄力跳**: 按住Shift和上键蓄力，松开跳得更高
- **踩踏敌人**: 从上方落到青蛙身上可以消灭它

### 游戏目标
1. 收集钥匙（绿色）
2. 收集金币（可选，用于完美通关）
3. 到达旗帜处完成关卡

## 📝 开发指南

### 添加新的游戏对象

1. **更新配置文件**
```typescript
// src/game/config/AssetConfig.ts
export const ASSET_KEYS = {
    IMAGES: {
        // ...
        NEW_OBJECT: 'newobject'  // 添加新的key
    }
};

export const ASSET_PATHS = {
    IMAGES: {
        // ...
        [ASSET_KEYS.IMAGES.NEW_OBJECT]: 'path/to/image.png'
    }
};

export const TILEMAP_OBJECTS = {
    // ...
    NEW_CATEGORY: {
        NEW_OBJECT: 'newobject'  // tilemap中的对象名
    }
};
```

2. **创建对象类**
```typescript
// src/game/objects/newobject/NewObject.ts
import { ASSET_KEYS } from '../../config/AssetConfig';

export class NewObject extends Physics.Arcade.Sprite {
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, ASSET_KEYS.IMAGES.NEW_OBJECT);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
    }
}
```

3. **资源会自动在Preloader中加载**（无需手动添加）

3. **在Game场景中处理**
```typescript
// 在object layer处理中添加
else if (obj.type === 'newtype' && obj.name === 'newobject') {
    const newObj = new NewObject(this, x, y);
    this.newObjectGroup.add(newObj);
}
```

4. **更新编辑器**
- 在editor.html中添加新的object按钮
- 更新类型映射函数

### 调试技巧

1. **开启物理调试**
```typescript
physics: {
    arcade: {
        debug: true  // 显示碰撞边界
    }
}
```

2. **控制台日志**
```typescript
console.log('Player position:', this.player.x, this.player.y);
console.log('Velocity:', this.player.body.velocity);
```

3. **场景调试**
```typescript
// 快速跳转到特定场景
this.scene.start('MapEditor');
```

## 🔧 技术栈

- **Phaser 3**: 游戏引擎
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速的开发构建工具
- **Tiled Map Editor**: 地图编辑器格式支持

## 📦 项目命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 🌟 特色功能

1. **完整的平台游戏机制**
   - 物理系统
   - 多种移动技巧
   - 生命值系统

2. **智能AI敌人**
   - 巡逻行为
   - 玩家检测
   - 追击机制

3. **两个地图编辑器**
   - Phaser内置编辑器（MapEditor.ts）
   - Web独立编辑器（editor.html）

4. **模块化设计**
   - 清晰的文件结构
   - 可复用的组件
   - 易于扩展

这个项目展示了一个完整的2D平台游戏架构，包含了物理系统、动画、AI、关卡编辑等核心要素，是学习Phaser 3游戏开发的优秀示例。