/*jshint node:true*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// Postgresql database connectivity
var pg = require('pg');

// This application uses express as it's web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

var server = require('http').createServer(app);

// use socket.io for real-time
var io = require('socket.io')(server);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
server.listen(appEnv.port, appEnv.bind, function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// Postgres confg
var psql;

// are we operating in BlueMix
if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    psql = env['postgresql-9.1'][0].credentials;
    // The Postgresql service returns the database name in the "name"
    // property but the pg.js Node.js module expects it to be in the
    // "database" property.
    psql.database = psql.name;
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
  client.query('create table if not exists data(idx smallint, value TEXT, ts timestamp without time zone)',
  function (err, result) {
    done();
    if (err) {
      return console.error('Error creating table data', err);
    }
  });
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
    
    io.emit(u.n, [{u: u.v, t: u.t}]);
  }
});

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

          client.query('SELECT * from data where idx = $1 and ts > to_timestamp($2) order by ts asc',
            [ddhash[type], unixtime],
            function(err, res) {
              done();
              if (err) {
                return console.error('Error querying type: ' + type, err);
              }
              socket.emit(type, res.rows.map(function(v) { return {u: v.value, t: v.ts.getTime()/1000|0}; }));
            }
          );
        });
      });
    })(type);
  
  }
  
});

