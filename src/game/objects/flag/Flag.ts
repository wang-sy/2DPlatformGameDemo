import { Scene, Physics } from 'phaser';

export class Flag extends Physics.Arcade.Sprite {
    private isActivated: boolean = false;
    private originalY: number;
    
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'flag');
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body
        
        this.setOrigin(0.5, 1); // 底部中心为原点
        this.originalY = y;
        
        // 调整碰撞盒
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(40, 60);
        body.setOffset(12, 4);
        
        // 添加飘动动画
        this.createFloatingAnimation();
    }
    
    private createFloatingAnimation(): void {
        this.scene.tweens.add({
            targets: this,
            y: this.originalY - 5,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // 轻微的左右摆动
        this.scene.tweens.add({
            targets: this,
            angle: -3,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    activate(): void {
        if (this.isActivated) return;
        
        this.isActivated = true;
        
        // 停止飘动动画
        this.scene.tweens.killTweensOf(this);
        
        // 胜利动画
        this.setTint(0xffff00); // 变成金色
        
        // 旋转和放大效果
        this.scene.tweens.add({
            targets: this,
            scale: 1.5,
            angle: 360,
            duration: 1000,
            ease: 'Power2'
        });
        
        // 发光效果
        let glowCount = 0;
        const glowTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                this.setTint(glowCount % 2 === 0 ? 0xffffff : 0xffff00);
                glowCount++;
            },
            repeat: 10
        });
        
        // 创建星星粒子效果
        this.createVictoryParticles();
    }
    
    private createVictoryParticles(): void {
        // 创建多个星星粒子
        for (let i = 0; i < 20; i++) {
            const star = this.scene.add.star(
                this.x + Phaser.Math.Between(-30, 30),
                this.y - Phaser.Math.Between(20, 60),
                5,
                5,
                10,
                0xffff00
            );
            
            star.setScale(0.5);
            
            // 星星飞散动画
            this.scene.tweens.add({
                targets: star,
                x: star.x + Phaser.Math.Between(-100, 100),
                y: star.y - Phaser.Math.Between(50, 150),
                scale: 0,
                alpha: 0,
                duration: 1500,
                ease: 'Power2',
                delay: i * 50,
                onComplete: () => {
                    star.destroy();
                }
            });
        }
    }
    
    isReached(): boolean {
        return this.isActivated;
    }
}