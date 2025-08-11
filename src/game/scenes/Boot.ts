import { Scene } from 'phaser';
import { ASSET_KEYS, ASSET_PATHS } from '../config/AssetConfig';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image(ASSET_KEYS.IMAGES.BACKGROUND, `assets/${ASSET_PATHS.IMAGES[ASSET_KEYS.IMAGES.BACKGROUND]}`);
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
