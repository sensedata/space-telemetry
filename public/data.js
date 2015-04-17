var PIXELS_PER_SAMPLE = 2;

function getDataFor(chart, callback) {
  var available;
  var timeLimit;

  var filter;
  var reducer;
  var sampler;

  var data;

  chart = $(chart);

  // Number of data points the chart can handle readably.
  available = Math.floor(chart.width() / PIXELS_PER_SAMPLE);

  // How far back in time the number of available points takes the data.
  timeLimit = moment().subtract(available * frequency, "seconds").unix();
  timeLimit = moment().subtract(30, "minutes").unix();

  // Reset previous filters
  time.filterAll();

  // Group the
  sampler = time.group(function (t) {
    return t;
  });

  // In time window.
  filter = time.filter(function (t) {
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
