import { Scene } from 'phaser';
import { Player } from '../objects/player/Player';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    player: Player;
    platforms: Phaser.Physics.Arcade.StaticGroup;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87CEEB);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.platforms = this.physics.add.staticGroup();
        
        this.platforms.create(512, 700, 'platform').setScale(4, 1).refreshBody();
        this.platforms.create(200, 550, 'platform').setScale(1, 1).refreshBody();
        this.platforms.create(750, 450, 'platform').setScale(1, 1).refreshBody();
        this.platforms.create(500, 350, 'platform').setScale(1, 1).refreshBody();

        // 打印全局缓存的纹理列表.
        console.log(this.textures.list);

        this.player = new Player(this, 100, 450);

        this.physics.add.collider(this.player, this.platforms);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, 1024, 768);
    }

    update ()
    {
        this.player.update();
    }
}
