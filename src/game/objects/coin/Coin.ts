import { Scene, Physics } from 'phaser';

export class Coin extends Physics.Arcade.Sprite {
    private collected: boolean = false;
    private value: number = 1;
    private originalY: number;
    
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'coin');
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body
        
        this.setScale(0.8);
        this.originalY = y;
        
        // 调整碰撞盒
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(40, 40);
        body.setOffset(12, 12);
        
        // 添加旋转和浮动动画
        this.createIdleAnimation();
    }
    
    private createIdleAnimation(): void {
        // 旋转动画
        this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // 上下浮动
        this.scene.tweens.add({
            targets: this,
            y: this.originalY - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 闪光效果
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
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
            y: this.y - 50,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // 创建收集特效
        this.createCollectEffect();
        
        // 播放音效（如果有的话）
        // this.scene.sound.play('coin_collect');
    }
    
    private createCollectEffect(): void {
        // 创建星星粒子效果
        for (let i = 0; i < 8; i++) {
            const star = this.scene.add.star(
                this.x,
                this.y,
                5,
                3,
                6,
                0xffff00
            );
            
            star.setScale(0.3);
            
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 50;
            
            this.scene.tweens.add({
                targets: star,
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                scale: 0,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => {
                    star.destroy();
                }
            });
        }
        
        // 创建"+1"文字效果
        const scoreText = this.scene.add.text(this.x, this.y - 20, '+1', {
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        scoreText.setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: scoreText,
            y: scoreText.y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                scoreText.destroy();
            }
        });
    }
    
    getValue(): number {
        return this.value;
    }
    
    isCollected(): boolean {
        return this.collected;
    }
}