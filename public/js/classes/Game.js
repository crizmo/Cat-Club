export default class Game extends Phaser.Game {
  constructor(config, data=null) {
    super(config);
    this.global = data;
  }
}
