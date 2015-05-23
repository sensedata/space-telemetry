
// VCAP_* indicated IBM BlueMix
// process.env.PORT indicates Heroku
var port = process.env.VCAP_APP_PORT || process.env.PORT || 6001;
var host = process.env.VCAP_APP_HOST || '0.0.0.0';

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

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
server.listen(port, host, function () {

  // print a message when the server starts listening
  console.log('server starting on host: ' + host + ', port: ' + port);
});

var ls = require('./lightstreamer');

var db = require('./db');

// 'stopper' function to prevent stats calcs if no clients connected
function ioHasClients(data) {

  return io.engine.clientsCount > 0;
}
// Real-time data stream.  emit to all connected clients.
//
ls.dataStream.fork().filter(ioHasClients).each(function (data) {

  var temp;

  db.addCurrentStats(data, function (err, data1) {

    if (Array.isArray(data1)) {

      data1 = data1.map(function (v) {

        var cpy = utils.clone(v);
        // prune unnecessary for client data
        delete cpy.cv;
        delete cpy.sid;
        return cpy;
      });

      io.emit(data1[0].k, data1);

    } else {

      temp = utils.clone(data1);
      // prune unnecessary for client data
      delete temp.cv;
      delete temp.sid;

      io.emit(temp.k, [temp]);
    }
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
});
