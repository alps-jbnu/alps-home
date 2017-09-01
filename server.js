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
var hbs = exphbs.create({
  defaultLayout: 'main',
  helpers      : require('./hbsHelpers')
});
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
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var flash = require('connect-flash');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser());
app.use(session);
app.use(flash());
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// set-up passport
var passport = require('./passport')(app);

// JNUPC PAGE
app.use('/JNUPC', require('./routes/jnupc.routes'));
app.use('/cupc', require('./routes/cupc.routes'));
app.use('/acm', require('./routes/acm.routes'));

app.use('/', require('./routes/pages.routes'));
app.use('/boj', require('./routes/boj.routes'));
app.use('/study', require('./routes/study.routes'));
app.use('/board', require('./routes/board.routes'));
app.use(express.static(path.resolve(__dirname, 'client')));
app.use(require('./routes/alps.api.routes'));
app.use(require('./routes/user.routes'));

app.use(require('./routes/error.routes'));

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

// set permission
var notAuthenticated = {
    flashType: 'error',
    message: '로그인이 필요한 서비스입니다.',
    redirect: '/login'
};
var notAuthorized = {
    flashType: 'error',
    message: '권한이 없습니다.',
    redirect: '/'
};
app.set('permission', {
    role: 'role',
    notAuthenticated: notAuthenticated,
    notAuthorized: notAuthorized
});

// generate admin account
if( process.env.GENERATE_ADMIN ){
  var userModel = require('./models/user');
  var randomPassword = Math.random().toString(36).substr(2);
  userModel.register(new userModel({
    username : 'admin',
    lastname : '관',
    firstname: '리자',
    role: 'admin'
  }), randomPassword, function(err, user) {
    if(err || !user)
      console.error('Failed to generate admin.', err);
    else
      console.log('Generated admin account. password is \'' + randomPassword + '\'');
  });
}

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
