# Phaser.js 开发技巧与最佳实践

## 🎮 物理引擎优化

### Arcade Physics 性能调优

```typescript
// 设置物理引擎配置
const config = {
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false,  // 生产环境关闭调试
            fps: 60,       // 物理更新频率
            timeScale: 1,  // 时间缩放
            overlapBias: 4 // 重叠偏差
        }
    }
};
```

### 碰撞优化

```typescript
// 使用静态组来管理不移动的对象
const staticGroup = this.physics.add.staticGroup();

// 只在需要时更新静态组
staticGroup.refresh(); // 当静态对象改变位置后调用

// 使用四叉树优化碰撞检测
this.physics.world.setBounds(0, 0, width, height, true, true, true, true);
this.physics.world.setBoundsCollision(true, true, false, true);
```

## 🏃 角色控制最佳实践

### 平滑移动

```typescript
class Player {
    private velocityX: number = 0;
    private acceleration: number = 600;
    private friction: number = 400;
    private maxSpeed: number = 200;
    
    update(delta: number): void {
        const deltaSeconds = delta / 1000;
        
        if (this.cursors.left.isDown) {
            this.velocityX -= this.acceleration * deltaSeconds;
        } else if (this.cursors.right.isDown) {
            this.velocityX += this.acceleration * deltaSeconds;
        } else {
            // 应用摩擦力
            if (this.velocityX > 0) {
                this.velocityX = Math.max(0, this.velocityX - this.friction * deltaSeconds);
            } else {
                this.velocityX = Math.min(0, this.velocityX + this.friction * deltaSeconds);
            }
        }
        
        // 限制最大速度
        this.velocityX = Phaser.Math.Clamp(this.velocityX, -this.maxSpeed, this.maxSpeed);
        this.setVelocityX(this.velocityX);
    }
}
```

### 土狼时间（Coyote Time）

让玩家在离开平台后仍有短暂时间可以跳跃：

```typescript
class Player {
    private coyoteTime: number = 100; // 毫秒
    private lastGroundedTime: number = 0;
    
    update(): void {
        const onGround = this.body.blocked.down;
        
        if (onGround) {
            this.lastGroundedTime = this.scene.time.now;
        }
        
        const canJump = onGround || 
            (this.scene.time.now - this.lastGroundedTime < this.coyoteTime);
        
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && canJump) {
            this.jump();
        }
    }
}
```

### 跳跃缓冲（Jump Buffering）

记录玩家在落地前按下的跳跃输入：

```typescript
class Player {
    private jumpBufferTime: number = 100; // 毫秒
    private lastJumpPressTime: number = 0;
    
    update(): void {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.lastJumpPressTime = this.scene.time.now;
        }
        
        const jumpBuffered = this.scene.time.now - this.lastJumpPressTime < this.jumpBufferTime;
        
        if (this.body.blocked.down && jumpBuffered) {
            this.jump();
            this.lastJumpPressTime = 0; // 清除缓冲
        }
    }
}
```

## 🗺️ Tilemap 优化技巧

### 动态加载瓷砖

```typescript
// 只渲染可见区域的瓷砖
const camera = this.cameras.main;
layer.setCullPadding(2, 2); // 设置剔除边距

// 使用多个图层分离渲染
const backgroundLayer = map.createLayer('Background', tileset);
const terrainLayer = map.createLayer('Terrain', tileset);
const foregroundLayer = map.createLayer('Foreground', tileset);

// 设置图层深度
backgroundLayer.setDepth(-1);
terrainLayer.setDepth(0);
foregroundLayer.setDepth(1);
```

### 瓷砖属性系统

```typescript
// 在Tiled中设置自定义属性，在Phaser中读取
const tile = layer.getTileAt(x, y);
if (tile && tile.properties.slippery) {
    player.friction = 0.1;
}

// 批量设置碰撞
layer.setCollisionByProperty({ collides: true });
layer.setCollisionBetween(1, 10); // 设置ID范围
layer.setCollisionByExclusion([0]); // 除了0以外都碰撞
```

## 🎨 动画系统优化

### 动画状态机

```typescript
class AnimationController {
    private currentState: string = 'idle';
    private states: Map<string, () => void> = new Map();
    
    constructor(private sprite: Phaser.GameObjects.Sprite) {
        this.setupStates();
    }
    
    private setupStates(): void {
        this.states.set('idle', () => {
            this.sprite.play('player-idle', true);
        });
        
        this.states.set('walk', () => {
            this.sprite.play('player-walk', true);
        });
        
        this.states.set('jump', () => {
            this.sprite.play('player-jump', true);
        });
    }
    
    setState(state: string): void {
        if (state !== this.currentState && this.states.has(state)) {
            this.currentState = state;
            this.states.get(state)!();
        }
    }
}
```

### 动画混合

```typescript
// 创建过渡动画
this.anims.create({
    key: 'idle-to-walk',
    frames: [
        { key: 'player', frame: 'idle/frame0003' },
        { key: 'player', frame: 'walk/frame0000' }
    ],
    frameRate: 20,
    duration: 100
});

// 使用动画事件
sprite.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
    if (anim.key === 'idle-to-walk') {
        sprite.play('walk');
    }
});
```

## 🎯 性能优化

### 对象池

```typescript
class ObjectPool<T extends Phaser.GameObjects.GameObject> {
    private pool: T[] = [];
    private createFn: () => T;
    
    constructor(createFn: () => T, initialSize: number = 10) {
        this.createFn = createFn;
        for (let i = 0; i < initialSize; i++) {
            const obj = createFn();
            obj.setActive(false).setVisible(false);
            this.pool.push(obj);
        }
    }
    
    get(): T {
        let obj = this.pool.find(o => !o.active);
        if (!obj) {
            obj = this.createFn();
        }
        return obj.setActive(true).setVisible(true);
    }
    
    release(obj: T): void {
        obj.setActive(false).setVisible(false);
    }
}

// 使用示例
const bulletPool = new ObjectPool(() => 
    this.physics.add.sprite(0, 0, 'bullet')
);
```

### 纹理图集优化

```typescript
// 使用纹理图集减少绘制调用
this.load.atlas('sprites', 'sprites.png', 'sprites.json');

// 预加载常用纹理
this.textures.addBase64('star', starBase64);

// 使用压缩纹理格式
this.load.image('background', 'bg.jpg'); // JPEG for photos
this.load.image('sprite', 'sprite.png');  // PNG for transparency
```

### 场景管理

```typescript
// 预加载场景但不启动
this.scene.add('GameScene', GameScene, false);

// 并行运行场景
this.scene.launch('UIScene'); // UI层
this.scene.launch('GameScene'); // 游戏层

// 场景间通信
this.scene.get('UIScene').events.emit('updateScore', score);

// 清理场景
this.events.on('shutdown', () => {
    // 清理事件监听器
    this.events.off('updateScore');
    // 清理定时器
    this.time.removeAllEvents();
});
```

## 🐛 调试技巧

### 物理调试

```typescript
// 开启物理调试
this.physics.world.createDebugGraphic();

// 自定义调试渲染
this.physics.world.debugGraphic.clear();
this.physics.world.debugGraphic.lineStyle(2, 0x00ff00);
this.physics.world.debugGraphic.strokeRect(
    body.x, body.y, body.width, body.height
);

// 显示FPS
this.add.text(10, 10, '', { color: '#00ff00' })
    .setScrollFactor(0)
    .setDepth(1000)
    .setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
```

### 性能监控

```typescript
// 监控更新时间
let lastTime = 0;
this.events.on('update', (time: number) => {
    const delta = time - lastTime;
    if (delta > 20) { // 超过20ms警告
        console.warn(`Slow frame: ${delta}ms`);
    }
    lastTime = time;
});

// 内存监控
console.log('Textures:', this.textures.list.size);
console.log('Sounds:', this.sound.sounds.length);
console.log('GameObjects:', this.children.list.length);
```

## 🎮 输入处理

### 多键位支持

```typescript
// 支持多个键位
const keys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
    altJump: Phaser.Input.Keyboard.KeyCodes.UP
});

// 检查多个键
if (keys.jump.isDown || keys.altJump.isDown) {
    this.player.jump();
}
```

### 手柄支持

```typescript
// 检测手柄
this.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
    this.gamepad = pad;
});

// 使用手柄
if (this.gamepad) {
    // 左摇杆
    const leftStickX = this.gamepad.leftStick.x;
    if (Math.abs(leftStickX) > 0.1) { // 死区
        this.player.setVelocityX(leftStickX * 200);
    }
    
    // 按钮
    if (this.gamepad.A) {
        this.player.jump();
    }
}
```

## 🔧 常用工具函数

### 数学工具

```typescript
// 线性插值
function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

// 平滑阻尼
function smoothDamp(
    current: number,
    target: number,
    velocity: { value: number },
    smoothTime: number,
    maxSpeed: number,
    deltaTime: number
): number {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const originalTarget = target;
    const maxChange = maxSpeed * smoothTime;
    change = Phaser.Math.Clamp(change, -maxChange, maxChange);
    target = current - change;
    const temp = (velocity.value + omega * change) * deltaTime;
    velocity.value = (velocity.value - omega * temp) * exp;
    let output = target + (change + temp) * exp;
    if (originalTarget - current > 0 === output > originalTarget) {
        output = originalTarget;
        velocity.value = (output - originalTarget) / deltaTime;
    }
    return output;
}
```

### 碰撞检测

```typescript
// 圆形碰撞检测
function circleCollision(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
}

// 射线检测
function rayCast(
    scene: Phaser.Scene,
    x1: number, y1: number,
    x2: number, y2: number,
    layer: Phaser.Tilemaps.TilemapLayer
): Phaser.Math.Vector2 | null {
    const line = new Phaser.Geom.Line(x1, y1, x2, y2);
    const tiles = layer.getTilesWithinShape(line);
    
    for (const tile of tiles) {
        if (tile.collides) {
            const tileBounds = tile.getBounds();
            const intersection = Phaser.Geom.Intersects.LineToRectangle(
                line, tileBounds
            );
            if (intersection) {
                return new Phaser.Math.Vector2(tile.pixelX, tile.pixelY);
            }
        }
    }
    return null;
}
```

## 📝 总结

这些技巧和最佳实践可以帮助你：

1. **提升游戏手感**：通过土狼时间、跳跃缓冲等机制
2. **优化性能**：使用对象池、纹理图集等技术
3. **改善代码结构**：通过状态机、配置化等模式
4. **方便调试**：使用调试工具和监控

根据项目需求选择合适的技术，不要过度优化。先实现功能，再根据性能瓶颈进行针对性优化。