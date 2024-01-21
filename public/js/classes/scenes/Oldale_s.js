import Packet from './../Packet.js';
import Config from './../Config.js'
import { game } from './../../main.js';

export default class Oldale extends Phaser.Scene {
  /*
    note to self: the constructor is only run once.
    when toggling between scenes, put all methods that
    deal with reinitialization in the init method
  */
  constructor() {
    super({ key: 'Oldale_s'});
    this.room = 'oldale';
    this.lastDir = 'D'; // last direction movement occurred
    /*
    this.playerSprites: a map of all player sprites
    the keys of the map are socket IDs

    this.packet: all data is stored here to upload to server

    this.packets:
    */
  }

  init(data) {
    this.fromPrevScene = data;
    this.lastDir = data.dir;
    this.player = {
      x: 1,
      y: 1
    };
  }

  preload() {
    this.load.tilemapTiledJSON('map2', './js/map_oldale.json');
  }

  create() {
    // configuration
    this.game = this.sys.game;
    this.config = new Config();

    // input
    this.input.keyboard.on('keydown_M', (e) => {
      if (this.game.global.music.isPlaying) {
        this.game.global.music.pause();
      } else {
        this.game.global.music.resume();
      }
    });

    this.cursors = this._createKeyListener();
    // tilemap
    this.scaleFactor = 2;
    this._drawTilemap();
    this.map.setCollisionBetween(0, 1);
    this.input.keyboard.on('keydown_C', (e) => {
        let a = this.collisionLayer.alpha;
        this.collisionLayer.alpha = -a + 0.5;
    });

    let animframe = 'stop_' + this.fromPrevScene.dir;
    this.packet = new Packet(0, 0, animframe, this.room); // local version of player
    this.playerSprites = {};
    this.packets = {};

    this.info = this.add.text(16, 16, 'Active Players', {
        fontSize: '18px',
        fill: '#ffffff'
    }).setScrollFactor(0);
    this.info.depth = 2;
    // websocket setup
    this._connect();
  }

  update(time, delta) {
    let numOnline = Object.keys(this.packets).length;
    this.info.setText('Oldale Town\nOnline: ' + numOnline);

    this._checkKeys();


    for (let id in this.playerSprites) {
      let currSprite = this.playerSprites[id];

      if (this.packets[id]) {

        let p = this.packets[id].player;
        // assign position data from packets (server) to
        // all sprites but the local one
        if (currSprite != this.player) {
          currSprite.x = p.x;
          currSprite.y = p.y;
        }

        if (p.anim.slice(0,4) == 'stop') {
          if (p.anim.slice(-1) == 'D') {
            currSprite.setFrame(0);
          } else if (p.anim.slice(-1) == 'L') {
            currSprite.setFrame(6);
          } else if (p.anim.slice(-1) == 'U') {
            currSprite.setFrame(12);
          }else if (p.anim.slice(-1) == 'R') {
            currSprite.setFrame(18);
          }

          currSprite.anims.stop();
        } else {
          currSprite.anims.play(p.anim, true);
        }

      }
    }

    // send updated position to server
    this.packet.player.x = this.player.x;
    this.packet.player.y = this.player.y;
    this.socket.emit('update', this.packet);

    // if you try to exit scene at the top of update(), it will
    // finish the update and then exit, so exit scenes at the end
    if (this.packet.player.y > this.map.heightInPixels * this.scaleFactor) {
      this._exit();
    }
  }

  // --- private helper methods ---
  _drawTilemap() {
    this.map = this.add.tilemap('map2');
    this.tileset = this.map.addTilesetImage('atlas_pokemon');
    this.layer0 = this.map.createStaticLayer('ground', this.tileset);
    this.layer0.setScale(this.scaleFactor);
    this.layer1 = this.map.createStaticLayer('structures', this.tileset);
    this.layer1.setScale(this.scaleFactor);
    this.spriteLayer = this.physics.add.group();
    this.layer2 = this.map.createStaticLayer('fringe', this.tileset);
    this.layer2.setScale(this.scaleFactor);
    this.layer2.depth = 1;
    this.collisionLayer = this.map.createStaticLayer('collision', this.tileset);
    this.collisionLayer.setScale(this.scaleFactor);
    this.collisionLayer.depth = 2;
    this.collisionLayer.alpha = 0;
  }



  _createKeyListener() {
    let a = this.input.keyboard.createCursorKeys();
    let b = this.input.keyboard.addKeys('W,A,S,D,C,X');

    // merges arrows and WASD objects into one
    let tmp = Object.assign({}, a, b);

    for (let key in tmp) {
      tmp[key].reset();
    }
    return tmp;
  }

  /*
    This private method checks if keys are pressed
    and changes velocity accordingly
  */
  _checkKeys() {
    let a = this.packet.player.anim; // previous animation
    this.packet.player.anim = 'stop_' + this.lastDir;

    let vec = new Phaser.Math.Vector2(0, 0);
    // vertical movement
    if (this.cursors.up.isDown || this.cursors.W.isDown) {
      vec.y = -1;
      this.packet.player.anim = 'U_mt';
      this.lastDir = 'U';
    } else if (this.cursors.down.isDown || this.cursors.S.isDown) {
      vec.y = 1;
      this.packet.player.anim = 'D_mt';
      this.lastDir = 'D';
    }
    // horizontal movement (give priority to rightward movement)
    if (this.cursors.right.isDown || this.cursors.D.isDown) {
      vec.x = 1;
      this.packet.player.anim = 'R_mt';
      this.lastDir = 'R';
   } else if (this.cursors.left.isDown || this.cursors.A.isDown) {
      vec.x = -1;
      this.packet.player.anim = 'L_mt';
      this.lastDir = 'L';
    }

    vec.normalize().scale(250) // velocity;
    if (this.player && this.player.body) {
      this.player.body.setVelocity(vec.x, vec.y);
    }
  }


  // --- networking methods ---

  /*
    This method connects socket to server if not already connected
    and sets up callback functions. Also tells server to join the
    room 'oldale'.
  */
  _connect() {
    this.socket = this.game.global.socket;
    if (this.socket.connected) {
      this.socket.emit('joinRoom', {
        room: this.room,
        prevXY: this.fromPrevScene
      });
    }
    this.socket.on('init_oldale', (players) => this._init(players));
    this.socket.on('newPlayer', (data) => this._addPlayer(data));
    this.socket.on('deletePlayer', (id) => this._deletePlayer(id));
    this.socket.on('update', (map) => this.packets = map);
  }

  /*
    This method is executed when the player leaves the area.
    Destroy all objects from this scene and transition to new scene.
  */
  _exit() {
    for (let id in this.playerSprites) {
      this.playerSprites[id].destroy();
      delete this.playerSprites[id];
    }
    this.socket.emit('leaveRoom', this.room);
    this.scene.start('Littleroot_s', {
      x: this.player.x,
      y: this.player.y,
      dir: 'D'
    });

    this.socket.off('init_oldale');
    this.socket.off('newPlayer');
    this.socket.off('deletePlayer');
    this.socket.off('update');
  }

  /*
    description
  */
  _init(players) {
    for (let id in players) {
      let p = players[id].player;
      this.playerSprites[id] = this.physics.add.sprite(p.x, p.y, 'player', 1);
      this.playerSprites[id].setScale(this.scaleFactor);
      this.spriteLayer.add(this.playerSprites[id]);
    }

    this.player = this.playerSprites[this.socket.id];
    this.player.body.setVelocity(0, 0);
    // ADJUST HITBOX
    this.player.body.setSize(15, 10, false);
    this.player.body.setOffset(1, 14);

    //this.player.setCollideWorldBounds(true);
    //this.player.setOrigin(0, 0.35);
    //this.player.body.setSize(10, 10, true);

    this.physics.add.collider(this.playerSprites[this.socket.id], this.collisionLayer);

    this.cameras.main.setBounds(0, 0,
      this.map.widthInPixels * this.scaleFactor,
      this.map.heightInPixels * this.scaleFactor
    );

    this.cameras.main.startFollow(this.player);

    this.packet.player.x = this.player.x;
    if (this.player.y > 0) {
      this.packet.player.y = this.player.y;
    } else {
      this.packet.player.y = 0;
    }


    this.packets = players;
  }

  _addPlayer(data) {
    let p = data.player.player;
    if (this.physics.add) {
      this.playerSprites[data.id] = this.physics.add.sprite(p.x, p.y, 'player', 1);
      this.playerSprites[data.id].setScale(this.scaleFactor);
    }
  }

  _deletePlayer(id) {
    if (this.playerSprites[id]) {
      this.playerSprites[id].destroy();
      delete this.playerSprites[id];
    }
  }

}
