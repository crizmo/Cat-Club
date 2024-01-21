/*
  This object represents a player in the game and is also a packet that will
  be sent from the server the client.
*/
class Packet {
  constructor(data) {
    let ts = 2 * 16; // tilesize * scale factor

    // entering from boot
    if (data.prevXY == 0) {
      this.player = {
        x: ts*9  + Math.floor(Math.random() * ts*8), // 9 - 17
        y: ts*13 + Math.floor(Math.random() * ts*6), // 13 - 19
        anim: 'stop_D'
      }
    } else { // entering from littleroot
      if (data.prevXY.y < 0) {
        this.player = {
          x: data.prevXY.x,
          y: 1550,
          anim: 'stop_D'
        };
      } else if (data.prevXY.y > 0) { // entering from oldale
        this.player = {
          x: data.prevXY.x,
          y: 50,
          anim: 'stop_U'
        };
      } else {
        this.player = {
          x: ts*9  + Math.floor(Math.random() * ts*8), // 9 - 17
          y: ts*13 + Math.floor(Math.random() * ts*6), // 13 - 19
          anim: 'stop_D'
        }
      }
    }
    this.room = data.room;

  }


}
module.exports = Packet;
