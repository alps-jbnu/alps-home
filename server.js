//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var exphbs  = require('express-handlebars');
var session = require('express-session')(
  { secret: 'alps keyboard cat', resave: false, saveUninitialized: false }
);

var config = require('./config');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var flash = require('connect-flash');

router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
router.use(cookieParser());
router.use(session);
router.use(flash());
router.engine('handlebars', exphbs({defaultLayout: 'main'}));
router.set('view engine', 'handlebars');

// set-up passport
var passport = require('./passport')(router);

router.use('/', require('./routes/pages.routes'));
router.use('/boj', require('./routes/boj.routes'));
router.use(express.static(path.resolve(__dirname, 'client')));
router.use(require('./routes/alps.api.routes'));
router.use(require('./routes/user.routes'));

router.use(require('./routes/error.routes'));

// Database Connection
var mongoose = require('mongoose');
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    // CONNECTED TO MONGODB SERVER
    console.log("Connected to mongod server");
});
mongoose.connect('mongodb://localhost/' + config.database);

// Mail Service (send-grid) API KEY configure
console.log('SendGrid API KEY: ', config.SENDGRID_API_KEY);

// Chat Socket Connection
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
  messages.forEach(function (data) {
    socket.emit('message', data);
  });

  sockets.push(socket);

  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
    updateRoster();
  });

  socket.on('message', function (msg) {
    var text = String(msg || '');

    if (!text)
      return;

    socket.get('name', function (err, name) {
      var data = {
        name: name,
        text: text
      };

      broadcast('message', data);
      messages.push(data);
    });
  });

  socket.on('identify', function (name) {
    socket.set('name', String(name || 'Anonymous'), function (err) {
      updateRoster();
    });
  });
});

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

// Listen Server
server.listen(process.env.PORT || config.port, process.env.IP || config.ip || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
