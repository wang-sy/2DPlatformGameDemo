import { Scene, Physics } from 'phaser';

export class Spike extends Physics.Arcade.Sprite {
    private canDamage: boolean = true;
    private damageAmount: number = 1;
    private damageCooldown: number = 1000; // 1秒冷却时间

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'spikes');
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body
        
        this.setOrigin(0.5, 0.5);
        
        // 调整碰撞盒大小，让它更贴合尖刺的形状
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(50, 30);
        body.setOffset(7, 34);
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
            
            // 视觉反馈 - 尖刺变红
            this.setTint(0xff0000);
            
            // 冷却后恢复
            this.scene.time.delayedCall(this.damageCooldown, () => {
                this.canDamage = true;
                this.clearTint();
            });
        }
    }
}