
var utils = require('./utils');

var feedTimeToUnix = require('./feed-time-to-unix');

var source = require('./source');

var ls = require('lightstreamer-client');

var dd = require('./data_dictionary');

var SCHEMA = ['TimeStamp', 'Value', 'Status.Class', 'CalibratedData'];

// the data stream
var lsClient = new ls.LightstreamerClient('http://push.lightstreamer.com', 'ISSLIVE');

lsClient.connectionOptions.setSlowingEnabled(false);

// MERGE indicates that we only want to receive data when the value(s) have changed
var telemetrySub = new ls.Subscription('MERGE', dd.list, SCHEMA);
var timeSub = new ls.Subscription('MERGE', 'TIME_000001', ['Status.Class']);

var statusIdx = dd.hash.STATUS;

var telemetrySessionId;

var lastStatus;

var time00001Timeout;

var rssCache = require("./rss-cache");

function statusUpdate(connected) {

  var now = Date.now() / 1000 | 0, data;

  data = {
    k: statusIdx.toString(),
    v: connected ? 1 : 0,
    t: now,
    s: connected ? 24 : 2,  // 24 and 2 are values from telemetry
    sid: now
  };

  if (!lastStatus) {

    console.log(data);

    rssCache.put(data.k, data);

    source.emit('data', data);

  } else if (lastStatus && lastStatus.s !== data.s) {

    console.log(data);

    rssCache.put(data.k, data);

    source.emit('data', data);
  }

  lastStatus = data;
}

lsClient.addListener({

  onStatusChange: function (status) {

    console.log('lightstreamer status:', status);

    // setup a timeout to notify clients if data is not streaming
    clearTimeout(time00001Timeout);
    time00001Timeout = setTimeout(function () { statusUpdate(false); }, 15000);
  }
});

lsClient.subscribe(timeSub);
lsClient.connect();

var unsubTimeout = null;

timeSub.addListener({

  onUnsubscription: function () {

    lsClient.unsubscribe(telemetrySub);
  },

  onItemUpdate: function (update) {

    var status = update.getValue('Status.Class'),
    subscribed = telemetrySub.isSubscribed();

    if (status === '24' && unsubTimeout) {

      clearTimeout(unsubTimeout);
      unsubTimeout = null;
    }

    if (status === '24' && !subscribed) {

      lsClient.subscribe(telemetrySub);

    } else if (status !== '24' && subscribed) {

      // give 20 seconds to collect any outstanding data from lightstreamer
      unsubTimeout = setTimeout(function () {

        lsClient.unsubscribe(telemetrySub);

      }, 10000);
    }
  }
});


telemetrySub.addListener({

  onSubscription: function () {

    telemetrySessionId = utils.getTimeBasedId();

    // setup a timeout to notify clients if data is not streaming
    clearTimeout(time00001Timeout);
    time00001Timeout = setTimeout(function () { statusUpdate(false); }, 10000);
  },

  onItemUpdate: function (update) {

    var fValue = 0,

    fTimeStamp = 0,

    iStatus = 0,

    idx = dd.hash[update.getItemName()];

    try {

      fValue = parseFloat(update.getValue('Value'));
      fTimeStamp = parseFloat(update.getValue('TimeStamp'));
      iStatus = parseInt(update.getValue('Status.Class'), 10);

    } catch (ex) {

      console.error(ex);
    }

    if (fTimeStamp) {
      fTimeStamp = feedTimeToUnix(fTimeStamp, new Date());
    }

    // handle TIME_000001
    if (idx === 296) {
      // in this case utilize the timestamp for the value
      fValue = fTimeStamp;

      // data is streaming, notify clients
      statusUpdate(true);
      // setup a timeout to notify clients if stops streaming
      clearTimeout(time00001Timeout);
      time00001Timeout = setTimeout(function () { statusUpdate(false); }, 10000);
    }

    var data = {
      k: idx,
      v: fValue,
      cv: update.getValue('CalibratedData'),
      t: fTimeStamp,
      s: iStatus,
      sid: telemetrySessionId
    };

    rssCache.put(update.getItemName(), data);

    source.emit('data', data);

    // if(update.getItemName() === 'USLAB000024') {
    //   console.log(update.getItemName());
    //   SCHEMA.forEach(function(key) { console.log(key + ': ' + update.getValue(key)); });
    // }
  }
});
