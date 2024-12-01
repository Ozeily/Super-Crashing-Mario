import { Mushroom } from "../gameobjects/Mushroom";
export class Block extends Phaser.Physics.Matter.Sprite {
    sound;
    scene;
    props;

    static defaultProperties = {
        label: 'movable',
        ignoreGravity: true,
        isStatic: true
    }

    static getTextureID(tile) {
        switch (tile.type) {
            case 'mystery block':
                return 83;
            case 'construct block':
                return 35;
            default:
                return 0;
            }        
    }

    constructor(scene, tile) {
        // https://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects
        let props = {...Block.defaultProperties};
        props.properties = tile.properties;
        super(scene.matter.world, tile.x + 32, tile.y - 32, "block", Block.getTextureID(tile), props);
        this.props = props;
        this.setDepth(3);
        this.setFixedRotation();
        this.scene = scene;
        this.addCollisions();
        scene.add.existing(this);
        this.sound = this.scene.sound.add('block-bump').setVolume(0.1);
    }
    addCollisions() {
        this.unsubscribeCollide = this.scene.matterCollision.addOnCollideStart({
          objectA: this,
          callback: this.onCollide,
          context: this,
        });
    }
    tweenBump() {
        this.scene.tweens.chain({
            targets: this,
            tweens: [
                {
                    y: this.body.position.y - 24,
                    duration: 75
                },
                {
                    y: this.body.position.y,
                    duration: 75
                }
            ],
            onComplete: () => {
                this.body.label = "movable";
            }
        });

    }
    getProperty(name) {
        var props = this.body.properties;
        if (!props) {
            return
        };
        for (let i = 0; i < props.length; ++i) {
            if (props[i].name === name) {
                return props[i].value
            }
        }
    }
    onCollide({ gameObjectA, gameObjectB }) {
        if (!gameObjectB || this.body.label != "movable") {
            return;
        }
        let label = gameObjectB.properties ? gameObjectB.properties.label : gameObjectB.body.label;
        if (label != 'player') {
            return;
        }
        this.body.label = "moving";
        this.tweenBump();
        this.sound.play();
        console.log(this.getProperty("bonus"))
        if (this.getProperty("bonus") == 'mushroom') {
            new Mushroom(this.scene, gameObjectA.x, gameObjectA.y - 16);
            //setProperty(tweenTarget, 'bonus', 'none');
        }
    }
};