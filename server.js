
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

// Real-time data stream.  emit to all connected clients.
ls.dataStream.fork().flatMap(db.addCurrentStats).each(function (data) {
  var temp;

  if (Array.isArray(data)) {

    data = data.map(function (v) {

      var cpy = utils.clone(v);
      // prune unnecessary for client data
      delete cpy.cv;
      delete cpy.sid;
      return cpy;
    });

    io.emit(data[0].k, data);

  } else {

    temp = utils.clone(data);
    // prune unnecessary for client data
    delete temp.cv;
    delete temp.sid;

    io.emit(temp.k, [temp]);
  }
});

// Real-time status stream.  emit to all connected clients.
ls.statusStream.fork().each(function (status) {

  io.emit('STATUS', [status]);
  console.log(status);
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

  _('STATUS', socket, ['intervalAgo', 'count'])
  .flatMap(db.getStatuses).each(
    function (statuses) {

      socket.emit('STATUS',

        statuses.map(function (v) {

          return {c: v.connected, t: v.ts.getTime() / 1000 | 0};
        }));
    });

  // create a handler for each telemetry type
  for (var i = 0, l = dd.list.length; i < l; i++) {

    bindDataHandler(socket, i);
  }
});
