const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 3001;

app.use(cors());

const players = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('newPlayer', (position) => {
        console.log('newPlayer', position);
        players[socket.id] = position;
        // Broadcast the new player to all other players
        socket.broadcast.emit('newPlayer', { id: socket.id, position });

        // Send existing players to the new player
        for (const playerId in players) {
            if (playerId !== socket.id) {
                socket.emit('newPlayer', { id: playerId, position: players[playerId] });
            }
        }
    });

    // Handle player movements
    // Handle player movements
    socket.on('playerMove', (data) => {
        players[socket.id] = data;
        // Broadcast the updated position to all other players
        socket.broadcast.emit('playerMoved', { id: socket.id, position: data });
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('User disconnected');
        delete players[socket.id];
        // Broadcast the disconnection to all other players
        socket.broadcast.emit('userDisconnected', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
