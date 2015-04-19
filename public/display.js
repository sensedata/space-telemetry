function drawCharts(key) {
  $("dd.microchart." + key + ", td.microchart." + key).each(function (i, c) {
    var chart;
    var draw;

    chart = $(c);
    if (chart.hasClass("bulletChart")) {
      draw = drawBulletChart;

    } else if (chart.hasClass("sparklineChart")) {
      draw = drawSparklineChart;

    } else if (chart.hasClass("tristate")) {
      draw = drawTristateChart;

    } else {
      return;
    }

    getDataRange(key, chart, draw);
  });
}

function drawReadouts(key, data) {
  var value;

  $("dd.readout." + key + ", td.readout." + key).each(function (i, r) {
    var readout;
    var value;

    readout = $(r);

    value = extractLatest(data);

    if (readout.hasClass("text")) {
      values = textValues[key];
      if (values) {
        value = values[value];
      }

      if (typeof(value) === "undefined") {
        value = "Unknown";
      }

    } else {
      value = value.toFixed(readout.data("scale"));

      if (readout.data("zeroPad") === "true") {
        value = zeroPad(value, readout.data("precision"));
      }
    }

    readout.html(value);

    // This will be selected by CSS, which can't see into jQuery data.
    readout.attr("age-deviation", data.d);
  });
}

function drawBooleanStatuses(key) {
  var status;

  resetDimensions();

  keyDimension.filterExact(keyIndex[key]);
  status = timeDimension.top(1)[0];

  targets = $(".status-boolean." + key);


  if (key === "USLAB000042") {
    console.log("bool status", key, status);
    console.log("targets", targets);
  }

  if (typeof(status) === "undefined" || status.v === 0) {
    targets.removeClass("on").addClass("off").removeClass("unknown");

  } else if (status.v === 1) {
    targets.addClass("on").removeClass("off").removeClass("unknown");

  } else {
    targets.removeClass("on").removeClass("off").addClass("unknown");

  }
}

function drawRangeStatuses(key) {
  var status;

  resetDimensions();

  keyDimension.filterExact(key);
  status = timeDimension.top(1)[0];

  targets = $("div.status-range." + key);

  if (status === "0") {
    targets.removeClass("on").addClass("off").removeClass("unknown");

  } else if (status === "1") {
    targets.addClass("on").removeClass("off").removeClass("unknown");

  } else {
    targets.removeClass("on").removeClass("off").addClass("unknown");

  }
}
