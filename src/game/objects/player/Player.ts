import { Scene, Physics } from 'phaser';
import { ASSET_KEYS, TILEMAP_LAYERS } from '../../config/AssetConfig';

export class Player extends Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private jumpCount: number = 0;
    private maxJumps: number = 2;
    private isJumping: boolean = false;
    private health: number = 3;
    private maxHealth: number = 3;
    private isInvulnerable: boolean = false;
    private invulnerabilityDuration: number = 1500; // 1.5秒无敌时间
    
    // 抓墙跳相关
    private isWallSliding: boolean = false;
    private canWallJump: boolean = false;
    private wallJumpDirection: number = 0;
    private wallSlideSpeed: number = 50;
    private wallJumpForce: number = 250;
    private wallJumpUpForce: number = -380;
    
    // 蓄力跳相关
    private isCharging: boolean = false;
    private chargeStartTime: number = 0;
    private maxChargeTime: number = 1000; // 最大蓄力1秒
    private minJumpForce: number = -400;
    private maxJumpForce: number = -600;
    private chargeBar: Phaser.GameObjects.Rectangle | null = null;
    private chargeBarBg: Phaser.GameObjects.Rectangle | null = null;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, ASSET_KEYS.ATLASES.PLAYER, 'idle/frame0000');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.5);
        this.setBounce(0.2);
        this.setCollideWorldBounds(true);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(50, 80);
        body.setOffset(39, 35);
        
        this.cursors = scene.input.keyboard!.createCursorKeys();
        
        this.createAnimations();
        this.play(ASSET_KEYS.ANIMATIONS.PLAYER.IDLE);
        
        // 创建蓄力条（初始隐藏）
        this.createChargeBar();
    }

    private createAnimations(): void {
        if (!this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.PLAYER.IDLE)) {
            this.scene.anims.create({
                key: ASSET_KEYS.ANIMATIONS.PLAYER.IDLE,
                frames: [{ key: ASSET_KEYS.ATLASES.PLAYER, frame: 'idle/frame0000' }],
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.PLAYER.WALK)) {
            this.scene.anims.create({
                key: ASSET_KEYS.ANIMATIONS.PLAYER.WALK,
                frames: [
                    { key: ASSET_KEYS.ATLASES.PLAYER, frame: 'walk/frame0000' },
                    { key: ASSET_KEYS.ATLASES.PLAYER, frame: 'walk/frame0001' }
                ],
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.PLAYER.JUMP)) {
            this.scene.anims.create({
                key: ASSET_KEYS.ANIMATIONS.PLAYER.JUMP,
                frames: [{ key: ASSET_KEYS.ATLASES.PLAYER, frame: 'jump/frame0000' }],
                frameRate: 10
            });
        }

        if (!this.scene.anims.exists('player-duck')) {
            this.scene.anims.create({
                key: 'player-duck',
                frames: [{ key: ASSET_KEYS.ATLASES.PLAYER, frame: 'duck/frame0000' }],
                frameRate: 10
            });
        }

        if (!this.scene.anims.exists('player-climb')) {
            this.scene.anims.create({
                key: 'player-climb',
                frames: [
                    { key: ASSET_KEYS.ATLASES.PLAYER, frame: 'climb/frame0000' },
                    { key: ASSET_KEYS.ATLASES.PLAYER, frame: 'climb/frame0001' }
                ],
                frameRate: 10,
                repeat: -1
            });
        }
    }

    update(): void {
        const speed = 200;
        const body = this.body as Phaser.Physics.Arcade.Body;
        const onGround = body.blocked.down;
        const touchingLeft = body.blocked.left;
        const touchingRight = body.blocked.right;
        
        // 检查并修复卡墙问题
        this.checkAndFixWallStuck();
        
        // 检测抓墙状态
        this.checkWallSlide(onGround, touchingLeft, touchingRight);
        
        // 重置跳跃次数
        if (onGround || this.isWallSliding) {
            this.jumpCount = 0;
            this.isJumping = false;
        }
        
        // 左右移动
        if (!this.canWallJump) {
            if (this.cursors.left.isDown) {
                this.setVelocityX(-speed);
                this.setFlipX(true);
                if (onGround && !this.cursors.down.isDown && !this.isCharging) {
                    this.play(ASSET_KEYS.ANIMATIONS.PLAYER.WALK, true);
                }
            } else if (this.cursors.right.isDown) {
                this.setVelocityX(speed);
                this.setFlipX(false);
                if (onGround && !this.cursors.down.isDown && !this.isCharging) {
                    this.play(ASSET_KEYS.ANIMATIONS.PLAYER.WALK, true);
                }
            } else {
                this.setVelocityX(0);
                if (onGround && !this.cursors.down.isDown && !this.isCharging) {
                    this.play(ASSET_KEYS.ANIMATIONS.PLAYER.IDLE, true);
                }
            }
        }
        
        // 下蹲
        if (this.cursors.down.isDown && onGround && !this.isCharging) {
            this.play('player-duck', true);
            this.setVelocityX(0);
        }
        
        // 抓墙滑行
        if (this.isWallSliding) {
            this.setVelocityY(Math.min(this.wallSlideSpeed, body.velocity.y));
            this.play('player-climb', true);
        }
        
        // 跳跃处理（普通跳、墙跳、蓄力跳）
        this.handleJump(onGround);
        
        // 更新蓄力条位置
        this.updateChargeBarPosition();
        
        // 空中动画
        if (!onGround && !this.isWallSliding && this.isJumping) {
            this.play(ASSET_KEYS.ANIMATIONS.PLAYER.JUMP, true);
        }
    }

    takeDamage(amount: number): void {
        if (this.isInvulnerable || this.health <= 0) {
            return;
        }

        this.health -= amount;
        this.isInvulnerable = true;

        // 受伤动画效果
        this.setTint(0xff0000);
        
        // 闪烁效果
        const blinkTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                this.visible = !this.visible;
            },
            repeat: 14
        });

        // 无敌时间结束
        this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
            this.isInvulnerable = false;
            this.clearTint();
            this.visible = true;
            blinkTimer.remove();
        });

        // 触发受伤事件
        this.emit('damage', this.health);

        // 如果血量为0，触发死亡
        if (this.health <= 0) {
            this.die();
        }
    }

    die(): void {
        this.setTint(0x000000);
        this.setVelocity(0, -200);
        this.body!.enable = false;
        
        this.scene.time.delayedCall(1000, () => {
            this.emit('death');
        });
    }

    getHealth(): number {
        return this.health;
    }

    getMaxHealth(): number {
        return this.maxHealth;
    }

    heal(amount: number): void {
        this.health = Math.min(this.health + amount, this.maxHealth);
        this.emit('heal', this.health);
    }

    // 抓墙检测
    private checkWallSlide(onGround: boolean, touchingLeft: boolean, touchingRight: boolean): void {
        if (onGround) {
            this.isWallSliding = false;
            this.canWallJump = false;
            return;
        }

        const body = this.body as Phaser.Physics.Arcade.Body;
        const movingDown = body.velocity.y > 0;
        
        if ((touchingLeft && this.cursors.left.isDown) || (touchingRight && this.cursors.right.isDown)) {
            if (movingDown) {
                this.isWallSliding = true;
                this.canWallJump = true;
                this.wallJumpDirection = touchingLeft ? 1 : -1;
            }
        } else {
            this.isWallSliding = false;
            // 保持墙跳能力短暂时间
            if (this.canWallJump) {
                this.scene.time.delayedCall(100, () => {
                    this.canWallJump = false;
                });
            }
        }
    }

    // 跳跃处理
    private handleJump(onGround: boolean): void {
        // 按下跳跃键
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            // 墙跳
            if (this.canWallJump && !onGround) {
                this.performWallJump();
            }
            // 地面蓄力跳开始
            else if (onGround && this.cursors.shift?.isDown) {
                this.startChargeJump();
            }
            // 普通跳跃
            else if (this.jumpCount < this.maxJumps) {
                this.performNormalJump();
            }
        }
        
        // 释放跳跃键 - 执行蓄力跳
        if (Phaser.Input.Keyboard.JustUp(this.cursors.up) && this.isCharging) {
            this.releaseChargeJump();
        }
        
        // 更新蓄力状态
        if (this.isCharging) {
            this.updateChargeBar();
        }
    }

    // 普通跳跃
    private performNormalJump(): void {
        this.setVelocityY(this.minJumpForce);
        this.jumpCount++;
        this.isJumping = true;
        this.play(ASSET_KEYS.ANIMATIONS.PLAYER.JUMP, true);
    }

    // 墙跳
    private performWallJump(): void {
        this.setVelocityY(this.wallJumpUpForce);
        this.setVelocityX(this.wallJumpForce * this.wallJumpDirection);
        this.canWallJump = false;
        this.isWallSliding = false;
        this.isJumping = true;
        this.jumpCount = 1;
        this.play(ASSET_KEYS.ANIMATIONS.PLAYER.JUMP, true);
        
        // 短暂禁用左右控制
        this.scene.time.delayedCall(200, () => {
            this.canWallJump = false;
        });
    }

    // 开始蓄力跳
    private startChargeJump(): void {
        this.isCharging = true;
        this.chargeStartTime = this.scene.time.now;
        this.showChargeBar();
        this.setTint(0xffff00); // 黄色充能效果
    }

    // 释放蓄力跳
    private releaseChargeJump(): void {
        const chargeTime = Math.min(this.scene.time.now - this.chargeStartTime, this.maxChargeTime);
        const chargePercent = chargeTime / this.maxChargeTime;
        const jumpForce = this.minJumpForce + (this.maxJumpForce - this.minJumpForce) * chargePercent;
        
        this.setVelocityY(jumpForce);
        this.isCharging = false;
        this.isJumping = true;
        this.jumpCount = 1;
        this.hideChargeBar();
        this.clearTint();
        this.play(ASSET_KEYS.ANIMATIONS.PLAYER.JUMP, true);
        
        // 添加粒子效果
        if (chargePercent > 0.5) {
            this.createJumpEffect();
        }
    }

    // 创建蓄力条
    private createChargeBar(): void {
        this.chargeBarBg = this.scene.add.rectangle(this.x, this.y - 40, 50, 8, 0x333333);
        this.chargeBar = this.scene.add.rectangle(this.x - 25, this.y - 40, 0, 6, 0xffff00);
        this.chargeBarBg.setOrigin(0.5, 0.5);
        this.chargeBar.setOrigin(0, 0.5);
        this.hideChargeBar();
    }

    // 更新蓄力条
    private updateChargeBar(): void {
        if (!this.chargeBar || !this.isCharging) return;
        
        const chargeTime = Math.min(this.scene.time.now - this.chargeStartTime, this.maxChargeTime);
        const chargePercent = chargeTime / this.maxChargeTime;
        this.chargeBar.width = 50 * chargePercent;
        
        // 根据充能程度改变颜色
        if (chargePercent > 0.8) {
            this.chargeBar.setFillStyle(0xff0000); // 红色
        } else if (chargePercent > 0.5) {
            this.chargeBar.setFillStyle(0xffa500); // 橙色
        }
    }

    // 更新蓄力条位置
    private updateChargeBarPosition(): void {
        if (this.chargeBarBg && this.chargeBar) {
            this.chargeBarBg.x = this.x;
            this.chargeBarBg.y = this.y - 40;
            this.chargeBar.x = this.x - 25;
            this.chargeBar.y = this.y - 40;
        }
    }

    // 显示蓄力条
    private showChargeBar(): void {
        if (this.chargeBarBg && this.chargeBar) {
            this.chargeBarBg.setVisible(true);
            this.chargeBar.setVisible(true);
            this.chargeBar.width = 0;
            this.chargeBar.setFillStyle(0xffff00);
        }
    }

    // 隐藏蓄力条
    private hideChargeBar(): void {
        if (this.chargeBarBg && this.chargeBar) {
            this.chargeBarBg.setVisible(false);
            this.chargeBar.setVisible(false);
        }
    }

    // 跳跃特效
    private createJumpEffect(): void {
        const particles = this.scene.add.particles(this.x, this.y + 20, ASSET_KEYS.ATLASES.PLAYER, {
            frame: 'idle/frame0000',
            scale: { start: 0.3, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 300,
            quantity: 5
        });
        
        this.scene.time.delayedCall(500, () => {
            particles.destroy();
        });
    }
    
    // 检查并修复卡墙问题
    private checkAndFixWallStuck(): void {
        // 获取场景中的地形图层
        const gameScene = this.scene as any;
        const tilemapLayer = gameScene.platforms; // 这是地形碰撞层
        
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
        const tileSize = 32; // 假设tile大小为32x32
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
                    
                    // 计算tile的中心
                    const tileCenterX = tile.pixelX + tileSize / 2;
                    const tileCenterY = tile.pixelY + tileSize / 2;
                    
                    // 计算玩家中心到tile中心的向量
                    const dx = this.x - tileCenterX;
                    const dy = this.y - tileCenterY;
                    
                    // 计算重叠区域
                    const overlapX = (body.width / 2 + tileSize / 2) - Math.abs(dx);
                    const overlapY = (body.height / 2 + tileSize / 2) - Math.abs(dy);
                    
                    // 如果有重叠，计算推出方向
                    if (overlapX > 0 && overlapY > 0) {
                        // 选择最小的推出距离
                        if (overlapX < overlapY) {
                            // 水平推出
                            pushX += dx > 0 ? overlapX : -overlapX;
                        } else {
                            // 垂直推出
                            pushY += dy > 0 ? overlapY : -overlapY;
                        }
                    }
                }
            }
        }
        
        // 如果玩家卡在墙里，推出去
        if (stuckCount > 0 && (pushX !== 0 || pushY !== 0)) {
            // 限制推出速度，避免瞬移
            const maxPush = 5;
            pushX = Phaser.Math.Clamp(pushX, -maxPush, maxPush);
            pushY = Phaser.Math.Clamp(pushY, -maxPush, maxPush);
            
            // 应用推出力
            this.x += pushX;
            this.y += pushY;
            
            // 如果推出力很大，说明严重卡墙，重置速度
            if (Math.abs(pushX) > 3 || Math.abs(pushY) > 3) {
                body.setVelocity(pushX * 10, pushY * 10);
            }
        }
    }
}