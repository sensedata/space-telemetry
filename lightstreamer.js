/*jshint node:true*/

var ls = require('lightstreamer-client');

var io = require('./server').io;

var db = require('./db');

var ddlist = require('./data_dictionary').list;

// the data stream
var lsClient = new ls.LightstreamerClient("http://push.lightstreamer.com", "ISSLIVE");

// MERGE indicates that we only want to receive data when the value(s) have changed
var telemetrySub = new ls.Subscription("MERGE", ddlist , ['Value']);

// interpret status based on our connection health with lightstreamer
var broadcastStatus = exports.broadcastStatus = function () {

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
};

lsClient.addListener({
  onStatusChange: function (status) {
    // notifiy clients when our status has changed
    broadcastStatus();
  }
});

lsClient.connect();

lsClient.subscribe(telemetrySub);

telemetrySub.addListener({

  onSubscription: function() {
    // notifiy clients when our status has changed
    broadcastStatus();
  },

  onUnsubscription: function() {
    // notifiy clients when our status has changed
    broadcastStatus();
  },

  onItemUpdate: function(update) {

    // transform data
    var n = update.getItemName(),
    v = update.getValue("Value"),
    t = Date.now()/1000|0;
    // persist
    db.insertTelemetryData(n, v, t);
    // broacast to listening clients
    io.emit(n, [{u: v, t: t}]);
  }
});
