import { Scene, Physics } from 'phaser';

export class Player extends Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private jumpCount: number = 0;
    private maxJumps: number = 2;
    private isJumping: boolean = false;
    private health: number = 3;
    private maxHealth: number = 3;
    private isInvulnerable: boolean = false;
    private invulnerabilityDuration: number = 1500; // 1.5秒无敌时间

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'player', 'idle/frame0000');
        
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
        this.play('player-idle');
    }

    private createAnimations(): void {
        if (!this.scene.anims.exists('player-idle')) {
            this.scene.anims.create({
                key: 'player-idle',
                frames: [{ key: 'player', frame: 'idle/frame0000' }],
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists('player-walk')) {
            this.scene.anims.create({
                key: 'player-walk',
                frames: [
                    { key: 'player', frame: 'walk/frame0000' },
                    { key: 'player', frame: 'walk/frame0001' }
                ],
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists('player-jump')) {
            this.scene.anims.create({
                key: 'player-jump',
                frames: [{ key: 'player', frame: 'jump/frame0000' }],
                frameRate: 10
            });
        }

        if (!this.scene.anims.exists('player-duck')) {
            this.scene.anims.create({
                key: 'player-duck',
                frames: [{ key: 'player', frame: 'duck/frame0000' }],
                frameRate: 10
            });
        }

        if (!this.scene.anims.exists('player-climb')) {
            this.scene.anims.create({
                key: 'player-climb',
                frames: [
                    { key: 'player', frame: 'climb/frame0000' },
                    { key: 'player', frame: 'climb/frame0001' }
                ],
                frameRate: 10,
                repeat: -1
            });
        }
    }

    update(): void {
        const speed = 200;
        const jumpVelocity = -400;
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        const onGround = body.blocked.down;
        
        if (onGround) {
            this.jumpCount = 0;
            this.isJumping = false;
        }
        
        if (this.cursors.left.isDown) {
            this.setVelocityX(-speed);
            this.setFlipX(true);
            if (onGround && !this.cursors.down.isDown) {
                this.play('player-walk', true);
            }
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(speed);
            this.setFlipX(false);
            if (onGround && !this.cursors.down.isDown) {
                this.play('player-walk', true);
            }
        } else {
            this.setVelocityX(0);
            if (onGround && !this.cursors.down.isDown) {
                this.play('player-idle', true);
            }
        }
        
        if (this.cursors.down.isDown && onGround) {
            this.play('player-duck', true);
            this.setVelocityX(0);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.jumpCount < this.maxJumps) {
            this.setVelocityY(jumpVelocity);
            this.jumpCount++;
            this.isJumping = true;
            this.play('player-jump', true);
        }
        
        if (!onGround && this.isJumping) {
            this.play('player-jump', true);
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
}