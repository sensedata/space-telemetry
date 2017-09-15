// process.env.PORT indicates Heroku
var port = process.env.PORT || 5000;
var host = '0.0.0.0';

var notify = require('./notification');

process.on('uncaughtException', function (err) {
  // log error
  console.error(err.stack || err);
  // notify error
  notify.error(err);
  // exit the process since we are now in a unknown state
  process.exit(1);
});

var dd = require('./data_dictionary');

var utils = require('./utils');

// This application uses express as it's web server
// for more info, see: http://expressjs.com
var express = require('express');

var _ = require('highland');

// create a new express server
var app = exports.app = express();

var server = exports.server = require('http').createServer(app);

// use socket.io for real-time
var io = exports.io = require('socket.io')(server);

var rss = require("./rss");

app.get('/rss.xml', function(req, res, next) {

  res.set("Content-Type", "application/rss+xml");
  res.send(rss.getRss());
});

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/../public'));

// start server on the specified port and binding host
server.listen(port, host, function () {

  // print a message when the server starts listening
  console.log('server starting on host: ' + host + ', port: ' + port);

  notify.info('server started');
});

var ls = require('./lightstreamer');

var db = require('./db');

require('./db-maintenance');

// 'stopper' function to prevent stats calcs if no clients connected
function ioHasClients(data) {

  return io.engine.clientsCount > 0;
}
// Real-time data stream.  emit to all connected clients.
//
ls.dataStream.fork().filter(ioHasClients).each(function (data) {

  db.addTelemetryStats(data, function (err, data1) {

    data1 = data1.map(function (v) {

      var cpy = utils.clone(v);
      // prune unnecessary for client data
      delete cpy.cv;
      delete cpy.sid;
      return cpy;
    });

    io.emit(data1[0].k, data1);
  });
});

function bindDataHandler(socket, idx) {

  _(idx.toString(), socket, ['intervalAgo', 'count'])
  .flatMap(db.getTelemetryData(idx))
  .flatMap(db.addStats(idx)).each(
    function (data) {

      socket.emit(idx, data);
    });
}

io.on('connection', function (socket) {
  // create a handler for each telemetry type
  for (var i = 0, l = dd.list.length; i < l; i++) {

    bindDataHandler(socket, i);
  }

  // broadcast the latest status on connection
  _([{intervalAgo: 0, count: -1}])
  .flatMap(db.getTelemetryData('297'))
  .flatMap(db.addStats('297')).each(
    function (data) {

      socket.emit(297, data);
    });
});
