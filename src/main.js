import { Game } from "phaser";
import { Preloader } from "./preloader";
import { GameOverScene } from "./scenes/GameOverScene";
import { HudScene } from "./scenes/HudScene";
import { MainScene } from "./scenes/MainScene";
import { MenuScene } from "./scenes/MenuScene";
import { SplashScene } from "./scenes/SplashScene";
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";

// More information about config: https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    parent: "phaser-container",
    width: 960,
    height: 540,
    backgroundColor: "#1c172e",
    pixelArt: true,
    roundPixel: false,
    max: {
        width: 800,
        height: 600,
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "matter",
        matter: {
            gravity: {y: 1},
            enableSleep: false,
            debug: true
        }
    },
    scene: [
        Preloader,
        SplashScene,
        MainScene,
        MenuScene,
        HudScene,
        GameOverScene
    ],
    plugins: {
        scene: [
            {
                plugin: PhaserMatterCollisionPlugin, // The plugin class
                key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
                mapping: "matterCollision" // Where to store in the Scene, e.g. scene.matterCollision

                // Note! If you are including the library via the CDN script tag, the plugin
                // line should be:
                // plugin: PhaserMatterCollisionPlugin.default
            }
        ]
    }
};

new Game(config);