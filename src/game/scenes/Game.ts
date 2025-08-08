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

        // 创建平台组
        this.platforms = this.physics.add.staticGroup();
        
        // 创建地面平台（底部大平台）
        const ground = this.add.rectangle(512, 700, 800, 50, 0x654321);
        this.platforms.add(ground);
        
        // 创建浮空平台
        const platform1 = this.add.rectangle(200, 550, 200, 20, 0x8B4513);
        this.platforms.add(platform1);
        
        const platform2 = this.add.rectangle(750, 450, 200, 20, 0x8B4513);
        this.platforms.add(platform2);
        
        const platform3 = this.add.rectangle(500, 350, 200, 20, 0x8B4513);
        this.platforms.add(platform3);
        
        // 创建一些额外的平台增加游戏性
        const platform4 = this.add.rectangle(100, 650, 150, 20, 0x8B4513);
        this.platforms.add(platform4);
        
        const platform5 = this.add.rectangle(900, 600, 150, 20, 0x8B4513);
        this.platforms.add(platform5);

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
