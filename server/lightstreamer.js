
var _ = require('highland');

var EventEmitter = require('events').EventEmitter;

var utils = require('./utils');

var emitter = new EventEmitter();

exports.dataStream = _('data', emitter);

// exports.statusStream = _('status', emitter);

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

    emitter.emit('data', data);

  } else if (lastStatus && lastStatus.s !== data.s) {

    console.log(data);

    emitter.emit('data', data);
  }

  lastStatus = data;
}

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
      var now = new Date();
      var year = new Date(Date.UTC(now.getUTCFullYear(), 0)); // This year, jan 1, 00:00:00, utc
      // THE TELEMETRY TIME SEEMS TO ADD 24 HOURS TO NUMBER
      // OF HOURS IN THE YEAR SO FAR.  STRANGE.  TODO
      // so we subtract 24 from fTimeStamp, convert to seconds
      // add to number of seconds as of THIS_YEAR-01-01T00:00:00 UTC
      // truncate the decimal places for a result in seconds, aka unixtime
      fTimeStamp = (((fTimeStamp - 24) * 3600) + (year.getTime() / 1000)) | 0;
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

    emitter.emit('data', data);

    // if(update.getItemName() === 'USLAB000024') {
    //   console.log(update.getItemName());
    //   SCHEMA.forEach(function(key) { console.log(key + ': ' + update.getValue(key)); });
    // }
  }
});
