import { Scene } from 'phaser';
import { Player } from '../objects/player/Player';
import { Spike } from '../objects/spike/Spike';
import { Flag } from '../objects/flag/Flag';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    player: Player;
    platforms: Phaser.Tilemaps.TilemapLayer | null = null;
    spikesGroup: Phaser.Physics.Arcade.StaticGroup;
    map: Phaser.Tilemaps.Tilemap | null = null;
    healthText: Phaser.GameObjects.Text;
    flag: Flag;
    victoryText: Phaser.GameObjects.Text;

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
        
        // 添加tilesets到map
        const terrainCenter = this.map.addTilesetImage('terrain_grass_block_center', 'terrain_grass_block_center');
        const terrainTop = this.map.addTilesetImage('terrain_grass_block_top', 'terrain_grass_block_top');
        const spikesSet = this.map.addTilesetImage('spikes', 'spikes');
        
        // 创建spike组
        this.spikesGroup = this.physics.add.staticGroup();

        // 创建图层 - 只使用地形tilesets
        const terrainTilesets = [terrainCenter!, terrainTop!];
        const layer = this.map.createLayer('Level1', [terrainCenter!, terrainTop!, spikesSet!], 0, 0);
        
        if (layer) {
            // 遍历tilemap，找到所有spike tiles (tile ID 3)
            layer.forEachTile((tile) => {
                if (tile.index === 3) { // spike tile
                    // 创建spike对象替换tile
                    const spike = new Spike(this, tile.pixelX + 32, tile.pixelY + 32);
                    this.spikesGroup.add(spike);
                    // 移除原来的tile
                    layer.removeTileAt(tile.x, tile.y);
                }
            });
            
            // 设置碰撞 - tiles 1和2是平台
            layer.setCollision([1, 2]); // 草地块
            this.platforms = layer;
        }

        // 创建玩家（起点在左下角）
        this.player = new Player(this, 150, 1050);
        
        // 创建终点旗帜（放在右上角的平台上）
        this.flag = new Flag(this, 1400, 130);

        // 添加玩家与平台的碰撞
        if (this.platforms) {
            this.physics.add.collider(this.player, this.platforms);
        }

        // 添加玩家与尖刺的碰撞
        this.physics.add.overlap(this.player, this.spikesGroup, this.handleSpikeCollision, undefined, this);
        
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

    private handleSpikeCollision(player: any, spike: any): void {
        const spikeObj = spike as Spike;
        if (spikeObj.canDealDamage()) {
            this.player.takeDamage(spikeObj.getDamageAmount());
            spikeObj.onPlayerHit();
        }
    }

    private handleFlagReached(player: any, flag: any): void {
        const flagObj = flag as Flag;
        if (!flagObj.isReached()) {
            flagObj.activate();
            this.onVictory();
        }
    }
    
    private onVictory(): void {
        // 停止玩家控制
        this.player.body!.enable = false;
        this.player.setVelocity(0, 0);
        
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
        }
    }
}
