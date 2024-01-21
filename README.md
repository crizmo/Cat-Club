# CatClub

### Features & ToDo
- [x] Multiple players can join the game
- [x] Maps are can be created/edited with [Tiled Map Editor](https://www.mapeditor.org/)
- [x] Multiple levels/maps

### How to install
```
// Clone this repository

// Go to the client folder and install all modules
$ cd client && npm install

// Go to the server folder and install all modules
$ cd ../server && npm install

// Start the server
$ node server.js

// Open a new terminal and navigate to the client folder and start the webpack server
$ cd client && npm start
```
After successfully install go to [http://localhost:8080](http://localhost:8080/)

### Known bugs
**Online players won't load in new level (50% fixed, needs help with this bug..)**\
When a player enters a new level/map the [Phaser Scene](https://photonstorm.github.io/phaser3-docs/Phaser.Scene.html) reloads and a new tilemap will be loaded.
But the current players in that map will not be loaded in that level ([see Code](https://github.com/crizmo/Cat-Club/blob/master/client/src/Scene2.js#L107)).

*See GIF example below*
![Know bug example](https://github.com/crizmo/Cat-Club/blob/master/docs/images/PokeMMO-know-bug.gif?raw=true)
