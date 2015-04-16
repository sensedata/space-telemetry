/*jshint node:true*/
/*jshint loopfunc: true */

var port = (process.env.VCAP_APP_PORT || process.env.PORT || 6001),
    host = (process.env.VCAP_APP_HOST || '0.0.0.0');
    
var db = require('./db');

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

var broadcastStatus = ls.broadcastStatus;

function emitRows(socket, type, rows) {
  socket.emit(type, rows.map(function(v) { return {u: v.value.toString(), t: v.ts.getTime()/1000|0}; }));
}

io.on('connection', function (socket) {
  console.log('connection');

  broadcastStatus();

  socket.on('STATUS', function () {

    broadcastStatus();
  });

  // create a handler for each telemetry type
  for(var i = 0, l = ddlist.length; i<l; i++) {

    var type = ddlist[i];

    // creating functions within the loop is ok, in this case
    (function (type) {

      socket.on(type, function (unixtime) {

        if(unixtime === -1) {
          db.selectMostRecentByType(type, function(err, res) {
            
            if (err) { return; }
            
            emitRows(socket, type, res.rows);
          });
          
        } else {
            
          db.selectByTypeUnixtime(type, unixtime, function(err, res) {

            if (err) { return; }
              
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

