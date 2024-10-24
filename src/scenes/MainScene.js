import { Scene } from "phaser";
import { Player } from "../gameobjects/Player";
import { BlueEnemy } from "../gameobjects/BlueEnemy";

// function getObject(object, flyingBlocksLayer) {

//     for (let i = 0; i < flyingBlocksLayer.objects.length; ++i) {
//         let obj = flyingBlocksLayer.objects[i];

//         if (getProperty(obj, "bonus")) {
//             return obj
//         }
//     }
// }

function getProperty(object, name) {
    if (!object.properties) {
        return
    };
    for (let i = 0; i < object.properties.length; ++i) {
        if (object.properties[i].name === name) {
            return object.properties[i].value
        }
    }
}

function setProperty(object, name, value) {
    if (!object.properties) {
        console.log("non")
        return
    };
    for (let i = 0; i < object.properties.length; ++i) {
        if (object.properties[i].name === name) {
            //console.log(object.properties[i].name)
            //object.setData(name, value)
            //setValue(object, 'properties[i].value', value)
            object.properties[i].value = value
        }
    }
}

export class MainScene extends Scene {
    player = null;
    enemy_blue = null;
    cursors = null;
    smoothedControls;
    playerController;
    cam;
    jump_sound;

    points = 0;
    game_over_timeout = 20;
    objects_to_destroy = [];

    constructor() {
        super("MainScene");
    }

    // init() {
    //     this.cameras.main.fadeIn(1000, 0, 0, 0);
    //     this.scene.launch("MenuScene");

    //     // Reset points
    //     this.points = 0;
    //     this.game_over_timeout = 20;
    // }

    create() {

        //this.add.image(0, 0, "background")
        //    .setOrigin(0, 0);
        //const ground = this.add.image(0, 0, "floor", null, { restitution: 0.4, isStatic: true }).setOrigin(0, 1);
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('kenney_redux_64x64');
        const background = this.add.image(0, 896, 'background').setDisplaySize(20000, 2000);
        const backLayer = map.createLayer(0,tileset, 0, 0);
        const groundLayer = map.createLayer(1, tileset, 0, 0);
        const fgLayer = map.createLayer(2, tileset, 0, 0).setDepth(1);
        const spawnLayer = map.getObjectLayer('spawn');
        const flyingBlocksLayer = map.getObjectLayer('flying blocks');
        let music = this.sound.add('soundtrack').setVolume(0.1);
        music.play({loop : -1});
        let mario_death = this.sound.add('death').setVolume(0.1);
        let block_bump = this.sound.add('block-bump').setVolume(0.1);
        this.jump_sound = this.sound.add('jump-sound').setVolume(0.01);

        //console.log(spawnLayer, flyingBlocksLayer);

        // Instead of setting collision by index, you can set any tile that has collision data to
        // collide. Typically, this is done in the Tiled collision editor. All tiles in this layer have
        // collision shapes.
        //this.layer.setCollisionFromCollisionGroup();
        groundLayer.setCollisionByProperty({ collides: true });

        this.shapeGraphics = this.add.graphics();

        this.matter.world.convertTilemapLayer(groundLayer);
        this.matter.world.setBounds(map.widthInPixels, map.heightInPixels);
        this.matter.world.drawDebug = false;

        // const buttons = [];

        // for (let x = map.width; x >= 0; --x) {
        //     for (let y = map.height; y >= 0; --y) {
        //         if (map.getTileAt(x,y) == null) {
        //             continue
        //         }
        //         else if (map.getTileAt(x,y).tileId == 104) {
        //             buttons.push(x,y)
        //         }
        //     }
        // }

       // console.log(buttons)

        groundLayer.forEachTile((tile) =>
        {
            if (tile.properties.kills)
            {
                tile.physics.matterBody.body.label = 'dangerousTile';
                //console.log("blocks that kill");
            }
            else if (tile.properties.canBePressed)
            {
                tile.physics.matterBody.body.label = 'button';
                //console.log("buttons");
            }
        });


        flyingBlocksLayer.objects.forEach(tile => {
            if (tile.type == "mystery block") {
                var mystery_block = this.matter.add.sprite(tile.x + 32, tile.y - 32, "block", 83, {label: 'movable', properties: tile.properties, ignoreGravity: true, isStatic: true}).setFixedRotation().setDepth(3);
            }
            else if (tile.type == "construct block") {
                var construct_block = this.matter.add.sprite(tile.x + 32, tile.y - 32, "block", 35, {label: 'movable', ignoreGravity: true, isStatic: true}).setFixedRotation().setDepth(3);

                //const mystery_block = map.createFromTiles(83, null, { useSpriteSheet: 'block' });
            }
        });

        const playerSpawnPoint = map.findObject("spawn", obj => obj.name === "playerSpawn");
        const mushroom = this.matter.add.sprite(playerSpawnPoint.x + 200, playerSpawnPoint.y - 64, "block", 93, {label: 'powerup', isStatic: false, ignoreGravity: false}).setFixedRotation();



        // for (let obj in spawnLayer)
        // {
        //     if (obj.name === 'playerSpawn')
        //     {
        //         const playerSpawnPoint = obj;
        //     }
        // }

        //console.log(playerSpawnPoint);

        // Player
        //this.player = new Player({ scene: this });

        // Enemy
        //this.enemy_blue = new BlueEnemy(this);

        // Cursor keys
        this.cursors = this.input.keyboard.createCursorKeys();
        // this.cursors.space.on("down", () => {
        //     this.player.move("up");
        // });

        this.smoothedControls = new SmoothedHorionztalControl(0.0005);

        // this.input.on("pointerdown", (pointer) => {
        //     this.player.fire(pointer.x, pointer.y);
        // });

        // The player is a collection of bodies and sensors
        this.playerController = {
            matterSprite: this.matter.add.sprite(0, 0, 'player', 4),
            blocked: {
                left: false,
                right: false,
                bottom: false
            },
            numTouching: {
                left: 0,
                right: 0,
                bottom: 0
            },
            sensors: {
                bottom: null,
                left: null,
                right: null
            },
            time: {
                leftDown: 0,
                rightDown: 0
            },
            lastJumpedAt: 0,
            speed: {
                run: 4,
                jump: 9
            }
        };

       let M = Phaser.Physics.Matter.Matter;
        let w = this.playerController.matterSprite.width;
        let h = this.playerController.matterSprite.height;

        // The player's body is going to be a compound body:
        //  - playerBody is the solid body that will physically interact with the world. It has a
        //    chamfer (rounded edges) to avoid the problem of ghost vertices: http://www.iforce2d.net/b2dtut/ghost-vertices
        //  - Left/right/bottom sensors that will not interact physically but will allow us to check if
        //    the player is standing on solid ground or pushed up against a solid object.

        // Move the sensor to player center
        let sx = w / 2;
        let sy = h / 2;

        // The player's body is going to be a compound body.
        let playerBody = M.Bodies.rectangle(sx, sy, w * 0.75, h, { chamfer: { radius: 10 } });
        this.playerController.sensors.top = M.Bodies.rectangle(sx, 0, sx, 5, { isSensor: true });
        this.playerController.sensors.bottom = M.Bodies.rectangle(sx, h, sx, 5, { isSensor: true });
        this.playerController.sensors.left = M.Bodies.rectangle(sx - w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        this.playerController.sensors.right = M.Bodies.rectangle(sx + w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        let compoundBody = M.Body.create({
            parts: [
                playerBody, this.playerController.sensors.bottom, this.playerController.sensors.left,
                this.playerController.sensors.right, this.playerController.sensors.top
            ],
            density: 0,
            mass: 0,
            friction: 0.0012,
            frictionAir: 0.015,
            frictionStatic: 0,
            restitution: 0.05 // Prevent body from sticking against a wall
        });

        this.playerController.matterSprite
            .setExistingBody(compoundBody)
            .setFixedRotation() // Sets max inertia to prevent rotation
            //.setPosition(160, 704);
            .setPosition(playerSpawnPoint.x, playerSpawnPoint.y);

        w = mushroom.width;
        h = mushroom.height;

        // The mushroom's body is going to be a compound body.
        const mushroomBody = M.Bodies.rectangle(0, 0, 35, 30 ,{label: 'powerup'});
        compoundBody = M.Body.create({
            parts: [
                mushroomBody
            ],
            friction: 0.01,
            restitution: 0.05 // Prevent body from sticking against a wall
        });

        mushroom.setExistingBody(compoundBody).setPosition(playerSpawnPoint.x + 50, playerSpawnPoint.y - 164).setFixedRotation().setDisplayOrigin(32.5, 49);
        //console.log(mushroom, mushroomBody);
        this.cam = this.cameras.main;
        this.cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.smoothMoveCameraTowards(this.playerController.matterSprite);

        //player anims
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 11, end: 18 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 8 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'idle-right',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'idle-left',
            frames: this.anims.generateFrameNumbers('player', { start: 10, end: 10 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'jump-right',
            frames: this.anims.generateFrameNumbers('player', { start: 9, end: 9 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'jump-left',
            frames: this.anims.generateFrameNumbers('player', { start: 19, end: 19 }),
            frameRate: 20,
            repeat: -1
        });

        // Use matter events to detect whether the player is touching a surface to the left, right or
        // bottom.

        // Before matter's update, reset the player's count of what surfaces it is touching.
        this.matter.world.on('beforeupdate', function (event) {
            this.playerController.numTouching.left = 0;
            this.playerController.numTouching.right = 0;
            this.playerController.numTouching.bottom = 0;
            this.playerController.numTouching.top = 0;
            this.objects_to_destroy.forEach(x => x.destroy())
            // https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
            this.objects_to_destroy.length = 0
        }, this);

        // Loop over the active colliding pairs and count the surfaces the player is touching.

        this.matter.world.on('collisionstart', function (event)
        {
            //console.log("haha")
            if (!this.playerController) {
                //console.log("lol")
                return
            }
            const playerBody = this.playerController.body;
            const mushroom = this.mushroomBody;
            const left = this.playerController.sensors.left;
            const right = this.playerController.sensors.right;
            const bottom = this.playerController.sensors.bottom;
            const top = this.playerController.sensors.top;

            for (let i = 0; i < event.pairs.length; i++)
            {
                const bodyA = event.pairs[i].bodyA;
                const bodyB = event.pairs[i].bodyB;
                var this_ = this;

                if (bodyA === playerBody || bodyB === playerBody)
                {
                    continue;
                }
                const collisionObject = this.getCollisionObject(bodyA, bodyB, 'powerup')
                if (collisionObject) {
                    console.log("will be destroyed " + collisionObject);
                    this.objects_to_destroy.push(collisionObject.gameObject);
                }
                else if ((bodyA === top && bodyB.label === 'movable') || (bodyB === top && bodyA.label === 'movable'))
                    {

                        var tweenTarget = (bodyA.label === "movable" ? bodyA : bodyB);
                        //let mystery_box = getObject(tweenTarget, flyingBlocksLayer);
                        //console.log(tweenTarget)

                        block_bump.play();
                        tweenTarget.label = "moving";
                        // https://labs.phaser.io/edit.html?src=src\tweens\chains\basic%20tween%20chain.js
                        this.tweens.chain({
                            targets: tweenTarget.gameObject,
                            tweens: [
                                {
                                    y: tweenTarget.position.y - 24,
                                    duration: 75
                                },
                                {
                                    y: tweenTarget.position.y,
                                    duration: 75
                                }
                            ],
                            onComplete: () => {
                                tweenTarget.label = "movable";
                            }
                        });

                        if (getProperty(tweenTarget, "bonus") == 'mushroom') {
                            const properties = {
                                // friction: 0,
                                // restitution: 0, // Prevent body from sticking against a wall
                                // frictionStatic: 0,
                                // frictionAir: 0,
                                // density: 0.05,
                                label: 'powerup',
                                isStatic: true,
                                ignoreGravity: false
                            };

                            const mushroom2 = this.matter.add.sprite(tweenTarget.gameObject.x, tweenTarget.gameObject.y, "block", 93, properties);

                            const mushroomBody = M.Bodies.rectangle(0, 0, 35, 30, properties);
                            properties["parts"] = [mushroomBody]
                            compoundBody = M.Body.create(properties);
                            mushroom2.setExistingBody(compoundBody)
                                .setDepth(1)
                                .setPosition(tweenTarget.gameObject.x, tweenTarget.gameObject.y - 16)
                                .setFixedRotation()
                                .setDisplayOrigin(32.5, 49);

                                //this.matter.body.setStatic(mushroom2.body, true)
                            console.log(mushroom2);
                            //setProperty(tweenTarget, 'bonus', 'none')
                            this.tweens.add({
                                targets: mushroom2,
                                y: mushroom2.y - 32,
                                duration: 300,
                                onComplete: () => {
                                    // TODO: static false make the mushroom crash the second time
                                    // mushroom2.setStatic(false);
                                    // mushroom2.setVelocityX(1);
                                    // if (Phaser.Math.Between(0, 10) <= 4) {
                                    //     mushroom2.setVelocityX(6);
                                    // } else {
                                    //     mushroom2.setVelocityX(-6);
                                    // }
                                }
                            });
                            //setProperty(tweenTarget, 'bonus', 'none');
                        }
                    }
            }
        }, this)
        this.matter.world.on('collisionactive', function (event)
        {
            const playerBody = this.playerController.body;
            const mushroom = this.mushroomBody;
            const left = this.playerController.sensors.left;
            const right = this.playerController.sensors.right;
            const bottom = this.playerController.sensors.bottom;
            const top = this.playerController.sensors.top;


            for (let i = 0; i < event.pairs.length; i++)
            {
                const bodyA = event.pairs[i].bodyA;
                const bodyB = event.pairs[i].bodyB;
                var this_ = this;

                if (bodyA === playerBody || bodyB === playerBody)
                {

                    continue;
                }
                //dangerousTile => mario ne change pas d'anim lorsqu'il touche une tile dangereuse
                // else if (bodyA.label === 'dangerousTile'|| bodyB.label === 'dangerousTile')
                //     {
                //         this.scene.pause("MainScene");
                //         music.stop();
                //         mario_death.play();
                //         mario_death.on('complete', function() {this_.scene.start("GameOverScene", { points: this_.points })});
                //     }
                else if (bodyA === bottom || bodyB === bottom)
                {
                    // Standing on any surface counts (e.g. jumping off of a non-static crate).
                    this.playerController.numTouching.bottom += 1;
                    // if (bodyA.label === 'button' || bodyB.label === 'button')
                    //     {
                    //         console.log(bodyA.label === "button" ? bodyA : bodyB);
                    //     }
                }
                else if ((bodyA === left && bodyB.isStatic) || (bodyB === left && bodyA.isStatic))
                {
                    // Only static objects count since we don't want to be blocked by an object that we
                    // can push around.
                    this.playerController.numTouching.left += 1;
                }
                else if ((bodyA === right && bodyB.isStatic) || (bodyB === right && bodyA.isStatic))
                {
                    this.playerController.numTouching.right += 1;
                }





                    // tween.add({
                    //     targets: tweenTarget,
                    //     y: tweenTarget.position.y - 2000,
                    //     duration: 100,
                    //     start: performance.now(),
                    //     yoyo: true,
                    // })



                // if ((bodyB.label === 'powerup') || (bodyA.label === 'powerup')) {

                //     var powerup = (bodyA.label === "powerup" ? bodyA : bodyB);
                //     console.log(powerup)

                //     powerup.destroy()
                // }





            }
        }, this);

        //this.physics.add.overlap(player, mushroom, consumeMushroom, null, this);

        // Update over, so now we can determine if any direction is blocked
        this.matter.world.on('afterupdate', function (event) {
            this.playerController.blocked.right = this.playerController.numTouching.right > 0 ? true : false;
            this.playerController.blocked.left = this.playerController.numTouching.left > 0 ? true : false;
            this.playerController.blocked.bottom = this.playerController.numTouching.bottom > 0 ? true : false;
        }, this);

        this.input.on('pointerdown', function ()
        {
            this.matter.world.drawDebug = !this.matter.world.drawDebug;
            this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;
        }, this);

        // Overlap enemy with bullets
        // this.physics.add.overlap(this.player.bullets, this.enemy_blue, (enemy, bullet) => {
        //     bullet.destroyBullet();
        //     this.enemy_blue.damage(this.player.x, this.player.y);
        //     this.points += 10;
        //     this.scene.get("HudScene")
        //         .update_points(this.points);
        // });

        // Overlap player with enemy bullets
        // this.physics.add.overlap(this.enemy_blue.bullets, this.player, (player, bullet) => {
        //     bullet.destroyBullet();
        //     this.cameras.main.shake(100, 0.01);
        //     // Flash the color white for 300ms
        //     this.cameras.main.flash(300, 255, 10, 10, false,);
        //     this.points -= 10;
        //     this.scene.get("HudScene")
        //         .update_points(this.points);
        // });

        // This event comes from MenuScene
        this.game.events.on("start-game", () => {
            this.scene.stop("MenuScene");
            //this.scene.launch("HudScene", { remaining_time: this.game_over_timeout });
            //this.player.start();
            // this.enemy_blue.start();

            // Game Over timeout
            // this.time.addEvent({
            //     delay: 2000,
            //     loop: true,
            //     callback: () => {
            //         if (this.game_over_timeout === 0) {
            //             // You need remove the event listener to avoid duplicate events.
            //             this.game.events.removeListener("start-game");
            //             // It is necessary to stop the scenes launched in parallel.
            //             this.scene.stop("HudScene");
            //             this.scene.start("GameOverScene", { points: this.points });
            //         } else {
            //             this.game_over_timeout--;
            //             this.scene.get("HudScene").update_timeout(this.game_over_timeout);
            //         }
            //     }
            // });
        });
    }

    getCollisionObject(bodyA, bodyB, label) {
        const playerBody = this.playerController.body;
        const left = this.playerController.sensors.left;
        const right = this.playerController.sensors.right;
        const bottom = this.playerController.sensors.bottom;
        const top = this.playerController.sensors.top;
        if ((bodyA === top && bodyB.label === label) || (bodyB === top && bodyA.label === label)) {
            return (bodyA.label === label ? bodyA : bodyB);
        }
        if ((bodyA === bottom && bodyB.label === label) || (bodyB === bottom && bodyA.label === label)) {
            return (bodyA.label === label ? bodyA : bodyB);
        }
        if ((bodyA === left && bodyB.label === label) || (bodyB === left && bodyA.label === label)) {
            return (bodyA.label === label ? bodyA : bodyB);
        }
        if ((bodyA === right && bodyB.label === label) || (bodyB === right && bodyA.label === label)) {
            return (bodyA.label === label ? bodyA : bodyB);
        }
        return false
    }

    update(time, delta) {
        // this.player.update();
        // this.enemy_blue.update();

        // // Player movement entries

        // if (this.cursors.down.isDown) {
        //     this.player.move("down");
        // }
        // if (this.cursors.left.isDown) {
        //     this.player.move("left");
        // }
        // if (this.cursors.right.isDown) {
        //     this.player.move("right");
        // }

        const matterSprite = this.playerController.matterSprite;

        // Player death
        // if (matterSprite.y > this.map.heightInPixels)
        //     {
        //         matterSprite.destroy();
        //         this.playerController.matterSprite = null;
        //         this.restart();
        //         return;
        //     }


        // Horizontal movement
        let oldVelocityX;
        let targetVelocityX;
        let newVelocityX;

        if (this.cursors.left.isDown && !this.playerController.blocked.left)
        {
            this.smoothedControls.moveLeft(delta);
            if (!this.playerController.blocked.bottom) {
                matterSprite.anims.play('jump-left', true);
            }
            else {
                matterSprite.anims.play('left', true);
            }

            // Lerp the velocity towards the max run using the smoothed controls. This simulates a
            // player controlled acceleration.
            oldVelocityX = matterSprite.body.velocity.x;
            targetVelocityX = -this.playerController.speed.run;
            newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, -this.smoothedControls.value);

            matterSprite.setVelocityX(newVelocityX);
        }
        else if (this.cursors.right.isDown && !this.playerController.blocked.right)
        {
            this.smoothedControls.moveRight(delta);
            if (!this.playerController.blocked.bottom) {
                matterSprite.anims.play('jump-right', true);
            }
            else {
                matterSprite.anims.play('right', true);
            }

            // Lerp the velocity towards the max run using the smoothed controls. This simulates a
            // player controlled acceleration.
            oldVelocityX = matterSprite.body.velocity.x;
            targetVelocityX = this.playerController.speed.run;
            newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, this.smoothedControls.value);

            matterSprite.setVelocityX(newVelocityX);
        }
        else if (this.playerController.blocked.bottom)
        {
            this.smoothedControls.reset();

            if (matterSprite.frame.name < 10)
                {
                    matterSprite.anims.play('idle-right', true);
                }
            else
                {
                    matterSprite.anims.play('idle-left', true);
                }
        }
        else
        {
            //(matterSprite.body.velocity.x > 0)
            if (matterSprite.frame.name < 10)
            {
                matterSprite.anims.play('jump-right', true)
            }
            else
            {
                matterSprite.anims.play('jump-left', true)
            }

        }

        // Jumping & wall jumping

        // Add a slight delay between jumps since the sensors will still collide for a few frames after
        // a jump is initiated
        const canJump = (time - this.playerController.lastJumpedAt) > 250;
        if (this.cursors.up.isDown & canJump)
        {

            if (this.playerController.blocked.bottom || this.playerController.blocked.left || this.playerController.blocked.right) {
                this.jump_sound.play(); //empêcher de jouer le son plusieurs fois
                //console.log(this.jump_sound);
            }

            if (this.playerController.blocked.bottom)
            {
                matterSprite.setVelocityY(-this.playerController.speed.jump);
                this.playerController.lastJumpedAt = time;
            }
            else if (this.playerController.blocked.left)
            {
                // Jump up and away from the wall
                matterSprite.setVelocityY(-this.playerController.speed.jump);
                matterSprite.setVelocityX(this.playerController.speed.run);
                this.playerController.lastJumpedAt = time;
            }
            else if (this.playerController.blocked.right)
            {
                // Jump up and away from the wall
                matterSprite.setVelocityY(-this.playerController.speed.jump);
                matterSprite.setVelocityX(-this.playerController.speed.run);
                this.playerController.lastJumpedAt = time;
            }
        }

        this.smoothMoveCameraTowards(matterSprite, 0.9);

    }
    smoothMoveCameraTowards (target, smoothFactor)
    {
        if (smoothFactor === undefined) { smoothFactor = 0; }
        this.cam.scrollX = smoothFactor * this.cam.scrollX + (1 - smoothFactor) * (target.x - this.cam.width * 0.5);
        this.cam.scrollY = smoothFactor * this.cam.scrollY + (1 - smoothFactor) * (target.y - this.cam.height * 0.5);
    }

    // restart ()
    // {
    //     this.cam.fade(500, 0, 0, 0);
    //     this.cam.shake(250, 0.01);

    //     this.time.addEvent({
    //         delay: 500,
    //         callback: function ()
    //         {
    //             this.cam.resetFX();
    //             this.scene.stop();
    //             this.scene.start('MainScene');
    //         },
    //         callbackScope: this
    //     });
    // }
}




class SmoothedHorionztalControl {
    constructor(speed) {
        this.msSpeed = speed;
        this.value = 0;
    }

    moveLeft(delta) {
        if (this.value > 0) { this.reset(); }
        this.value -= this.msSpeed * delta;
        if (this.value < -1) { this.value = -1; }
    }

    moveRight(delta) {
        if (this.value < 0) { this.reset(); }
        this.value += this.msSpeed * delta;
        if (this.value > 1) { this.value = 1; }
    }

    reset() {
        this.value = 0;
    }
}
