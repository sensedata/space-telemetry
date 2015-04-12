/*jshint node:true*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

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
app.listen(appEnv.port, appEnv.bind, function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

var ls = require("lightstreamer-client");
var lsClient = new ls.LightstreamerClient("http://push.lightstreamer.com","ISSLIVE");
var telemetrySub = new ls.Subscription("RAW", require("./data_dictionary").list , ["Value"]);

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

telemetrySub.addListener({
  
  onSubscription: function() {
    
    broadcastStatus();
  },
  
  onUnsubscription: function() {
    
    broadcastStatus();
  },
  
  onItemUpdate: function(update) {
    
    var u = {n: update.getItemName(), v: update.getValue("Value"), t: Date.now()};
    
    io.emit(u.n, {u: u.v, t: u.t});
    // console.log(JSON.stringify(u));
  }
});

io.on('connection', function (socket) {
  console.log('connection');
  
  broadcastStatus();
  
  socket.on('STATUS', function () {
    
    broadcastStatus();
  });
  
});