/*jshint node:true*/

var port = (process.env.VCAP_APP_PORT || process.env.PORT || 6001),
    host = (process.env.VCAP_APP_HOST || '0.0.0.0');
    
// Postgresql database connectivity
var pg = require('pg');

// This application uses express as it's web server
// for more info, see: http://expressjs.com
var express = require('express');

// create a new express server
var app = express();

var server = require('http').createServer(app);

// use socket.io for real-time
var io = require('socket.io')(server);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
server.listen(port, host, function() {

	// print a message when the server starts listening
  console.log("server starting on host: " + host + ", port: " + port);
});

// Postgres confg
var psql;

// are we operating in BlueMix or Heroku
if (process.env.DATABASE_URL) {
  psql = process.env.DATABASE_URL;

} else {
    // Specify local Postgresql connection properties here.
    psql = {
        database: "iss",
        host: "localhost",
        port: 5432,
        user: "",
        password: "",
        ssl: false
    };
}

// On startup, create the table if it does not exist.
pg.connect(psql, function(err, client, done) {
  if (err) {
    return console.error('Error requesting client', err);
  }

  // client.query('drop table if exists data',
  // function (err, result) {
  //   if (err) {
  //     done();
  //     return console.error('Error dropping table data', err);
  //   }
    
    client.query('create table if not exists data(idx smallint, value double precision, ts timestamp without time zone)',
    function (err, result) {
      done();
      if (err) {
        return console.error('Error creating table data', err);
      }
    });
    
  // });
  
  

});

var ddlist = require('./data_dictionary').list;

var ls = require("lightstreamer-client");
var lsClient = new ls.LightstreamerClient("http://push.lightstreamer.com","ISSLIVE");
var telemetrySub = new ls.Subscription("MERGE", ddlist , ["Value"]);

function broadcastStatus () {

  var cs = lsClient.getStatus(), c = "DISCONNECTED";

  if (cs.indexOf("STALLED") > -1) {

    c = "STALLED";

  } else if (cs.indexOf("CONNECTED") > -1) {

    c = "CONNECTED";

  } else {

    c = "DISCONNECTED";
  }

  io.emit('STATUS', {connection: c, subscription: telemetrySub.isSubscribed()});

  console.log({connection: c, subscription: telemetrySub.isSubscribed()});
}

lsClient.addListener({
  onStatusChange: function (status) {

    broadcastStatus();
  }
});

lsClient.connect();

lsClient.subscribe(telemetrySub);

var ddhash = require('./data_dictionary').hash;

telemetrySub.addListener({

  onSubscription: function() {

    broadcastStatus();
  },

  onUnsubscription: function() {

    broadcastStatus();
  },

  onItemUpdate: function(update) {

    var u = {n: update.getItemName(), v: update.getValue("Value"), t: Date.now()/1000|0};

    // if we are not in BlueMix add new data
    if(!process.env.VCAP_APP_PORT) {
      pg.connect(psql, function(err, client, done) {
        if (err) {
          return console.error('Error requesting postgres client', err);
        }

        client.query('insert into data (idx, value, ts) values ($1, $2, to_timestamp($3))',
        [ddhash[u.n], u.v, u.t],

        function(err, result) {
          done();

          if (err) {
            return console.error('Error inserting data', err);
          }
        });
      });
    }
    io.emit(u.n, [{u: u.v, t: u.t}]);
  }
});

function queryUnixtime(type, unixtime, client, cb) {
client.query(
  'SELECT * from data where idx = $1 and ts > to_timestamp($2) order by ts asc',
  //"select date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec' as ts, avg(value) as value from data where idx = $1 and ts > to_timestamp($2) group by date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec' order by date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec'",
  [ddhash[type], unixtime],
  function(err, res) {
    cb(err, res);
  });
}

function queryMostRecent(type, client, cb) {

client.query('select * from data where idx = $1 and ts = (select MAX(ts) from data where idx = $1)',
  [ddhash[type]],
  function(err, res) {
    cb(err, res);
  });
}


function emitRows(socket, type, rows) {
  socket.emit(type, rows.map(function(v) { return {u: v.value.toString(), t: v.ts.getTime()/1000|0}; }));
}

io.on('connection', function (socket) {
  console.log('connection');

  broadcastStatus();

  socket.on('STATUS', function () {

    broadcastStatus();
  });

  for(var i = 0, l = ddlist.length; i<l; i++) {

    var type = ddlist[i];

    (function (type) {

      socket.on(type, function (unixtime) {

        pg.connect(psql, function(err, client, done) {
          if (err) {
            return console.error('Error requesting client', err);
          }

          if(unixtime === -1) {

            queryMostRecent(type, client, function(err, res) {
              done();
              if (err) {
                return console.error('Error querying type: ' + type, err);
              }
              emitRows(socket, type, res.rows);
            });

          } else {

            queryUnixtime(type, unixtime, client, function(err, res) {

              if (err) {
                return console.error('Error querying type: ' + type, err);
              }
              if (res.rows.length === 0) {

                queryMostRecent(type, client, function(err, res) {
                  done();
                  if (err) {
                    return console.error('Error querying type: ' + type, err);
                  }
                  emitRows(socket, type, res.rows);
                });

              } else {
                done();
                emitRows(socket, type, res.rows);
              }

          });
         }
        });
      });
    })(type);

  }
});

