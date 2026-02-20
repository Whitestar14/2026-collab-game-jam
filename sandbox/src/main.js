import Phaser from "phaser";

// config options usually go here, although they could be easily defined directly
// in the function call to the Phaser.Game method
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

const game = new Phaser.Game(config);

// preload assets used in the game. spritesheets are loaded by specifying framewidth and height
// apparently
function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

let platforms;
/**
 * @type {{ setBounce: (arg0: number) => void; setCollideWorldBounds: (arg0: boolean) => void; body: { setGravityY: (arg0: number) => void; touching: { down: any; }; }; setVelocityX: (arg0: number) => void; anims: { play: (arg0: string, arg1: boolean | undefined) => void; }; setVelocityY: (arg0: number) => void; }}
 */
let player;
/**
 * @type {{ left: { isDown: any; }; right: { isDown: any; }; up: { isDown: any; }; }}
 */
let cursors;
let stars;

let score = 0;
let scoreText;
let bombs;

let gameOver = false;

/**
 * @this {{ preload: () => void; create: () => void; update: () => void; }}
 */
function create() {
    this.add.image(400, 300, 'sky');

    //create a static group holding all the static platform objects
    platforms = this.physics.add.staticGroup();

    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // create the sprite
    player = this.physics.add.sprite(100, 450, 'dude');

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // this sets how strong the player should experience gravity, the higher it is,
    // the faster it falls in freefall
    player.body.setGravityY(100);

    // add collision with other game objects like the platform
    this.physics.add.collider(player, platforms);

    // add some animations the sprite can use
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    })

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 }],
        frameRate: 20
    })

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    })

    //instantiate keyboard manager with phaser
    cursors = this.input.keyboard.createCursorKeys();

    stars=this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate((/** @type {{ setBounceY: (arg0: number) => void; }} */ child) => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
    })

    this.physics.add.collider(stars, platforms);

    // add challenge mechanic
    bombs = this.physics.add.group();

    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: "#000000", })
}

function update() {
    // update cursors in the update clause
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn')
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-400);
    }

    this.physics.add.overlap(player, stars, collectStar, null, this)
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('score: ' + score)

    if (stars.countActive(true) === 0) {
        stars.children.iterate((child) => {
            child.enableBody(true, child.x, 0, true, true);
        });

        let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        let bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

// hit bomb callback
function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');

    gameOver = true;
}
