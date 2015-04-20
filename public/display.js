function applyMeta(target, datum) {
  target.attr("data-deviation", datum.d);
  target.data("meanAge", datum.m);
  target.data("status", datum.s);
  target.data("timestamp", datum.t);
}

function drawAttitude(type) {
  var axes;
  var eulers;

  axes = {"x": "roll", "y": "pitch", "z": "yaw"};
  eulers = new THREE.Euler().setFromQuaternion(attitudes[type]);
  for (var axis in axes) {
    $(".attitude." + type + "." + axes[axis]).html(
      negativePad(zeroPad(radToDeg(eulers[axis]).toFixed(3), 6))
    );
  }
}

function drawCharts(key, data) {
  $(".microchart." + key).each(function (i, c) {
    var chart;
    var draw;

    chart = $(c);
    if (chart.hasClass("bullet-chart")) {
      draw = drawBulletChart;

    } else if (chart.hasClass("sparkline-chart")) {
      draw = drawSparklineChart;

    } else if (chart.hasClass("tristate-chart")) {
      draw = drawTristateChart;

    } else {
      return;
    }

    if (data) {
      draw(chart, clean(key, data));

    } else {
      getDataRange(key, chart, draw);
    }
  });
}

function drawReadouts(key, data) {
  var value;

  $(".readout." + key).each(function (i, r) {
    var latest;
    var readout;
    var value;

    readout = $(r);
    latest = extractLatest(key, data);

    if (readout.hasClass("text")) {
      values = textValues[key];
      if (values) {
        value = values[latest.v];
      }

      if (typeof(value) === "undefined") {
        value = "Unknown";
      }

    } else {
      value = latest.v.toFixed(readout.data("scale"));

      if (readout.data("zeroPad") === "true") {
        value = zeroPad(value, readout.data("precision"));
      }
    }

    readout.html(value);
    applyMeta(readout, latest);
  });
}

function drawStatuses(key, data) {
  var status;

  status = extractLatest(key, data);

  $(".status." + key).each(function (i, t) {
    var target;
    var low, high;

    target = $(t);

    // Defaults for binary, i.e., 0 is off, 1 is on.
    low = parseFloat(target.data("rangeLow")) || 0;
    high = parseFloat(target.data("rangeHigh")) || 0.1;

    if (typeof(status) === "undefined" || isNaN(status.v)) {
      target.addClass("off unknown").removeClass("high low on");

    } else if (status.v < low) {
      target.addClass("on low").removeClass("high off unknown");

    } else if (status.v > high) {
      target.addClass("on high").removeClass("low off unknown");

    } else {
      target.addClass("off").removeClass("high low on unknown");

    }

    applyMeta(target, status);
  });
}
