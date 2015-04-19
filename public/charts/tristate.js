function drawTristateCharts(key, data) {
  $(".tristate-chart." + key).each(function (i, c) {
    getDataRange(key, $(c), drawTristateChart);
  });
}

function drawTristateChart(chart, data) {
  var BAR_PAD = 2;
  var BAR_WIDTH = 8;

  var states = [];
  var invert;

  ticks = Math.floor(chart.width() / (BAR_WIDTH + BAR_PAD));
  invert = (chart.hasClass("inverse")) ? -1 : 1;

  console.log("data", data.map(function (d) { return d.value.v; }));
  data.forEach(function (datum) {
    switch (datum.value.v) {
      case 0: states.push(-1 * invert); break;
      case 1: states.push(1 * invert); break;
      // Crossfilter has a tendency to synthesize and return nulls.
      case null: break;
      default: states.push(0);
    }
  });

  while (ticks > states.length) {
    states.unshift(states[0]);
  }

  while (ticks < states.length) {
    states.shift();
  }

  chart.sparkline(
    states, {
      type: 'tristate',
      posBarColor: '#999',
      negBarColor: '#ff7f00',
      zeroBarColor: '#cccccc',
      barWidth: BAR_WIDTH,
      barSpacing: BAR_PAD
    }
  );
}
