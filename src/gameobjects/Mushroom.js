import { GameObjects, Physics } from "phaser";

export class Mushroom extends Phaser.Physics.Matter.Sprite {
    static defaultProperties = {
        friction: 0,
        restitution: 0.1, // Prevent body from sticking against a wall
        frictionStatic: 0,
        frictionAir: 0,
        // density: 0.05,
        label: 'powerup',
        //isStatic: true,
        ignoreGravity: false
    };
    static config = {
        velocity: 2
    };

    scene;
    props;

    constructor(scene, x, y, properties = {}) {
        // https://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects
        let props = {...Mushroom.defaultProperties, ...properties};
        super(scene.matter.world, x, y, "block", 93, props);
        this.props = props;

        // The mushroom's body is going to be a compound body.
        const M = Phaser.Physics.Matter.Matter;
        const mushroomBody = M.Bodies.rectangle(0, 0, 35, 30, props);
        props["parts"] = [mushroomBody];
        const compoundBody = M.Body.create(props);
        this.setExistingBody(compoundBody)
            .setDepth(1)
            .setPosition(x, y)
            .setFixedRotation()
            .setDisplayOrigin(32.5, 49);

        this.scene = scene;
        this.addCollisions();
        this.initTweenSpawn();
        scene.add.existing(this);
    }

    addCollisions() {
        this.unsubscribeCollide = this.scene.matterCollision.addOnCollideStart({
          objectA: this,
          callback: this.onCollide,
          context: this,
        });
    }

    onCollide({ gameObjectA, gameObjectB }) {
        if (!gameObjectB) {
            return;
        }
        let label = gameObjectB.properties ? gameObjectB.properties.label : gameObjectB.body.label;
        switch (label) {
            case 'player':
                this.destroy();
            case 'movable':
            case 'moving':
            case 'powerup':
            case 'ground':
                break;
            default:
                this.setVelocityX(Mushroom.config.velocity * -Math.sign(this.getVelocity().x));
            }
    }

    initTweenSpawn() {
        this.scene.tweens.add({
            targets: this,
            y: this.y - 32,
            duration: 300,
            onComplete: () => {
                // TODO: static false make the mushroom crash the second time
                //this.setStatic(false);
                this.setVelocityX(Mushroom.config.velocity);
                // if (Phaser.Math.Between(0, 10) <= 4) {
                //     this.setVelocityX(6);
                // } else {
                //     this.setVelocityX(-6);
                // }
            }
        });
    }
}

