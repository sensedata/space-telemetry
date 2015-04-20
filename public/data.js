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
      r.i++;
      r.d = r.d + (d.d - r.d) / r.i;
      r.m = r.m + (d.m - r.m) / r.i;
      r.s = d.s;
      r.t = d.t;
      r.v = r.v + (d.v - r.v) / r.i;
      return r;
    },

    function remove(r, d) {
      // FIXME these are wrong. I think. Is late.
      r.i--;
      r.d = r.d - (d.d + r.d) / r.i;
      r.m = r.m - (d.m + r.m) / r.i;
      r.s = d.s;
      r.t = d.t;
      r.v = r.v - (d.v + r.v) / r.i;
      return r;
    },

    function initial() {
      return { i: 0, d: 0, m: 0, v: 0 };
    }
  );

  sampler.order(function (s) { return s.t; });

  data = sampler.top(available).map(function (d) { return d.value; });
  sampler.dispose();

  callback(chart, data);
}

function clean(key, data) {
  var cleaned;
  var stripped;

  stripped = data.filter(function (d) {
    return d && typeof(d.u) !== "undefined" && !isNaN(parseFloat(d.u));
  });

  cleaned = stripped.map(function (d) {
    return { k: keyIndex[key], d: 0, m: 0, s: 24, t: d.t, v: parseFloat(d.u) };
  });

  return cleaned;
}

function extractLatest(key, data) {
  var mostRecent;

  if (data) {
    mostRecent = data[0];

    data.forEach(function (d) {
      if (d.t > mostRecent.t) {
        mostRecent = d;
      }
    });

    mostRecent = clean(key, [mostRecent]);

  } else {
    resetDimensions();
    keyDimension.filterExact(keyIndex[key]);

    mostRecent = timeDimension.top(1);
  }

  return mostRecent[0];
}

function radToDeg(rad) {
  return rad / (Math.PI / 180);
}

function resetDimensions() {
  keyDimension.filterAll();
  timeDimension.filterAll();
}
