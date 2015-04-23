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

var previousIdxTimeHash = {};

var dataStream = ls.dataStream.fork().each(function(data) {
  
  db.selectStatsByIdx(data.i, function(err, res) {
    var avg = 0,
    stddev = 0,
    previousTime = previousIdxTimeHash[data.i],
    sdd = 0;
    
    if (err) { return; }
    
    if ((res.rows.length > 0) && previousTime) {
      
      avg = res.rows[0].a;
      stddev = res.rows[0].sd;
      sdd = utils.calcStandardDeviationDistance(data.t - previousTime, avg, stddev);
    }
    
    previousIdxTimeHash[data.i] = data.t;
    
    io.emit(data.i, [ {v: data.v, t: data.t, s: data.s, ti_avg: avg, ti_sdd: sdd} ]);
  });
  
  // console.log(data);
});

var lastKnownStatus;

var statusStream = ls.statusStream.fork().each(function(status) {

  lastKnownStatus = status;
  
  io.emit('STATUS', status);
  console.log(status);
});


function emitRows(socket, idx, rows) {
  
  var data = rows.map(function(v) { return {v: v.value, t: v.ts.getTime()/1000|0, s: v.status}; }),
  dataLen = data.length;
  
  db.selectStatsByIdx(idx, function(err, res) {
    var avg = 0,
    stddev = 0,
    sdd = 0;
    
    if (err) { return; }
    
    if ((res.rows.length > 0) && (dataLen > 1)) {
      
      avg = res.rows[0].a;
      stddev = res.rows[0].sd;
      sdd = utils.calcStandardDeviationDistance(data[dataLen-1].t - data[dataLen-2].t, avg, stddev);
    }

    data[dataLen-1].ti_avg = avg;
    data[dataLen-1].ti_sdd = sdd;
    
    socket.emit(idx, data);    
  });
}

io.on('connection', function (socket) {
  // broacast status to client upon connection
  if (lastKnownStatus) {
    
    socket.emit('STATUS', lastKnownStatus);
  }

  // broadcast status when requested
  socket.on('STATUS', function (intervalAgo, count) {
    
    db.selectStatusesByIntervalAgoCount(intervalAgo, count, function(err, res) {
      
      if (err) { return; }

      socket.emit('STATUS', res.rows.map(function(v) { return {c: v.connected, t: v.ts.getTime()/1000|0}; }));
    });
  });

  // create a handler for each telemetry type
  for(var i = 0, l = dd.list.length; i<l; i++) {

    // creating functions within the loop is ok, in this case
    (function (idx) {

      socket.on(idx, function (intervalAgo, count) {
        // unixtime of -1 indicates the client wants the latest record available
        if(count === -1) {

          db.selectMostRecentByIdx(idx, function(err, res) {

            if (err) { return; }

            emitRows(socket, idx, res.rows);
          });

        } else {
          // get a list of records later than intervalAgo of a idx
          db.selectMostRecentByIdxIntervalAgoCount(idx, intervalAgo, count, function(err, res) {

            if (err) { return; }

            // if no records found, get the latest
            if (res.rows.length === 0) {

              db.selectMostRecentByIdx(idx, function(err, res) {

                if (err) { return; }

                emitRows(socket, idx, res.rows);
              });

            } else {

              emitRows(socket, idx, res.rows);
            }
          });
        }        
      });
    })(i);
  }
});

