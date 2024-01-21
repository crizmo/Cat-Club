import Config from './../Config.js'

export default class Boot_s extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot_s' });
  }

  init(data) {
    this.s = data;
  }

  preload() {
    // tile atlas
    this.load.image('atlas_pokemon', './assets/atlases/atlas_pokemon.png');
    // male sprite
    this.load.spritesheet('player', './assets/spritesheets/male_trainer.png', {
      frameWidth: 16,
      frameHeight: 24
    });
    // https://soundcloud.com/rsesoundtrack/littleroot-town
    this.load.audio('littleroot', './assets/sounds/littleroot-town.mp3');
  }

  create() {
    this.cameras.main.setBackgroundColor('#C78283')
    this.info = this.add.text(16, 16, 'Boot Scene', {
      fontSize: '18px',
      fill: '#000000'
    });

    let tutorial = 'Press SPACE to Continue.\n'
      + 'Move with arrow keys or WASD.\n'
      + 'Toggle music by pressing M.\n'
      + 'Reveal collision layer by pressing C.';

    this.instr = this.add.text(150, 200, tutorial, {
      fontSize: '24px',
      fill: '#000000'
    });
    
    this.input.keyboard.on('keydown-SPACE', (e) => {
      console.log('space');
      this.scene.start('Littleroot_s', 0);
    });

    this.config = new Config();
    this._makeAnims();

    // music
    this.music = this.sound.add('littleroot');
    this.music.setLoop(true);
    this.music.play();
    this.music.pause();


    this.sys.game.global.music = this.music;
    // input
  }

  update() {

  }

  _makeAnims() {
    // animations Down, Left, Up, Down (mt > male trainer)
    this.anims.create(this.config.anim(this.anims, 'D_mt', 'player',
      [0, 1, 0, 2], 10));
    this.anims.create(this.config.anim(this.anims, 'L_mt', 'player',
      [6, 7, 6, 8], 10));
    this.anims.create(this.config.anim(this.anims, 'U_mt', 'player',
      [12, 13, 12, 14], 10));
    this.anims.create(this.config.anim(this.anims, 'R_mt', 'player',
      [18, 19, 18, 20], 10));
  }

}
