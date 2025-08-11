import { Scene, Physics } from 'phaser';
import { ASSET_KEYS } from '../../config/AssetConfig';

export class Key extends Physics.Arcade.Sprite {
    private collected: boolean = false;
    private originalY: number;
    
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, ASSET_KEYS.IMAGES.KEY);
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body
        
        this.setScale(0.8);
        this.originalY = y;
        
        // 调整碰撞盒
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(50, 50);
        body.setOffset(7, 7);
        
        // 添加动画效果
        this.createIdleAnimation();
        
        // 添加发光效果
        this.createGlowEffect();
    }
    
    private createIdleAnimation(): void {
        // 上下浮动
        this.scene.tweens.add({
            targets: this,
            y: this.originalY - 15,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 轻微旋转
        this.scene.tweens.add({
            targets: this,
            angle: 15,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    private createGlowEffect(): void {
        // 创建光环效果
        const glow = this.scene.add.circle(this.x, this.y, 40, 0x00ff00, 0.2);
        
        // 光环动画
        this.scene.tweens.add({
            targets: glow,
            scale: { from: 1, to: 1.5 },
            alpha: { from: 0.2, to: 0 },
            duration: 1500,
            repeat: -1,
            ease: 'Power2'
        });
        
        // 让光环跟随钥匙
        this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                if (glow && this.active) {
                    glow.x = this.x;
                    glow.y = this.y;
                } else if (glow) {
                    glow.destroy();
                }
            },
            repeat: -1
        });
    }
    
    collect(): void {
        if (this.collected) return;
        
        this.collected = true;
        
        // 停止所有动画
        this.scene.tweens.killTweensOf(this);
        
        // 收集动画
        this.scene.tweens.add({
            targets: this,
            y: this.y - 80,
            scale: 2,
            angle: 360,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // 创建收集特效
        this.createCollectEffect();
    }
    
    private createCollectEffect(): void {
        // 创建圆形扩散效果
        const circle = this.scene.add.circle(this.x, this.y, 10, 0x00ff00, 0.8);
        
        this.scene.tweens.add({
            targets: circle,
            scale: 5,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                circle.destroy();
            }
        });
        
        // 创建星星粒子
        for (let i = 0; i < 12; i++) {
            const star = this.scene.add.star(
                this.x,
                this.y,
                5,
                4,
                8,
                0x00ff00
            );
            
            star.setScale(0.5);
            
            const angle = (Math.PI * 2 * i) / 12;
            const distance = 80;
            
            this.scene.tweens.add({
                targets: star,
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                scale: 0,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                delay: i * 30,
                onComplete: () => {
                    star.destroy();
                }
            });
        }
        
        // 显示"Key Collected!"文字
        const text = this.scene.add.text(this.x, this.y - 30, 'KEY COLLECTED!', {
            fontSize: '28px',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        text.setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 50,
            scale: 1.5,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }
    
    isCollected(): boolean {
        return this.collected;
    }
}