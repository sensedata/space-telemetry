/*jshint node:true*/

var _ = require('highland');

var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();

exports.dataStream = _('data', emitter);

exports.statusStream = _('status', emitter);

var ls = require('lightstreamer-client');

var ddlist = require('./data_dictionary').list;

// the data stream
var lsClient = new ls.LightstreamerClient("http://push.lightstreamer.com", "ISSLIVE");

// MERGE indicates that we only want to receive data when the value(s) have changed
var telemetrySub = new ls.Subscription("MERGE", ddlist , ['Value']);

// interpret status based on our connection health with lightstreamer
function statusUpdate() {

  var cs = lsClient.getStatus(),
  
  c = "DISCONNECTED",
  
  isSubscribed = telemetrySub.isSubscribed();

  if (cs.indexOf("STALLED") > -1) {

    c = "STALLED";

  } else if (cs.indexOf("CONNECTED") > -1) {

    c = "CONNECTED";

  } else {

    c = "DISCONNECTED";
  }
  
  emitter.emit('status', { connection: c, subscription: isSubscribed });
}

lsClient.addListener({
  
  onStatusChange: function (status) {

    statusUpdate();
  }
});

lsClient.connect();

lsClient.subscribe(telemetrySub);

telemetrySub.addListener({

  onSubscription: function() {

    statusUpdate();
  },

  onUnsubscription: function() {

    statusUpdate();
  },

  onItemUpdate: function(update) {
    
    emitter.emit('data',
    { n: update.getItemName(),
      v: update.getValue("Value"),
      t: Date.now()/1000|0 });
  }
});
