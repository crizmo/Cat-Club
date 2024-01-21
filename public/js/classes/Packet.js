/*
  This class represents a data packet that used to send data
  from the client to the server.
*/
export default class Packet {
  constructor(x=0, y=0, anim='stop_D', room) {
    this.player = {
      x: x,
      y: y,
      anim: anim
    },
    this.room = room;
  }
}
