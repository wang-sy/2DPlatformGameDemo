import { Scene } from 'phaser';
import { ASSET_KEYS, ASSET_PATHS } from '../config/AssetConfig';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, ASSET_KEYS.IMAGES.BACKGROUND);

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
        
        // Load atlases
        for (const [key, paths] of Object.entries(ASSET_PATHS.ATLASES)) {
            this.load.atlas(key, paths.texture, paths.atlas);
        }
        
        // Load images
        for (const [key, path] of Object.entries(ASSET_PATHS.IMAGES)) {
            // Skip background as it's already loaded in Boot
            if (key !== ASSET_KEYS.IMAGES.BACKGROUND) {
                this.load.image(key, path);
            }
        }
        
        // Load tilemap
        this.load.tilemapTiledJSON(
            ASSET_KEYS.TILEMAPS.GAME,
            ASSET_PATHS.TILEMAPS[ASSET_KEYS.TILEMAPS.GAME]
        );
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
