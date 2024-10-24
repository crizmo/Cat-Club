import Game from './classes/Game.js';

import Scene1 from './classes/scenes/Scene1.js';
// All Scenes suffixed with _s
import Boot_s from './classes/scenes/Boot_s.js';
import Littleroot_s from './classes/scenes/Littleroot_s.js';
import Oldale_s from './classes/scenes/Oldale_s.js';

let config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT, // changed from Phaser.Scale.RESIZE to Phaser.Scale.FIT
    parent: 'main',
    autoCenter: Phaser.Scale.CENTER_BOTH, // added this line to center the game
    width: '100%',
    height: '100%',
  },
  autoRound: false,
  backgroundColor: '#2d2d2d',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [Boot_s, Littleroot_s, Oldale_s, Scene1],
  pixelArt: true,
  title: 'littleroot v0.3.0',
};


// global game data is stored inside the game Object
// and is global to all the scenes
let data = {
  socket: io(),
  state: 'something'
};

export var game = new Game(config, data);
