/*jshint node:true*/
/*jshint loopfunc:true */

// VCAP_* indicated IBM BlueMix
// process.env.PORT indicates Heroku
var port = (process.env.VCAP_APP_PORT || process.env.PORT || 6001),
    host = (process.env.VCAP_APP_HOST || '0.0.0.0');

var ddlist = require('./data_dictionary').list;

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

var dataStream = ls.dataStream.fork().each(function(data) {

  io.emit(data.n, [ {u: data.v, t: data.t} ]);
  // console.log(data);
});

var lastKnownStatus;

var statusStream = ls.statusStream.fork().each(function(status) {

  lastKnownStatus = status;
  
  io.emit('STATUS', status);
  // console.log(status);
});


// do some transformation of the data before emitting
function emitRows(socket, type, rows) {
  
  socket.emit(type, rows.map(function(v) { return {u: v.value.toString(), t: v.ts.getTime()/1000|0}; }));
}

io.on('connection', function (socket) {
  // broacast status to client upon connection
  if (lastKnownStatus) {
    
    io.emit('STATUS', lastKnownStatus);
  }

  // broadcast status when requested
  socket.on('STATUS', function () {
    
    if (lastKnownStatus) {
      
      io.emit('STATUS', lastKnownStatus);
    }
  });

  // create a handler for each telemetry type
  for(var i = 0, l = ddlist.length; i<l; i++) {

    var type = ddlist[i];

    // creating functions within the loop is ok, in this case
    (function (type) {

      socket.on(type, function (unixtime) {
        // unixtime of -1 indicates the client wants the latest record available
        if(unixtime === -1) {
          
          db.selectMostRecentByType(type, function(err, res) {
            
            if (err) { return; }
            
            emitRows(socket, type, res.rows);
          });
          
        } else {
          // get a list of records later than unixtime of a type
          db.selectByTypeUnixtime(type, unixtime, function(err, res) {

            if (err) { return; }
            
            // if no records found, get the latest
            if (res.rows.length === 0) {
              
              db.selectMostRecentByType(type, function(err, res) {
                  
                if (err) { return; }
                  
                emitRows(socket, type, res.rows);
              });

            } else {
                
              emitRows(socket, type, res.rows);
            }
          });
        }
      });
    })(type);
  }
});

