import Packet from './../Packet.js';

export default class Scene1 extends Phaser.Scene {

  constructor() {
    super({key: 'Scene1'});
  }

  preload() {
    // root is the public folder
    this.load.image('atlas', './assets/atlases/atlas.png'); // aka the tileset
    this.load.tilemapTiledJSON('map2', './js/map.json');
    this.load.spritesheet('player', './assets/spritesheets/spaceman.png', {
      frameWidth: 16, frameHeight: 16
    });

  }

  create() {
    this._makeAnims();
    this.cursors = this._createKeyListener();

    this._drawTilemap();
    this.map.setCollisionBetween(118, 120);

    this.packet = new Packet(); // local version of player
    this.playerSprites = {};
    this.playerPos = {};

    this._connect();

    this.info = this.add.text(16, 16, 'Active Players', {
        fontSize: '18px',
        fill: '#ffffff'
    }).setScrollFactor(0);
    this.info.depth = 2;
  }

  update(time, delta) {
    this.info.setText('Active Players: ' + Object.keys(this.playerPos).length);

    if (this.cursors.C.isDown) {
      this.collisionLayer.alpha = 0.5;
    } else if (this.cursors.X.isDown) {
      this.collisionLayer.alpha = 0;
    }

    let v = 300;

    this.packet.anim = 'stop';
    this.packet.vx = 0;
    this.packet.vy = 0;
    // vertical movement
    if (this.cursors.up.isDown || this.cursors.W.isDown) {
      this.packet.vy = -v;
      this.packet.anim = 'up';
    } else if (this.cursors.down.isDown || this.cursors.S.isDown) {
      this.packet.vy = v;
      this.packet.anim = 'down';
    }
    // horizontal movement
    if (this.cursors.left.isDown || this.cursors.A.isDown) {
      this.packet.vx = -v;
      this.packet.anim = 'left';
    } else if (this.cursors.right.isDown || this.cursors.D.isDown) {
      this.packet.vx = v;
      this.packet.anim = 'right';
    }


    for (let id in this.playerSprites) {
      let sprite = this.playerSprites[id];
      if (sprite == this.player) {

        sprite.body.setVelocityX(this.playerPos[id].vx);
        sprite.body.setVelocityY(this.playerPos[id].vy);
      } else {
        sprite.x = this.playerPos[id].x;
        sprite.y = this.playerPos[id].y;
      }


      if (this.playerPos[id].anim === 'stop') {
        sprite.anims.stop();
      } else {
        sprite.anims.play(this.playerPos[id].anim, true);
      }

    }

    if (this.player) {
      this.packet.x = this.player.x;
      this.packet.y = this.player.y;
    }

    this.socket.emit('update', this.packet);
  }

  // --- private helper methods ---
  _drawTilemap() {
    this.map = this.add.tilemap('map2');
    this.tileset = this.map.addTilesetImage('atlas');

    this.layer0 = this.map.createStaticLayer('background', this.tileset);
    this.layer0.setScale(3);

    this.layer1 = this.map.createStaticLayer('terrain', this.tileset);
    this.layer1.setScale(3);

    this.layer2 = this.map.createStaticLayer('tree1', this.tileset);
    this.layer2.setScale(3);

    this.spriteLayer = this.physics.add.group();

    this.layer3 = this.map.createStaticLayer('tree2', this.tileset).setScale(3);
    this.layer3.depth = 1;

    this.collisionLayer = this.map.createStaticLayer('collision', this.tileset);
    this.collisionLayer.setScale(3);
    this.collisionLayer.depth = 2;
    this.collisionLayer.alpha = 0;
  }

  _makeAnims() {
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 9 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('player', { start: 11, end: 13 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 6 }),
      frameRate: 10,
      repeat: -1
    });
  }

  _createKeyListener() {
    let tmp = this.input.keyboard.createCursorKeys();
    tmp.W = this.input.keyboard.addKey(87);
    tmp.A = this.input.keyboard.addKey(65);
    tmp.S = this.input.keyboard.addKey(83);
    tmp.D = this.input.keyboard.addKey(68);

    tmp.C = this.input.keyboard.addKey(67);
    tmp.X = this.input.keyboard.addKey(88);
    return tmp;
  }



  // --- networking methods ---
  _connect() {
    this.socket = io();
    this.socket.on('connect', () => this.socket.emit('askToJoin'));
    this.socket.on('init', (players) => this._init(players));
    this.socket.on('newPlayer', (data) => this._addPlayer(data));
    this.socket.on('deletePlayer', (id) => this._deletePlayer(id));
    this.socket.on('update', (map) => this.playerPos = map);
  }

  _init(players) {
    for (let id in players) {
      let p = players[id];
      this.playerSprites[id] = this.physics.add.sprite(p.x, p.y, 'player', 1);
      this.playerSprites[id].setScale(3);

      this.spriteLayer.add(this.playerSprites[id]);
    }
    this.player = this.playerSprites[this.socket.id];

    this.physics.add.collider(this.playerSprites[this.socket.id], this.collisionLayer);

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels * 3, this. map.heightInPixels * 3);
    this.cameras.main.startFollow(this.player);

    this.packet.x = this.player.x;
    this.packet.y = this.player.y;

    this.playerPos = players;
  }

  _addPlayer(data) {
    let p = data.player;
    this.playerSprites[data.id] = this.physics.add.sprite(p.x, p.y, 'player', 1);
    this.playerSprites[data.id].setScale(3);
  }

  _deletePlayer(id) {
    this.playerSprites[id].destroy();
    delete this.playerSprites[id];
  }

}
