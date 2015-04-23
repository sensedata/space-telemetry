/*jshint node:true*/
var _ = require('highland');

var EventEmitter = require('events').EventEmitter;

var utils = require('./utils');

var emitter = new EventEmitter();

exports.dataStream = _('data', emitter);

exports.statusStream = _('status', emitter);

var ls = require('lightstreamer-client');

var dd = require('./data_dictionary');

var SCHEMA = ["TimeStamp","Value","Status.Class","CalibratedData"];

// the data stream
var lsClient = new ls.LightstreamerClient("http://push.lightstreamer.com", "ISSLIVE");

lsClient.connectionOptions.setSlowingEnabled(false);

// MERGE indicates that we only want to receive data when the value(s) have changed
var telemetrySub = new ls.Subscription("MERGE", dd.list, SCHEMA);
var timeSub = new ls.Subscription("MERGE", 'TIME_000001', ["Status.Class"]);

var telemetrySessionId;

// interpret status based on our connection health with lightstreamer
function statusUpdate() {

  var cs = lsClient.getStatus(),
  
  resolvedStatus = 0,

  isSubscribed = telemetrySub.isSubscribed();

  if ((cs.indexOf("CONNECTED") > -1) && isSubscribed) {

    resolvedStatus = 1;

  } else {

    resolvedStatus = 0;
  }
    
  emitter.emit('status', {
    c: resolvedStatus,
    t: Date.now()/1000|0
  });
}

lsClient.addListener({
  
  onStatusChange: function (status) {

    statusUpdate();
  }
});

lsClient.subscribe(timeSub);
lsClient.connect();

var unsubTimeout = null;

timeSub.addListener({
  
  onUnsubscription: function() {

    lsClient.unsubscribe(telemetrySub);
  },
  
  onItemUpdate: function(update) {
    
    var status = update.getValue("Status.Class"),
    subscribed = telemetrySub.isSubscribed();
    
    if ((status === '24') && unsubTimeout) {
      
      clearTimeout(unsubTimeout);
      unsubTimeout = null;
    }

    if ((status === '24') && !subscribed) {
      
      lsClient.subscribe(telemetrySub);
    
    } else if ((status !== '24') && subscribed) {
      
      // give 60 seconds to collect any outstanding data from lightstreamer
      unsubTimeout = setTimeout(function () { lsClient.unsubscribe(telemetrySub); }, 60000);
    }
  }
});


telemetrySub.addListener({

  onSubscription: function() {
    
    telemetrySessionId = utils.getTimeBasedId();
    statusUpdate();
  },

  onUnsubscription: function() {

    statusUpdate();
  },

  onItemUpdate: function(update) {
    
    var fValue = 0,
    
    fTimeStamp = 0,
    
    iStatus = 0,
    
    idx = dd.hash[update.getItemName()];
    
    try {

      fValue = parseFloat(update.getValue("Value"));
      fTimeStamp = parseFloat(update.getValue("TimeStamp"));
      iStatus = parseInt(update.getValue("Status.Class"), 10);

    } catch (ex) {
      
      console.error(ex);
    }
    
    if (fTimeStamp) {
      var now = new Date();
      var year = new Date(Date.UTC(now.getUTCFullYear(), 0)); // This year, jan 1, 00:00:00, utc
      // THE TELEMETRY TIME SEEMS TO ADD 24 HOURS TO NUMBER
      // OF HOURS IN THE YEAR SO FAR.  STRANGE.  TODO
      // so we subtract 24 from fTimeStamp, convert to seconds
      // add to number of seconds as of THIS_YEAR-01-01T00:00:00 UTC
      // truncate the decimal places for a result in seconds, aka unixtime
      fTimeStamp = (((fTimeStamp-24) * 3600) + (year.getTime()/1000))|0;      
    }
    
    var data = {
      i: idx,
      v: fValue,
      cv: update.getValue("CalibratedData"),
      t: fTimeStamp,
      s: iStatus,
      sid: telemetrySessionId
    };

    emitter.emit('data', data);
    
    // if(update.getItemName() === 'USLAB000024') {
    //   console.log(update.getItemName());
    //   SCHEMA.forEach(function(key) { console.log(key + ': ' + update.getValue(key)); });
    // }
  }
});
