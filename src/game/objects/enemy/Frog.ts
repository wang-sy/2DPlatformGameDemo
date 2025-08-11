import { Scene, Physics } from 'phaser';
import { ASSET_KEYS } from '../../config/AssetConfig';

export class Frog extends Physics.Arcade.Sprite {
    private moveSpeed: number = 50;
    private jumpForce: number = -250;
    private jumpCooldown: number = 2000;
    private lastJumpTime: number = 0;
    private direction: number = 1; // 1 = right, -1 = left
    private patrolDistance: number = 150;
    private startX: number;
    private isResting: boolean = false;
    private canDamage: boolean = true;
    private damageAmount: number = 1;
    private damageCooldown: number = 1000;
    
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, ASSET_KEYS.ATLASES.FROG, 'idle/frame0000');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(1);
        this.setBounce(0.2);
        this.setCollideWorldBounds(true);
        
        // 设置碰撞盒
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(40, 40);
        body.setOffset(12, 20);
        
        this.startX = x;
        
        // 创建动画
        this.createAnimations();
        if (this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.FROG.IDLE)) {
            this.play(ASSET_KEYS.ANIMATIONS.FROG.IDLE);
        }
        
        // 开始AI行为
        this.startPatrol();
    }
    
    private createAnimations(): void {
        try {
            if (!this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.FROG.IDLE)) {
                this.scene.anims.create({
                    key: ASSET_KEYS.ANIMATIONS.FROG.IDLE,
                    frames: this.scene.anims.generateFrameNames(ASSET_KEYS.ATLASES.FROG, {
                        prefix: 'idle/frame',
                        suffix: '',
                        start: 0,
                        end: 0,
                        zeroPad: 4
                    }),
                    frameRate: 10,
                    repeat: -1
                });
            }
            
            if (!this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.FROG.JUMP)) {
                this.scene.anims.create({
                    key: ASSET_KEYS.ANIMATIONS.FROG.JUMP,
                    frames: this.scene.anims.generateFrameNames(ASSET_KEYS.ATLASES.FROG, {
                        prefix: 'jump/frame',
                        suffix: '',
                        start: 0,
                        end: 0,
                        zeroPad: 4
                    }),
                    frameRate: 10
                });
            }
            
            if (!this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.FROG.REST)) {
                this.scene.anims.create({
                    key: ASSET_KEYS.ANIMATIONS.FROG.REST,
                    frames: this.scene.anims.generateFrameNames(ASSET_KEYS.ATLASES.FROG, {
                        prefix: 'rest/frame',
                        suffix: '',
                        start: 0,
                        end: 0,
                        zeroPad: 4
                    }),
                    frameRate: 10
                });
            }
        } catch (error) {
            console.error('Failed to create frog animations:', error);
        }
    }
    
    private startPatrol(): void {
        // 定期跳跃巡逻
        this.scene.time.addEvent({
            delay: this.jumpCooldown,
            callback: () => {
                if (!this.isResting && this.active) {
                    this.jump();
                }
            },
            loop: true
        });
        
        // 偶尔休息
        this.scene.time.addEvent({
            delay: 5000,
            callback: () => {
                if (this.active && Phaser.Math.Between(0, 1) === 1) {
                    this.rest();
                }
            },
            loop: true
        });
    }
    
    private jump(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        if (body.blocked.down) {
            // 检查是否需要转向
            if (Math.abs(this.x - this.startX) > this.patrolDistance) {
                this.direction *= -1;
            }
            
            // 执行跳跃
            this.setVelocityY(this.jumpForce);
            this.setVelocityX(this.moveSpeed * this.direction);
            this.setFlipX(this.direction < 0);
            
            // 播放跳跃动画（带安全检查）
            if (this.scene && this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.FROG.JUMP)) {
                this.play(ASSET_KEYS.ANIMATIONS.FROG.JUMP);
            }
            
            // 跳跃后恢复idle动画
            this.scene.time.delayedCall(500, () => {
                if (this.active && this.scene && this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.FROG.IDLE)) {
                    this.play(ASSET_KEYS.ANIMATIONS.FROG.IDLE);
                }
            });
        }
    }
    
    private rest(): void {
        this.isResting = true;
        this.setVelocity(0, 0);
        
        // 播放休息动画（带安全检查）
        if (this.scene && this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.FROG.REST)) {
            this.play(ASSET_KEYS.ANIMATIONS.FROG.REST);
        }
        
        // 休息3秒
        this.scene.time.delayedCall(3000, () => {
            this.isResting = false;
            if (this.scene && this.scene.anims.exists(ASSET_KEYS.ANIMATIONS.FROG.IDLE)) {
                this.play(ASSET_KEYS.ANIMATIONS.FROG.IDLE);
            }
        });
    }
    
    update(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // 落地后停止水平移动
        if (body.blocked.down && !this.isResting) {
            this.setVelocityX(0);
        }
        
        // 检测玩家（用于更智能的AI）
        const player = this.scene.children.getByName('player');
        if (player) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            
            // 如果玩家靠近，朝向玩家跳跃
            if (distance < 200 && body.blocked.down && !this.isResting) {
                const currentTime = this.scene.time.now;
                if (currentTime - this.lastJumpTime > this.jumpCooldown) {
                    this.lastJumpTime = currentTime;
                    
                    // 朝向玩家
                    this.direction = player.x > this.x ? 1 : -1;
                    this.jump();
                }
            }
        }
    }
    
    getDamageAmount(): number {
        return this.damageAmount;
    }
    
    canDealDamage(): boolean {
        return this.canDamage;
    }
    
    onPlayerHit(): void {
        if (this.canDamage) {
            this.canDamage = false;
            
            // 视觉反馈
            this.setTint(0xff0000);
            
            // 冷却后恢复
            this.scene.time.delayedCall(this.damageCooldown, () => {
                this.canDamage = true;
                this.clearTint();
            });
        }
    }
    
    takeDamage(): void {
        // 被玩家踩到时死亡
        this.setTint(0x000000);
        this.body!.enable = false;
        
        // 死亡动画
        this.scene.tweens.add({
            targets: this,
            scale: 0,
            angle: 720,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // 创建死亡粒子效果
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-20, 20),
                this.y + Phaser.Math.Between(-20, 20),
                5,
                0x00ff00
            );
            
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 50,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}