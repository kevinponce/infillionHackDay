var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');

let socketConfig = {};
if (process.env.SOCKET_IO_URL && process.env.SOCKET_IO_URL.includes('localhost')) {
  socketConfig = {
    cors: {
      origin: "http://localhost:8080",
      methods: ["GET", "POST"]
    }
  };
}

var io = require('socket.io')(server, socketConfig);
var players = {};

app.use(express.static(path.join(__dirname, '../../public')));
app.use('/assets',express.static(path.join(__dirname, '../../assets')));
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../../build/index.html'));
});

app.get('/vendor.js', function (req, res) {
  res.sendFile(path.join(__dirname, '../../build/vendor.js'));
});

app.get('/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, '../../build/main.js'));
});

io.on('connection', socket => {
  socket.emit('currentPlayers', players);

  socket.on('disconnect', function () {
    io.emit('deletePlayer', socket.id);
    delete players[socket.id];
  });

  socket.on('newPlayer', player => {
    players[socket.id] = player;

    Object.keys(players).forEach(socketId => {
      io.emit('newPlayer', {
        socketId: socket.id,
        player,
      });
    })
  });

  socket.on('updatePlayer', player => {
    Object.keys(players).forEach(socketId => {
      if (socketId !== player.id) {
        io.emit('updatePlayer', player);
      }
    });
    
  })
});

server.listen(process.env.PORT || 8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
