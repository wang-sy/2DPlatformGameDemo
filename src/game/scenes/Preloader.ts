import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');
        
        this.load.atlas('player', 'player/character_purple.png', 'player/character_purple.json');
        this.load.image('platform', 'bg.png');
        
        // Load tilemap
        this.load.tilemapTiledJSON('tilemap', 'tilemap/scenes/game.json');
        
        // Load tileset images
        this.load.image('terrain_grass_block_center', 'tilemap/tiles/terrain_grass_block_center.png');
        this.load.image('terrain_grass_block_top', 'tilemap/tiles/terrain_grass_block_top.png');
        this.load.image('spikes', 'tilemap/tiles/spikes.png');
        this.load.image('flag', 'tilemap/tiles/flag_green_a.png');
        this.load.image('coin', 'tilemap/tiles/coin_gold.png');
        this.load.image('key', 'tilemap/tiles/hud_key_green.png');
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
