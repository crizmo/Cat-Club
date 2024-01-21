var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Packet = require('./server/Packet');

app.set('port', (process.env.PORT || 3000));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var players = {};

var world = {
  "littleroot": {},
  "oldale": {}
}

io.on('connection', (socket) => {
  /*
    sends updated position 48 times per second
  */
  setInterval(() => {
    io.to('littleroot').emit('update', world['littleroot']);
    io.to('oldale').emit('update', world['oldale']);
  }, 1000/48);


  socket.on('joinRoom', (data) => {
    let room = data.room;
    socket.join(room);
    // create new player at random location
    let p = new Packet(data);
    world[room][socket.id] = p;

    let init_e = 'init_' + room; // custom init event
    console.log(init_e);
    io.to(socket.id).emit(init_e, world[room]);
    socket.broadcast.to(room).emit('newPlayer', {
      id: socket.id,
      player: p
    });
  });

  socket.on('disconnect', () => {
    for (let room in world) {
      if (world[room][socket.id]) {
        let r = world[room][socket.id].room;
        delete world[room][socket.id];
        io.to(room).emit('deletePlayer', socket.id);
        break;
      }
    }
  });

  socket.on('update', (packet) => {
    world[packet.room][socket.id] = packet;
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    delete world[room][socket.id];
    io.to(room).emit('deletePlayer', socket.id);
  });


});

http.listen(app.get('port'), () => {
  console.log('listening on *:' + app.get('port'));
});
