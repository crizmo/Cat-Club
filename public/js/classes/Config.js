export default class Config {

  anim(anims, key, sprite, frameArr, frameRate) {
    return {
      key: key,
      frames: anims.generateFrameNumbers('player', {
        frames: frameArr
      }),
      frameRate: frameRate,
      repeat: -1,
    };
  }

}
