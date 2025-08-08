import { Scene } from 'phaser';
import { Player } from '../objects/player/Player';
import { Spike } from '../objects/spike/Spike';
import { Flag } from '../objects/flag/Flag';
import { Coin } from '../objects/coin/Coin';
import { Key } from '../objects/key/Key';
import { Frog } from '../objects/enemy/Frog';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    player: Player;
    platforms: Phaser.Tilemaps.TilemapLayer | null = null;
    spikesGroup: Phaser.Physics.Arcade.StaticGroup;
    coinsGroup: Phaser.Physics.Arcade.StaticGroup;
    frogsGroup: Phaser.Physics.Arcade.Group;
    keyObject: Key | null = null;
    map: Phaser.Tilemaps.Tilemap | null = null;
    healthText: Phaser.GameObjects.Text;
    coinText: Phaser.GameObjects.Text;
    keyIcon: Phaser.GameObjects.Image;
    flag: Flag;
    victoryText: Phaser.GameObjects.Text;
    score: number = 0;
    totalCoins: number = 0;
    hasKey: boolean = false;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87CEEB);

        // 创建tilemap
        this.map = this.make.tilemap({ key: 'tilemap' });
        
        // 添加tilesets到map（现在只需要地形tiles）
        const terrainCenter = this.map.addTilesetImage('terrain_grass_block_center', 'terrain_grass_block_center');
        const terrainTop = this.map.addTilesetImage('terrain_grass_block_top', 'terrain_grass_block_top');
        
        // 创建spike组、coin组和frog组
        this.spikesGroup = this.physics.add.staticGroup();
        this.coinsGroup = this.physics.add.staticGroup();
        this.frogsGroup = this.physics.add.group();

        // 创建图层 - 只使用地形tilesets
        const allTilesets = [terrainCenter!, terrainTop!];
        const layer = this.map.createLayer('Level1', allTilesets, 0, 0);
        
        if (layer) {
            // 设置碰撞 - tiles 1和2是平台
            layer.setCollision([1, 2]); // 草地块
            this.platforms = layer;
        }

        // 从 object layer 创建对象
        const objectLayer = this.map.getObjectLayer('Objects');
        if (objectLayer) {
            objectLayer.objects.forEach((obj: any) => {
                // 对象中心坐标
                const x = obj.x + obj.width / 2;
                const y = obj.y + obj.height / 2;
                
                if (obj.type === 'enemy' && obj.name === 'frog') {
                    // 创建青蛙敌人
                    const frog = new Frog(this, x, y);
                    this.frogsGroup.add(frog);
                } else if (obj.type === 'collectible' && obj.name === 'coin') {
                    // 创建金币
                    const coin = new Coin(this, x, y);
                    this.coinsGroup.add(coin);
                    this.totalCoins++;
                } else if (obj.type === 'collectible' && obj.name === 'key') {
                    // 创建钥匙
                    this.keyObject = new Key(this, x, y);
                } else if (obj.type === 'hazard' && obj.name === 'spike') {
                    // 创建尖刺
                    const spike = new Spike(this, x, y);
                    this.spikesGroup.add(spike);
                }
            });
        }

        // 创建玩家（起点在左下角）
        this.player = new Player(this, 150, 1050);
        this.player.setName('player');
        
        // 创建终点旗帜（放在右上角的平台上）
        this.flag = new Flag(this, 1400, 130);

        // 添加玩家与平台的碰撞
        if (this.platforms) {
            this.physics.add.collider(this.player, this.platforms);
            // 添加青蛙与平台的碰撞
            this.physics.add.collider(this.frogsGroup, this.platforms);
        }

        // 添加玩家与尖刺的碰撞
        this.physics.add.overlap(this.player, this.spikesGroup, this.handleSpikeCollision, undefined, this);
        
        // 添加玩家与青蛙的碰撞
        this.physics.add.overlap(this.player, this.frogsGroup, this.handleFrogCollision, undefined, this);
        
        // 添加玩家与金币的碰撞
        this.physics.add.overlap(this.player, this.coinsGroup, this.handleCoinCollect, undefined, this);
        
        // 添加玩家与钥匙的碰撞
        if (this.keyObject) {
            this.physics.add.overlap(this.player, this.keyObject, this.handleKeyCollect, undefined, this);
        }
        
        // 添加玩家与终点的碰撞
        this.physics.add.overlap(this.player, this.flag, this.handleFlagReached, undefined, this);

        // 设置相机跟随和边界
        const mapWidth = this.map.widthInPixels;
        const mapHeight = this.map.heightInPixels;
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        
        // 设置世界边界
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

        // 创建血量UI
        this.createHealthUI();

        // 监听玩家血量变化
        this.player.on('damage', (health: number) => {
            this.updateHealthUI(health);
        });

        this.player.on('death', () => {
            this.scene.restart();
        });
    }

    private createHealthUI(): void {
        // 创建固定在屏幕上的血量显示
        this.healthText = this.add.text(16, 16, '', {
            fontSize: '32px',
            color: '#ff0000'
        });
        this.healthText.setScrollFactor(0); // 固定在屏幕上
        this.updateHealthUI(this.player.getHealth());
        
        // 创建金币计数显示
        this.coinText = this.add.text(16, 56, '', {
            fontSize: '28px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.coinText.setScrollFactor(0);
        this.updateCoinUI();
        
        // 创建钥匙图标（初始隐藏）
        this.keyIcon = this.add.image(16, 110, 'key');
        this.keyIcon.setScale(0.6);
        this.keyIcon.setScrollFactor(0);
        this.keyIcon.setVisible(false);
        this.keyIcon.setAlpha(0.5);
        
        // 创建胜利文本（初始隐藏）
        this.victoryText = this.add.text(512, 300, 'VICTORY!', {
            fontSize: '72px',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 8
        });
        this.victoryText.setOrigin(0.5);
        this.victoryText.setScrollFactor(0);
        this.victoryText.setVisible(false);
    }

    private updateHealthUI(health: number): void {
        const hearts = '❤️'.repeat(Math.max(0, health));
        const emptyHearts = '🖤'.repeat(Math.max(0, this.player.getMaxHealth() - health));
        this.healthText.setText(hearts + emptyHearts);
    }

    private updateCoinUI(): void {
        this.coinText.setText(`🪙 ${this.score}/${this.totalCoins}`);
    }

    private handleSpikeCollision(player: any, spike: any): void {
        const spikeObj = spike as Spike;
        if (spikeObj.canDealDamage()) {
            this.player.takeDamage(spikeObj.getDamageAmount());
            spikeObj.onPlayerHit();
        }
    }

    private handleFrogCollision(player: any, frog: any): void {
        const frogObj = frog as Frog;
        const playerVelocityY = this.player.body?.velocity.y || 0;
        
        // 检查玩家是否从上方踩到青蛙
        if (playerVelocityY > 0 && this.player.y < frogObj.y - 20) {
            // 玩家踩死青蛙
            frogObj.takeDamage();
            // 让玩家弹起
            this.player.setVelocityY(-300);
        } else if (frogObj.canDealDamage()) {
            // 青蛙伤害玩家
            this.player.takeDamage(frogObj.getDamageAmount());
            frogObj.onPlayerHit();
            
            // 弹开玩家
            const angle = Phaser.Math.Angle.Between(frogObj.x, frogObj.y, this.player.x, this.player.y);
            this.player.setVelocity(
                Math.cos(angle) * 200,
                Math.sin(angle) * 200 - 100
            );
        }
    }

    private handleCoinCollect(player: any, coin: any): void {
        const coinObj = coin as Coin;
        if (!coinObj.isCollected()) {
            coinObj.collect();
            this.score += coinObj.getValue();
            this.updateCoinUI();
            
            // 如果收集了所有金币，给予额外奖励
            if (this.score === this.totalCoins) {
                this.showAllCoinsCollectedBonus();
            }
        }
    }

    private handleKeyCollect(player: any, key: any): void {
        const keyObj = key as Key;
        if (!keyObj.isCollected()) {
            keyObj.collect();
            this.hasKey = true;
            
            // 更新钥匙UI
            this.keyIcon.setVisible(true);
            this.keyIcon.setAlpha(1);
            
            // 钥匙图标动画
            this.tweens.add({
                targets: this.keyIcon,
                scale: { from: 0, to: 0.6 },
                angle: 360,
                duration: 500,
                ease: 'Bounce.easeOut'
            });
            
            // 让旗帜发光表示可以通关了
            if (this.flag) {
                this.flag.setTint(0x00ff00);
                this.tweens.add({
                    targets: this.flag,
                    alpha: { from: 0.5, to: 1 },
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    private handleFlagReached(player: any, flag: any): void {
        const flagObj = flag as Flag;
        if (!flagObj.isReached()) {
            if (this.hasKey) {
                flagObj.activate();
                this.onVictory();
            } else {
                // 显示需要钥匙的提示
                this.showKeyRequiredMessage();
            }
        }
    }
    
    private showKeyRequiredMessage(): void {
        const message = this.add.text(512, 400, '🔒 You need the KEY to pass! 🔒', {
            fontSize: '32px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        });
        message.setOrigin(0.5);
        message.setScrollFactor(0);
        
        // 闪烁动画
        this.tweens.add({
            targets: message,
            alpha: { from: 1, to: 0 },
            scale: { from: 1, to: 1.2 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                message.destroy();
            }
        });
        
        // 弹开玩家
        const angle = Phaser.Math.Angle.Between(this.flag.x, this.flag.y, this.player.x, this.player.y);
        this.player.setVelocity(
            Math.cos(angle) * 300,
            Math.sin(angle) * 300 - 200
        );
    }
    
    private showAllCoinsCollectedBonus(): void {
        // 显示完美收集提示
        const bonusText = this.add.text(512, 200, 'PERFECT! All Coins Collected!', {
            fontSize: '36px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        bonusText.setOrigin(0.5);
        bonusText.setScrollFactor(0);
        
        // 动画效果
        this.tweens.add({
            targets: bonusText,
            scale: { from: 0, to: 1.2 },
            alpha: { from: 1, to: 0 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                bonusText.destroy();
            }
        });
        
        // 给玩家加满血作为奖励
        this.player.heal(3);
    }
    
    private onVictory(): void {
        // 停止玩家控制
        this.player.body!.enable = false;
        this.player.setVelocity(0, 0);
        
        // 更新胜利文本，显示金币收集情况
        const perfectBonus = this.score === this.totalCoins ? '\n⭐ PERFECT! ⭐' : '';
        this.victoryText.setText(`VICTORY!\n🪙 ${this.score}/${this.totalCoins}${perfectBonus}`);
        
        // 显示胜利文本
        this.victoryText.setVisible(true);
        
        // 胜利动画
        this.tweens.add({
            targets: this.victoryText,
            scale: { from: 0, to: 1 },
            angle: { from: -180, to: 0 },
            duration: 1000,
            ease: 'Bounce.easeOut'
        });
        
        // 添加彩虹背景效果
        let hue = 0;
        this.time.addEvent({
            delay: 50,
            callback: () => {
                hue = (hue + 5) % 360;
                const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5);
                this.cameras.main.setBackgroundColor(color.color);
            },
            repeat: -1
        });
        
        // 播放玩家胜利动画
        this.player.setTint(0xffff00);
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 50,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Power1'
        });
        
        // 3秒后重新开始（可以改为进入下一关）
        this.time.delayedCall(5000, () => {
            this.scene.restart();
        });
    }

    update ()
    {
        if (this.flag && !this.flag.isReached()) {
            this.player.update();
            
            // 更新所有青蛙
            this.frogsGroup.children.entries.forEach((frog: any) => {
                if (frog.active) {
                    frog.update();
                }
            });
        }
    }
}
