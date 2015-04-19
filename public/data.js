function addTelemetry(key, data) {
  var keyPosition;

  keyPosition = keyIndex[key];
  telemetry.add(data.map(function (datum) {
    return { k: keyPosition, t: datum.t, v: parseFloat(datum.u) };
  }));
}

function getDataRange(key, chart, callback) {
  var available;
  var timeLimit;

  var reducer;
  var sampler;

  var data;

  chart = $(chart);
  resetDimensions();

  // Number of data points the chart can handle readably.
  available = Math.floor(chart.width() / PIXELS_PER_SAMPLE);

  // How far back in time the number of available points takes the data.
  timeLimit = moment().subtract(available * frequency, "seconds").unix();
  timeLimit = moment().subtract(30, "minutes").unix();

  // Group the
  sampler = timeDimension.group(function (t) {
    return t;
  });

  // Only the keyed records
  keyDimension.filterExact(keyIndex[key]);

  // In time window.
  timeDimension.filter(function (t) {
    return t >= timeLimit;
  });

  reducer = sampler.reduce(
    function add(r, d) {
      r.c++;
      r.t = d.t;
      r.v = r.v + (d.v - r.v) / r.c;
      return r;
    },

    function remove(r, d) {
      r.c--;
      r.t = d.t;
      // FIXME this is wrong. I think. Is late.
      r.v = r.v - (d.v + r.v) / r.c;
      return r;
    },

    function initial() {
      return { t: null, v: null, c: 0 };
    }
  );

  sampler.order(function (s) { return s.t; });

  data = sampler.top(available);
  sampler.dispose();

  callback(chart, data);
}


function resetDimensions() {
  keyDimension.filterAll();
  timeDimension.filterAll();
}


function extractLatest(data) {
  var mostRecent = data[0];

  data.forEach(function (d) {
    if (d.t > mostRecent.t) {
      mostRecent = d;
    }
  });

  return mostRecent;
}
