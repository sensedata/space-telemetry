
function addTelemetry(data) {
  telemetry.add(data);
}

function getDataRange(key, maxRecords, chart, callback) {
  var data;
  var sampler;

  resetDimensions();
  keyDimension.filterExact(key);

  sampler = timeDimension.group(function (t) {
    return t;
  });

  sampler.reduce(
    function add(r, d) {
      r.i++;

      r.d = r.d + (d.d - r.d) / r.i;
      r.m = r.m + (d.m - r.m) / r.i;
      r.v = r.v + (d.v - r.v) / r.i;

      // Reduction doesn't occur in order, so have to check before choosing
      // newest values.
      if (d.t > r.t) {
        r.s = d.s;
        r.t = d.t;
      }

      return r;
    },

    function remove(r, d) {
      throw "Removal in data reduction is not supported.";
    },

    function initial() {
      return { k: key, i: 0, d: 0, m: 0, t: 0, v: 0 };
    }
  );

  sampler.order(function (s) { return s.t; });

  data = sampler.top(maxRecords).map(function (d) { return d.value; });
  sampler.dispose();

  data.reverse();

  callback(chart, data);
}

function extractLatest(key, data) {
  var mostRecent;

  if (data) {
    mostRecent = data[0];

    data.forEach(function (d) {
      if (typeof mostRecent === undefined || d.t > mostRecent.t) {
        mostRecent = d;
      }
    });

    return mostRecent;

  } else {
    resetDimensions();
    keyDimension.filterExact(key);

    return timeDimension.top(1)[0];
  }
}

function radToDeg(rad) {
  return rad / (Math.PI / 180);
}

function resetDimensions() {
  keyDimension.filterAll();
  timeDimension.filterAll();
}
