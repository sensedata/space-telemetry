
var utils = require('./utils');

var feedTimeToUnix = require('./feed-time-to-unix');

var feedStatus = require('./feed-status');

var source = require('./source');

var ls = require('lightstreamer-client');

var dd = require('./data_dictionary');

var SCHEMA = ['TimeStamp', 'Value', 'Status.Class', 'CalibratedData'];

var lsClient = new ls.LightstreamerClient('http://push.lightstreamer.com', 'ISSLIVE');

lsClient.connectionOptions.setSlowingEnabled(false);

var telemetrySub = new ls.Subscription('MERGE', dd.list, SCHEMA);
var timeSub = new ls.Subscription('MERGE', 'TIME_000001', ['Status.Class']);

var telemetrySessionId;

lsClient.addListener({

  onStatusChange: function (status) {

    console.log('lightstreamer status:', status);

    feedStatus.expectTimeWithin(15000);
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

      // Lets Lightstreamer deliver outstanding updates before the unsubscribe.
      unsubTimeout = setTimeout(function () {

        lsClient.unsubscribe(telemetrySub);

      }, 10000);
    }
  }
});


telemetrySub.addListener({

  onSubscription: function () {

    telemetrySessionId = utils.getTimeBasedId();

    feedStatus.expectTimeWithin(10000);
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

    // 296 is TIME_000001, whose value is its own timestamp.
    if (idx === 296) {
      fValue = fTimeStamp;
    }

    source.emit('data', {
      k: idx,
      v: fValue,
      cv: update.getValue('CalibratedData'),
      t: fTimeStamp,
      s: iStatus,
      sid: telemetrySessionId
    });
  }
});
