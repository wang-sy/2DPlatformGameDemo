# 游戏对象开发文档

## 🆕 素材配置系统

本项目使用统一的素材配置系统 (`src/game/config/AssetConfig.ts`)，所有素材key都集中管理，避免重复定义和拼写错误。

```typescript
import { ASSET_KEYS } from '../../config/AssetConfig';

// 使用配置中的key创建精灵
super(scene, x, y, ASSET_KEYS.IMAGES.COIN);

// 播放动画
this.play(ASSET_KEYS.ANIMATIONS.PLAYER.IDLE);
```

## 📦 Player 玩家角色

### 开发思路
Player是游戏的核心对象，承载了所有玩家交互逻辑。设计时遵循"响应迅速、控制精确"的原则，让玩家感受到角色完全在掌控之中。

### 物理特性
```typescript
// 基础物理参数
gravity: 800              // 重力加速度
jumpVelocity: -350       // 跳跃初速度（负值向上）
moveSpeed: 160           // 水平移动速度
wallSlideSpeed: 50       // 墙壁滑落速度
chargeJumpMultiplier: 1.8 // 蓄力跳跃倍数

// 碰撞体设置
this.body.setSize(16, 28);  // 碰撞体尺寸
this.body.setOffset(4, 4);  // 碰撞体偏移
```

### 素材配置
```typescript
// 在AssetConfig.ts中定义
ASET_KEYS.ATLASES.PLAYER = 'player'
ASSET_KEYS.ANIMATIONS.PLAYER = {
    IDLE: 'player-idle',
    WALK: 'player-walk',
    JUMP: 'player-jump'
}
```

### 核心机制

#### 1. 基础移动
```typescript
// 水平移动 - 线性速度控制
if (cursors.left.isDown) {
    this.setVelocityX(-this.moveSpeed);
    this.setFlipX(true);  // 翻转精灵朝向
}
```
**物理原理**: 直接设置水平速度，提供即时响应

#### 2. 跳跃系统
```typescript
// 地面跳跃检测
if (cursors.up.isDown && this.body.blocked.down) {
    this.setVelocityY(this.jumpVelocity);
}
```
**物理原理**: 
- 检测`blocked.down`确保站在实体上
- 施加向上的瞬时速度
- 重力自动处理下落

#### 3. 墙跳机制
```typescript
// 墙壁检测与跳跃
if (this.body.blocked.left && !this.body.blocked.down) {
    this.isWallSliding = true;
    this.setVelocityY(Math.min(this.body.velocity.y, this.wallSlideSpeed));
    
    if (cursors.up.isDown) {
        this.setVelocity(this.wallJumpForce, this.jumpVelocity);
    }
}
```
**物理原理**:
- 限制下落速度模拟摩擦力
- 墙跳时施加水平推力，让玩家脱离墙壁

#### 4. 蓄力跳跃
```typescript
// 蓄力计算
if (this.isCharging) {
    this.chargeTime += delta;
    const chargePercent = Math.min(this.chargeTime / this.maxChargeTime, 1);
    // 释放时
    const jumpForce = this.jumpVelocity * (1 + chargePercent * 0.8);
    this.setVelocityY(jumpForce);
}
```
**物理原理**: 根据蓄力时间线性增加跳跃力度

### Tilemap集成

#### 在Tilemap中配置
```json
{
    "name": "player",
    "type": "player",
    "x": 64,
    "y": 960,
    "width": 64,
    "height": 64
}
```

#### 在Game场景中创建
```typescript
import { TILEMAP_OBJECTS } from '../config/AssetConfig';

// 玩家现在从tilemap对象层加载
private createGameObjectByType(obj: any, x: number, y: number): void {
    // 玩家类型
    if (obj.type === 'player' || obj.name === TILEMAP_OBJECTS.PLAYER) {
        this.player = new Player(this, x, y);
        this.player.setName('player');
    }
    // ... 其他对象类型
}

// 如果tilemap中没有定义玩家，使用默认位置作为后备
if (!this.player) {
    this.player = new Player(this, 150, 1050);
    this.player.setName('player');
}
```

### 碰撞设置
```typescript
// 与地形碰撞
this.physics.add.collider(this.player, terrainLayer);

// 与其他对象交互
this.physics.add.overlap(this.player, this.spikes, this.handleSpikeCollision);
```

---

## 🐸 Frog 青蛙敌人

### 开发思路
Frog设计为基础敌人单位，行为模式简单但有效：巡逻-发现-追击。通过跳跃移动增加了预判难度。

### 物理特性
```typescript
// 移动参数
jumpForce: -300          // 跳跃力
horizontalJumpSpeed: 100 // 水平跳跃速度
detectionRange: 200      // 玩家检测范围
jumpInterval: 2000       // 跳跃间隔(ms)

// 碰撞体
this.body.setSize(24, 24);
this.body.setBounce(0.2);  // 轻微弹性
```

### 素材配置
```typescript
// 在AssetConfig.ts中定义
ASSET_KEYS.ATLASES.FROG = 'frog'
ASSET_KEYS.ANIMATIONS.FROG = {
    IDLE: 'frog-idle',
    JUMP: 'frog-jump',
    REST: 'frog-rest'
}
```

### AI行为

#### 1. 巡逻模式
```typescript
private patrol() {
    if (Date.now() - this.lastJumpTime > this.jumpInterval) {
        if (this.body.blocked.down) {
            this.jump();
            this.lastJumpTime = Date.now();
        }
    }
}
```
**物理原理**: 定时触发跳跃，随机方向

#### 2. 追击模式
```typescript
private chasePlayer(player: Player) {
    const distance = Phaser.Math.Distance.Between(
        this.x, this.y, player.x, player.y
    );
    
    if (distance < this.detectionRange) {
        this.direction = player.x > this.x ? 1 : -1;
        this.jump();
    }
}
```
**物理原理**: 计算与玩家距离，调整跳跃方向

#### 3. 踩踏检测
```typescript
// 判断玩家是否从上方接触
const playerFromAbove = player.body.velocity.y > 0 && 
                       player.y < frog.y;
if (playerFromAbove) {
    frog.die();
    player.setVelocityY(-200);  // 踩踏反弹
}
```

### Tilemap集成
```json
{
    "name": "frog",  // 对应 TILEMAP_OBJECTS.ENEMY.FROG
    "type": "enemy",
    "x": 300,
    "y": 350,
    "properties": {
        "patrolWidth": 100,
        "aggressive": true
    }
}
```

```typescript
// 在Game场景中处理
if (obj.type === 'enemy' && obj.name === TILEMAP_OBJECTS.ENEMY.FROG) {
    const frog = new Frog(this, x, y);
    this.frogsGroup.add(frog);
}
```

---

## 🗡️ Spike 尖刺陷阱

### 开发思路
Spike作为静态危险物，设计简单但位置摆放讲究。通过视觉反馈（闪烁）和无敌时间避免连续伤害。

### 素材配置
```typescript
// 在AssetConfig.ts中定义
ASSET_KEYS.IMAGES.SPIKES = 'spikes'
```

### 物理特性
```typescript
// 静态物体
this.scene.physics.add.existing(this, true);  // true = static

// 碰撞体精确设置
this.body.setSize(28, 16);     // 略小于实际大小
this.body.setOffset(2, 16);    // 底部对齐
```

### 伤害机制
```typescript
private handleSpikeCollision(player: Player, spike: Spike) {
    if (!player.isInvulnerable) {
        player.takeDamage(1);
        
        // 击退效果
        const knockbackX = player.x < spike.x ? -150 : 150;
        player.setVelocity(knockbackX, -200);
    }
}
```
**物理原理**: 施加反向速度模拟击退

### Tilemap集成
```json
{
    "name": "spike",  // 对应 TILEMAP_OBJECTS.HAZARD.SPIKE
    "type": "hazard",
    "x": 200,
    "y": 464,  // 确保在平台表面
    "properties": {
        "damage": 1,
        "knockback": true
    }
}
```

```typescript
// 在Game场景中处理
if (obj.type === 'hazard' && obj.name === TILEMAP_OBJECTS.HAZARD.SPIKE) {
    const spike = new Spike(this, x, y);
    this.spikesGroup.add(spike);
}
```

### 放置技巧
- 尖刺y坐标 = 平台y坐标 - 尖刺高度/2
- 避免放在必经之路造成强制伤害
- 配合跳跃节奏增加挑战

---

## 🪙 Coin 金币收集品

### 开发思路
Coin提供可选目标，增加重玩价值。通过旋转动画和粒子效果提升收集满足感。

### 素材配置
```typescript
// 在AssetConfig.ts中定义
ASSET_KEYS.IMAGES.COIN = 'coin'
```

### 物理特性
```typescript
// 静态组管理（不受重力影响）
const coinGroup = this.physics.add.staticGroup();

// 视觉动画（不影响物理）
this.scene.tweens.add({
    targets: this,
    angle: 360,
    duration: 2000,
    repeat: -1
});

// 浮动效果
this.scene.tweens.add({
    targets: this,
    y: this.y - 5,
    duration: 1000,
    yoyo: true,
    repeat: -1
});
```

### 收集机制
```typescript
private collectCoin(player: Player, coin: Coin) {
    // 防止重复收集
    if (coin.collected) return;
    coin.collected = true;
    
    // 收集动画
    this.scene.tweens.add({
        targets: coin,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => coin.destroy()
    });
    
    // 更新分数
    this.score += 10;
}
```

### Tilemap集成
```json
{
    "name": "coin",  // 对应 TILEMAP_OBJECTS.COLLECTIBLE.COIN
    "type": "collectible",
    "x": 150,
    "y": 400,
    "properties": {
        "value": 10,
        "respawn": false
    }
}
```

```typescript
// 在Game场景中处理
if (obj.type === 'collectible' && obj.name === TILEMAP_OBJECTS.COLLECTIBLE.COIN) {
    const coin = new Coin(this, x, y);
    this.coinsGroup.add(coin);
}
```

### 摆放策略
- 主路径：引导玩家
- 隐藏区域：奖励探索
- 危险位置：风险与回报
- 跳跃路径：练习技巧

---

## 🔑 Key 钥匙

### 开发思路
Key作为进度门槛，强制玩家探索关卡。视觉上更醒目，确保玩家注意到。

### 素材配置
```typescript
// 在AssetConfig.ts中定义
ASSET_KEYS.IMAGES.KEY = 'key'
```

### 物理特性
```typescript
// 发光效果
this.scene.add.particles(this.x, this.y, 'flares', {
    frame: 'yellow',
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.5, end: 0 },
    speed: 50,
    lifespan: 1000
});

// 重要性提示 - 更大的浮动幅度
this.scene.tweens.add({
    targets: this,
    y: this.y - 10,
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
});
```

### 收集逻辑
```typescript
private collectKey(player: Player, key: Key) {
    player.hasKey = true;
    
    // UI反馈
    this.keyIcon.setAlpha(1);  // 显示已获得
    
    // 音效提示（如果有）
    // this.sound.play('key_collect');
}
```

### Tilemap集成
```json
{
    "name": "key",  // 对应 TILEMAP_OBJECTS.COLLECTIBLE.KEY
    "type": "collectible",
    "x": 500,
    "y": 200,
    "properties": {
        "required": true,
        "unlocks": "flag"
    }
}
```

```typescript
// 在Game场景中处理
if (obj.type === 'collectible' && obj.name === TILEMAP_OBJECTS.COLLECTIBLE.KEY) {
    this.keyObject = new Key(this, x, y);
}
```

---

## 🚩 Flag 终点旗帜

### 开发思路
Flag作为关卡目标，需要明显的视觉标识和达成反馈。飘动动画增加生动感。

### 素材配置
```typescript
// 在AssetConfig.ts中定义
ASSET_KEYS.IMAGES.FLAG = 'flag'
```

### 物理特性
```typescript
// 静态物体但有动画
this.scene.physics.add.existing(this, true);

// 飘动效果
this.scene.tweens.add({
    targets: this,
    scaleX: 1.1,
    angle: 5,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
});
```

### 胜利检测
```typescript
private checkVictory(player: Player, flag: Flag) {
    if (!player.hasKey) {
        // 提示需要钥匙
        this.showMessage('需要钥匙！');
        return;
    }
    
    // 胜利处理
    player.setVelocity(0, 0);  // 停止移动
    
    // 胜利动画
    this.cameras.main.fade(1000, 255, 255, 255);
    this.time.delayedCall(1000, () => {
        this.scene.start('GameOver', { victory: true });
    });
}
```

### Tilemap集成
```json
{
    "name": "flag",  // 对应 TILEMAP_OBJECTS.GOAL.FLAG
    "type": "goal",
    "x": 900,
    "y": 100,
    "properties": {
        "requiresKey": true,
        "nextLevel": "level2"
    }
}
```

```typescript
// 在Game场景中处理
if (obj.type === 'goal' && obj.name === TILEMAP_OBJECTS.GOAL.FLAG) {
    this.flag = new Flag(this, x, y);
}
```

---

## 🗺️ Tilemap集成指南

### 1. Tilemap结构
```json
{
    "width": 32,
    "height": 24,
    "tilewidth": 32,
    "tileheight": 32,
    "layers": [
        {
            "name": "Terrain",
            "type": "tilelayer",
            "data": [...]  // 地形tiles
        },
        {
            "name": "Objects",
            "type": "objectgroup",
            "objects": [...]  // 游戏对象
        }
    ]
}
```

### 2. 对象层处理流程

#### 主要处理方法
```typescript
// 在Game场景的create方法中
private createGameObjectsFromObjectLayer(): void {
    // 获取object layer
    const objectLayer = this.map?.getObjectLayer('Objects');
    if (!objectLayer) return;
    
    // 遍历所有对象并创建相应的游戏对象
    objectLayer.objects.forEach((obj: any) => {
        // 计算对象中心坐标
        const x = obj.x + obj.width / 2;
        const y = obj.y + obj.height / 2;
        
        // 根据对象类型和名称创建不同的游戏对象
        this.createGameObjectByType(obj, x, y);
    });
}
```

#### 对象创建分发
```typescript
import { TILEMAP_OBJECTS } from '../config/AssetConfig';

private createGameObjectByType(obj: any, x: number, y: number): void {
    // 玩家类型
    if (obj.type === 'player' || obj.name === TILEMAP_OBJECTS.PLAYER) {
        this.player = new Player(this, x, y);
        this.player.setName('player');
    }
    // 敌人类型
    else if (obj.type === 'enemy') {
        if (obj.name === TILEMAP_OBJECTS.ENEMY.FROG) {
            const frog = new Frog(this, x, y);
            this.frogsGroup.add(frog);
        }
    }
    // 收集物类型
    else if (obj.type === 'collectible') {
        if (obj.name === TILEMAP_OBJECTS.COLLECTIBLE.COIN) {
            const coin = new Coin(this, x, y);
            this.coinsGroup.add(coin);
            this.totalCoins++;
        } else if (obj.name === TILEMAP_OBJECTS.COLLECTIBLE.KEY) {
            this.keyObject = new Key(this, x, y);
        }
    }
    // 危险物类型
    else if (obj.type === 'hazard') {
        if (obj.name === TILEMAP_OBJECTS.HAZARD.SPIKE) {
            const spike = new Spike(this, x, y);
            this.spikesGroup.add(spike);
        }
    }
    // 目标类型
    else if (obj.type === 'goal') {
        if (obj.name === TILEMAP_OBJECTS.GOAL.FLAG) {
            this.flag = new Flag(this, x, y);
        }
    }
}
```

这种结构的优势：
- **清晰的流程**：先读取对象层，再逐个创建对象
- **类型分组**：按对象类型（敌人、收集物、危险物、目标）分组处理
- **易于扩展**：添加新对象类型只需在对应分组中添加判断

### 3. 坐标系统注意事项

#### Tiled坐标系
- 原点：左上角
- Y轴：向下为正
- 对象锚点：左上角

#### Phaser坐标系
- 原点：左上角
- Y轴：向下为正
- 精灵锚点：中心（默认）

#### 转换公式
```typescript
// Tiled对象坐标 -> Phaser精灵坐标
phaserX = tiledX + tiledWidth / 2;
phaserY = tiledY + tiledHeight / 2;  // 注意：是加不是减

// 确保对象在平台上方（可选）
if (needsGroundAlignment) {
    phaserY = platformY - objectHeight / 2;
}
```

### 4. 碰撞层设置
```typescript
// 创建碰撞层
const terrainLayer = this.map.createLayer('Terrain', tileset);
terrainLayer.setCollisionByProperty({ collides: true });

// 可视化碰撞（调试用）
if (this.physics.world.debugGraphic) {
    terrainLayer.renderDebug(this.physics.world.debugGraphic);
}
```

### 5. 性能优化

#### 对象池
```typescript
class CoinPool {
    private pool: Coin[] = [];
    
    get(): Coin {
        return this.pool.pop() || new Coin(scene, 0, 0);
    }
    
    release(coin: Coin): void {
        coin.setVisible(false);
        coin.setActive(false);
        this.pool.push(coin);
    }
}
```

#### 视锥剔除
```typescript
// 只更新可见范围内的对象
const camera = this.cameras.main;
objects.forEach(obj => {
    const inView = camera.worldView.contains(obj.x, obj.y);
    obj.setActive(inView);
});
```

### 6. 自定义属性
```typescript
// 在Tiled中设置自定义属性
{
    "name": "frog",
    "type": "enemy",
    "properties": {
        "health": 2,
        "speed": 100,
        "aggressive": true,
        "patrolRadius": 150
    }
}

// 在代码中读取
const health = obj.properties?.health || 1;
const speed = obj.properties?.speed || 80;
```

### 7. 地图验证
```typescript
private validateMap(): boolean {
    const required = ['player', 'flag'];
    const found = new Set();
    
    objectLayer.objects.forEach(obj => {
        found.add(obj.name);
        
        // 检查对象位置
        if (obj.y > this.map.heightInPixels) {
            console.warn(`对象 ${obj.name} 在地图外`);
        }
    });
    
    // 确保必需对象存在
    return required.every(name => found.has(name));
}
```

## 开发最佳实践

### 1. 物理调试
```typescript
// 开启调试模式查看碰撞体
this.physics.world.createDebugGraphic();
this.physics.world.debugGraphic.visible = true;
```

### 2. 对象生命周期
```typescript
class GameObject extends Phaser.Physics.Arcade.Sprite {
    create(): void { /* 初始化 */ }
    update(time: number, delta: number): void { /* 每帧更新 */ }
    destroy(): void {
        // 清理资源
        this.removeAllListeners();
        super.destroy();
    }
}
```

### 3. 事件系统
```typescript
// 发送事件
this.scene.events.emit('coinCollected', { value: 10 });

// 监听事件
this.scene.events.on('coinCollected', (data) => {
    this.updateScore(data.value);
});
```

### 4. 状态管理
```typescript
enum PlayerState {
    IDLE,
    RUNNING,
    JUMPING,
    WALL_SLIDING,
    CHARGING
}

class Player {
    private state: PlayerState = PlayerState.IDLE;
    
    private updateState(): void {
        if (this.body.velocity.x !== 0) {
            this.state = PlayerState.RUNNING;
        }
        // ... 其他状态判断
    }
}
```

## 碰撞检测与防卡墙系统

### 防卡墙机制实现

当角色因为物理碰撞或其他原因卡在墙体内部时，需要自动推出系统：

```typescript
// 检查并修复卡墙问题
private checkAndFixWallStuck(): void {
    const gameScene = this.scene as any;
    const tilemapLayer = gameScene.platforms; // 地形碰撞层
    
    if (!tilemapLayer) return;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    // 获取玩家的边界框
    const playerBounds = {
        left: this.x - body.width / 2,
        right: this.x + body.width / 2,
        top: this.y - body.height / 2,
        bottom: this.y + body.height / 2
    };
    
    // 转换为tile坐标
    const tileSize = 32;
    const leftTile = Math.floor(playerBounds.left / tileSize);
    const rightTile = Math.floor(playerBounds.right / tileSize);
    const topTile = Math.floor(playerBounds.top / tileSize);
    const bottomTile = Math.floor(playerBounds.bottom / tileSize);
    
    // 检查周围的tiles
    let pushX = 0;
    let pushY = 0;
    let stuckCount = 0;
    
    for (let y = topTile; y <= bottomTile; y++) {
        for (let x = leftTile; x <= rightTile; x++) {
            const tile = tilemapLayer.getTileAt(x, y);
            
            if (tile && tile.collides) {
                stuckCount++;
                
                // 计算推出方向
                const tileCenterX = tile.pixelX + tileSize / 2;
                const tileCenterY = tile.pixelY + tileSize / 2;
                const dx = this.x - tileCenterX;
                const dy = this.y - tileCenterY;
                
                // 计算重叠区域
                const overlapX = (body.width / 2 + tileSize / 2) - Math.abs(dx);
                const overlapY = (body.height / 2 + tileSize / 2) - Math.abs(dy);
                
                // 选择最小的推出距离
                if (overlapX > 0 && overlapY > 0) {
                    if (overlapX < overlapY) {
                        pushX += dx > 0 ? overlapX : -overlapX;
                    } else {
                        pushY += dy > 0 ? overlapY : -overlapY;
                    }
                }
            }
        }
    }
    
    // 应用推出力
    if (stuckCount > 0 && (pushX !== 0 || pushY !== 0)) {
        const maxPush = 5; // 限制推出速度
        pushX = Phaser.Math.Clamp(pushX, -maxPush, maxPush);
        pushY = Phaser.Math.Clamp(pushY, -maxPush, maxPush);
        
        this.x += pushX;
        this.y += pushY;
        
        // 严重卡墙时重置速度
        if (Math.abs(pushX) > 3 || Math.abs(pushY) > 3) {
            body.setVelocity(pushX * 10, pushY * 10);
        }
    }
}
```

### 关键设计要点

1. **检测时机**：在每帧`update()`开始时检测
2. **推出策略**：选择最短推出距离，避免瞬移
3. **速度限制**：限制推出速度为5像素/帧，保持平滑
4. **速度重置**：严重卡墙时重置速度，确保能够脱离

## 配置化管理最佳实践

### 集中配置系统

所有游戏常量都应该集中在配置文件中管理：

```typescript
// src/game/config/AssetConfig.ts

// 对象类型配置
export const OBJECT_TYPES = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    COLLECTIBLE: 'collectible',
    HAZARD: 'hazard',
    GOAL: 'goal'
} as const;

// 图层配置
export const TILEMAP_LAYERS = {
    TERRAIN: 'Level1',      // 地形图层
    OBJECTS: 'Objects',     // 对象图层
    BACKGROUND: 'Background', // 背景图层
    FOREGROUND: 'Foreground'  // 前景图层
} as const;

// 碰撞瓷砖配置
export const COLLISION_TILES = {
    TERRAIN_TILES: [1, 2]  // 可碰撞的地形瓷砖ID
} as const;
```

### 使用配置的优势

1. **易于维护**：所有常量在一处定义
2. **类型安全**：TypeScript自动推断类型
3. **避免魔法数字**：代码更易读
4. **统一管理**：便于批量修改

### 在代码中使用

```typescript
// 使用图层配置
const layer = this.map.createLayer(TILEMAP_LAYERS.TERRAIN, allTilesets);
layer.setCollision(COLLISION_TILES.TERRAIN_TILES);

// 使用对象类型配置
if (obj.type === OBJECT_TYPES.ENEMY) {
    // 处理敌人对象
}

// 获取对象层
const objectLayer = this.map?.getObjectLayer(TILEMAP_LAYERS.OBJECTS);
```

## 总结

每个游戏对象都经过精心设计，物理特性服务于游戏体验。通过以下最佳实践确保游戏质量：

1. **配置化管理**：所有常量集中配置，提高可维护性
2. **防卡墙系统**：自动检测并修复角色卡墙问题
3. **图层分离**：明确区分地形层、对象层等不同功能
4. **类型安全**：充分利用TypeScript的类型系统

通过Tilemap的对象层，可以灵活配置关卡，实现不同的游戏挑战。开发时注意坐标转换、碰撞设置和性能优化，确保游戏运行流畅。