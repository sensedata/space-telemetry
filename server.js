/*jshint node:true*/
/*jshint loopfunc:true */

// VCAP_* indicated IBM BlueMix
// process.env.PORT indicates Heroku
var port = (process.env.VCAP_APP_PORT || process.env.PORT || 6001),
    host = (process.env.VCAP_APP_HOST || '0.0.0.0');

var dd = require('./data_dictionary');

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
server.listen(port, host, function() {
	// print a message when the server starts listening
  console.log("server starting on host: " + host + ", port: " + port);
});

var ls = require('./lightstreamer');

var db = require('./db');

var utils = require('./utils');

var previousTIME_000001Value = 0;

// Real-time data stream.  emit to all connected clients.
var dataStream = ls.dataStream.fork().flatMap(db.addCurrentStats).each(function(data) {

  if (Array.isArray(data)) {

    data = data.map(function(v) {
      delete v['cv'];
      return v;
    });

    if (data[0].k === 296) {

      previousTIME_000001Value = data[0].v;
    }

    io.emit(data[0].k, data);

  } else {

    delete data['cv'];

    if (data[0].k === 296) {

      previousTIME_000001Value = data[0].v;
    }

    io.emit(data.k, [data]);
  }
});

// Real-time status stream.  emit to all connected clients.
var statusStream = ls.statusStream.fork().each(function(status) {

  io.emit('STATUS', status);
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

function bindTIME_000001Handler(socket, idx) {

  socket.on(296, function (intervalAgo, count) {

    var data = {
      k: 296,
      v: previousTIME_000001Value,
      t: previousTIME_000001Value,
      s: 24,
      m: 0,
      d: 0
    };

    socket.emit(296, [data]);
  });
}

io.on('connection', function (socket) {

  _('STATUS', socket, ['intervalAgo', 'count'])
  .flatMap(db.getStatuses).each(
    function (statuses) {

      socket.emit('STATUS',

        statuses.map(function(v) {

          return {c: v.connected, t: v.ts.getTime()/1000|0};
      }));
  });

  // create a handler for each telemetry type
  for(var i = 0, l = dd.list.length; i<l; i++) {

    // handle TIME_000001 differently
    if (i === 296) {

      bindTIME_000001Handler(socket);
    } else {

      bindDataHandler(socket, i);
    }
  }
});
