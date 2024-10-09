// Class to preload all the assets
// Remember you can load this assets in another scene if you need it
export class Preloader extends Phaser.Scene {
    constructor() {
        super({ key: "Preloader" });
    }

    preload() {
        // Load all the assets
        this.load.setPath("assets");
        this.load.image("logo", "logo.png");
        this.load.image("floor");

        //this.load.spritesheet("player", "player/dude-cropped.png", { frameWidth: 32, frameHeight: 42 });
        this.load.spritesheet("player", "player/mario.png", { frameWidth: 33.9, frameHeight: 50 });
        this.load.spritesheet('block', 'kenney_redux_64x64.png', {frameWidth: 64});
        this.load.atlas("propulsion-fire", "player/propulsion/propulsion-fire.png", "player/propulsion/propulsion-fire_atlas.json");
        this.load.animation("propulsion-fire-anim", "player/propulsion/propulsion-fire_anim.json");
        //this.load.tilemapTiledJSON('map', 'matter-platformer.json');
        this.load.image('kenney_redux_64x64', 'kenney_redux_64x64.png');
        this.load.tilemapTiledJSON('map', 'hmap.json');
        this.load.image('background', 'bg.png');

        // Bullets
        this.load.image("bullet", "player/bullet.png");
        this.load.image("flares")

        // Enemies
        this.load.atlas("enemy-blue", "enemies/enemy-blue/enemy-blue.png", "enemies/enemy-blue/enemy-blue_atlas.json");
        this.load.animation("enemy-blue-anim", "enemies/enemy-blue/enemy-blue_anim.json");
        this.load.image("enemy-bullet", "enemies/enemy-bullet.png");

        // Fonts
        this.load.bitmapFont("pixelfont", "fonts/pixelfont.png", "fonts/pixelfont.xml");
        this.load.image("knighthawks", "fonts/knight3.png");

        //audio
        this.load.audio("soundtrack", "sounds/mario-theme.mp3");
        this.load.audio("game-over-music", "sounds/game-over.wav");
        this.load.audio("death", "sounds/mario-death-sound.wav");
        this.load.audio("block-bump", "sounds/block-bump.wav");
        this.load.audio("jump-sound", "sounds/jump-sound.mp3");

        // Event to update the loading bar
        this.load.on("progress", (progress) => {
            console.log("Loading: " + Math.round(progress * 100) + "%");
        });
    }

    create() {
        // Create bitmap font and load it in cache
        const config = {
            image: 'knighthawks',
            width: 31,
            height: 25,
            chars: Phaser.GameObjects.RetroFont.TEXT_SET6,
            charsPerRow: 10,
            spacing: { x: 1, y: 1 }
        };
        this.cache.bitmapFont.add('knighthawks', Phaser.GameObjects.RetroFont.Parse(this, config));

        // When all the assets are loaded go to the next scene
        //this.scene.start("SplashScene");
        this.scene.start("MainScene");
    }
}