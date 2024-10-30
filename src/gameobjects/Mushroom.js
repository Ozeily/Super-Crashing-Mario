import { GameObjects, Physics } from "phaser";

export class Mushroom extends Phaser.Physics.Matter.Sprite {

    constructor(scene, x, y, properties) {
        super(scene.matter.world, x, y, "block", 93, properties);
        scene.add.existing(this);
        this.scene = scene;

        // The mushroom's body is going to be a compound body.
        const mushroomBody = Phaser.Physics.Matter.Matter.Bodies.rectangle(0, 0, 35, 30 ,{label: 'powerup'});
        const compoundBody = Phaser.Physics.Matter.Matter.Body.create({
            parts: [
                mushroomBody
            ],
            friction: 0.01,
            restitution: 0.05 // Prevent body from sticking against a wall
        });

        this.setExistingBody(compoundBody).setFixedRotation().setDisplayOrigin(32.5, 49);
        this.addCollisions();
        

    }

    addCollisions() {
        this.unsubscribeCollide = this.scene.matterCollision.addOnCollideStart({
          objectA: this,
          callback: this.onCollide,
          context: this,
        });
    }
    
    onCollide({ gameObjectA, gameObjectB }) {
        // if (gameObjectB instanceof Player) {
        //   this.destroy();
        // }
        console.log("hihihihihihh")
    }
    
}

