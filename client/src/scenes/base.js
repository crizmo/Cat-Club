import Phaser from 'phaser'

import socket from '../socket';

export class BaseScene extends Phaser.Scene {

  movable = true;
  players = {};  // Add this line

  // --------------------------------------------------------------------------------------------------
  // CREATE
  create(tilemapKey) {
    // ----------------
    // MAP AND TILESET
    this.map = this.make.tilemap({ key: tilemapKey });

    // socket connection
    // this.socket = io('http://localhost:3001');
    this.socket = socket;
    this.socket.on('connect', () => {
      console.log('connected to server');
    });
    this.socket.on('disconnect', () => {
      console.log('disconnected from server');
    });

    // Listen for new player event
    this.socket.on('newPlayer', (playerInfo) => {
      this.players[playerInfo.id] = this.add.sprite(playerInfo.position.x, playerInfo.position.y, "atlas", "ariel-front");
    });

    // Listen for player moved event
    this.socket.on('playerMoved', (playerInfo) => {
      if (this.players[playerInfo.id]) {
        this.players[playerInfo.id].x = playerInfo.position.x;
        this.players[playerInfo.id].y = playerInfo.position.y;

        console.log(playerInfo.position);
        // animate the player movements
        if (playerInfo.position.movingLeft) {
          this.players[playerInfo.id].anims.play("ariel-left-walk", true);
        } else if (playerInfo.position.movingRight) {
          this.players[playerInfo.id].anims.play("ariel-right-walk", true);
        } else if (playerInfo.position.movingUp) {
          this.players[playerInfo.id].anims.play("ariel-back-walk", true);
        } else if (playerInfo.position.movingDown) {
          this.players[playerInfo.id].anims.play("ariel-front-walk", true);
        } else {
          this.players[playerInfo.id].anims.stop();
        }
      }
    });

    // Listen for user disconnected event
    this.socket.on('userDisconnected', (id) => {
      if (this.players[id]) {
        this.players[id].destroy();
        delete this.players[id];
      }
    });

    //const tileset = this.map.addTilesetImage("tileset", "TilesetImage");
    // With added margin and spacing for the extruded image:
    const tileset = this.map.addTilesetImage("tileset", "TilesetImage", 32, 32, 1, 2);

    // Map layers (defined in Tiled)
    this.map.createLayer("Ground1", tileset, 0, 0);
    this.map.createLayer("Ground2", tileset, 0, 0);
    this.map.createLayer("Collision1", tileset, 0, 0);
    this.map.createLayer("Collision2", tileset, 0, 0);
    this.map.createLayer("Above", tileset, 0, 0).setDepth(10);  // To have the "Above" layer sit on top of the player, we give it a depth.
    // The layer with wich the player will collide
    this.LayerToCollide = this.map.createLayer("CollisionLayer", tileset, 0, 0);
    this.LayerToCollide.setVisible(false);  // Comment out this line if you wish to see which objects the player will collide with

    // ----------------
    // PLAYER
    // Get the spawn point
    const spawnPoint = this.map.findObject("Objects", obj => obj.name === "Spawn Point");

    // Create the player and the player animations (see player.js)
    this.player = this.add.player(spawnPoint.x, spawnPoint.y, "atlas", "ariel-front")
    // lets push the player to the server
    this.socket.emit('newPlayer', { x: spawnPoint.x, y: spawnPoint.y, id: this.socket.id });


    // ----------------
    // CAMERA AND CURSORS
    const camera = this.cameras.main;
    camera.startFollow(this.player);
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = { // TODO FR OR EN ?
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      //w: this.input.keyboard.addKey('Z'),
      //a: this.input.keyboard.addKey('Q'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D'),
    }

    // Camera resize behavior
    this.scale.on('resize', this.resize, this);

    // ----------------
    // INTERACTIVE OBJECTS
    this.signs = [];
    this.showingSign = false;
    this.map.filterObjects("Objects", obj => {
      // DOORS
      if (obj.name === 'door') {
        this.add.door(Math.round(obj.x), Math.round(obj.y), obj.width, obj.height, obj.properties[0].value, obj.properties[1].value);
        // last 2: destination (str) and link (bool, if true leads to a redirect)
      }

      // SIGNS
      if (obj.name === 'sign') {
        this.signs.push(this.add.sign(obj.x, obj.y, obj.properties[1].value, obj.properties[0].value))
        // Last parameters are the text to show and the direction of the text in relation to the object
      }
    });

    this.events.on('break', this.catchDoBreak, this);
    this.events.on('position', this.getPlayerPosition, this);
  }

  getPlayerPosition() {
    this.events.emit('player', this.player);
  }

  catchDoBreak() {
    this.movable = !this.movable;
  }

  // ---------------------------------------------------
  resize(gameSize, baseSize, displaySize, resolution) {
    this.cameras.resize(gameSize.width, gameSize.height);
  }

  collide_with_world() {
    // Collision with the world layers. Has to come after the rest of the colliders in order for them to detect.
    // We need to call this at the end of the children's create
    this.physics.add.collider(this.player, this.LayerToCollide);
    this.LayerToCollide.setCollisionBetween(40, 41);

    // Set the player to collide with the world bounds
    this.player.body.setCollideWorldBounds(true);
    this.player.body.onWorldBounds = true;
  }

  // --------------------------------------------------------------------------------------------------
  // UPDATE
  update(time, delta) {
    let moveleft = false;
    let moveright = false;
    let moveup = false;
    let movedown = false;

    // Not movable? stop movement and return
    if (!this.movable) {
      this.player.update(moveleft, moveright, moveup, movedown);
      return false;
    }

    // ----------------
    // MOUSE MOVEMENT
    let pointer = this.input.activePointer;
    if (pointer.primaryDown && !window.mouseOverMenu) {
      // let pointerPosition = pointer.position;
      // So that the x and y update if the camera moves and the mouse does not
      let pointerPosition = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      // Horizontal movement
      if (Math.abs(pointerPosition.x - this.player.x) > 15) {  // To avoid glitching when the player hits the cursor
        if (pointerPosition.x > this.player.x) {
          moveright = true;
        } else if (pointerPosition.x < this.player.x) {
          moveleft = true;
        }
      }

      // Vertical movement
      if (Math.abs(pointerPosition.y - this.player.y) > 15) {  // To avoid glitching when the player hits the cursor
        if (pointerPosition.y > this.player.y) {
          movedown = true;
        } else if (pointerPosition.y < this.player.y) {
          moveup = true;
        }
      }
    }

    // ----------------
    // KEYBOARD MOVEMENT
    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.a.isDown) {
      moveleft = true;
    } else if (this.cursors.right.isDown || this.wasd.d.isDown) {
      moveright = true;
    }

    // Vertical movement
    if (this.cursors.up.isDown || this.wasd.w.isDown) {
      moveup = true;
    } else if (this.cursors.down.isDown || this.wasd.s.isDown) {
      movedown = true;
    }

    // Update player velocity and animation
    this.player.update(moveleft, moveright, moveup, movedown);

    // Emit player move event
    if (moveleft || moveright || moveup || movedown) {
      // this.socket.emit('playerMove', { x: this.player.x, y: this.player.y });
      this.socket.emit('playerMove', { x: this.player.x, y: this.player.y, movingLeft: moveleft, movingRight: moveright, movingUp: moveup, movingDown: movedown });
    } else {
      this.socket.emit('playerMove', { x: this.player.x, y: this.player.y, movingLeft: false, movingRight: false, movingUp: false, movingDown: false });
    }

    // ---------------------
    // INTERACTIVE OBJECTS
    // Hide the signs
    if (this.showingSign && (moveleft || moveright || moveup || movedown)) {
      this.signs.forEach((sign) => {
        if (sign.activated) sign.playerMovement(moveleft, moveright, moveup, movedown)
      });
    }

  }

}