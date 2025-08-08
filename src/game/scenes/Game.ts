import { Scene } from 'phaser';
import { Player } from '../objects/player/Player';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    player: Player;
    platforms: Phaser.Tilemaps.TilemapLayer | null = null;
    spikes: Phaser.Tilemaps.TilemapLayer | null = null;
    map: Phaser.Tilemaps.Tilemap | null = null;

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
        
        // 创建图层 - 使用所有tilesets
        const allTilesets = [terrainCenter!, terrainTop!, spikesSet!];
        const layer = this.map.createLayer('Level1', allTilesets, 0, 0);
        
        if (layer) {
            // 设置碰撞 - tiles 1和2是平台，3是尖刺
            layer.setCollisionByProperty({ collides: true });
            layer.setCollision([1, 2]); // 草地块
            
            this.platforms = layer;
        }

        // 创建玩家
        this.player = new Player(this, 100, 100);

        // 添加玩家与平台的碰撞
        if (this.platforms) {
            this.physics.add.collider(this.player, this.platforms);
        }

        // 设置相机跟随和边界
        const mapWidth = this.map.widthInPixels;
        const mapHeight = this.map.heightInPixels;
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        
        // 设置世界边界
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    }

    update ()
    {
        this.player.update();
    }
}
