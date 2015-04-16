/*jshint node:true*/

var ls = require("lightstreamer-client");

var io = require('./server').io;

var db = require('./db');

var ddlist = require('./data_dictionary').list;

var lsClient = new ls.LightstreamerClient("http://push.lightstreamer.com","ISSLIVE");

var telemetrySub = new ls.Subscription("MERGE", ddlist , ["Value"]);

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

    var n = update.getItemName(),
    v = update.getValue("Value"),
    t = Date.now()/1000|0;

    db.insertTelemetryData(n, v, t);

    io.emit(n, [{u: v, t: t}]);
  }
});
