# 游戏世界设置经验

## 世界大小设置

### 基于 Tilemap 的动态世界大小

在 Phaser 3 中设置游戏世界大小时，最佳实践是根据 tilemap 的实际大小来动态设置，而不是使用硬编码的值。

```typescript
// 获取地图的实际像素大小
const mapWidth = this.map.widthInPixels;
const mapHeight = this.map.heightInPixels;

// 设置相机边界
this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

// 设置物理世界边界
// 参数：x, y, width, height, checkLeft, checkRight, checkUp, checkDown
this.physics.world.setBounds(0, 0, mapWidth, mapHeight, true, true, true, false);
```

### 关键点说明

1. **动态计算**：使用 `map.widthInPixels` 和 `map.heightInPixels` 可以自动适应不同大小的地图，无需手动修改代码。

2. **相机边界**：`setBounds()` 限制相机的移动范围，防止显示地图外的空白区域。

3. **物理边界**：
   - 前四个参数定义边界的位置和大小
   - 后四个布尔参数控制四个方向的碰撞检测
   - 设置为 `true, true, true, false` 表示：
     - 左边界有碰撞（防止走出地图左边）
     - 右边界有碰撞（防止走出地图右边）
     - 上边界有碰撞（防止跳出地图顶部）
     - 下边界无碰撞（允许掉落到地图底部）

### 实现位置

这些设置应该在场景的 `create()` 方法中，在创建完 tilemap 之后立即设置：

```typescript
create() {
    // 创建 tilemap
    this.map = this.make.tilemap({ key: 'level1' });
    
    // ... 创建图层等
    
    // 设置世界边界
    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight, true, true, true, false);
}
```

### 优势

1. **可维护性**：更改地图大小时无需修改代码
2. **一致性**：确保相机和物理边界始终与地图大小匹配
3. **灵活性**：支持不同大小的关卡，无需为每个关卡单独配置

## 相关配置

- 相机跟随设置：`this.cameras.main.startFollow(this.player)`
- 玩家出生位置：应根据地图设计在 tilemap 的对象层中配置