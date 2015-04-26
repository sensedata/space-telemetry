var frequency;
var telemetry;
var keyDimension;
var timeDimension;
var attitudes;

$(function () {
  var axes;
  var socket;

  frequency = 1;
  telemetry = crossfilter();
  timeDimension = telemetry.dimension(function (d) {
    return d.t;
  });

  keyDimension = telemetry.dimension(function (d) {
    return d.k;
  });

  attitudes = {
    actual: new THREE.Quaternion(),
    command: new THREE.Quaternion()
  };

  socket = io();

  // Uncomment to test local client code againt the production back end.
  // socket = io("https://space-telemetry.herokuapp.com");


  // Special cases
  socket.on(keyIndex.USLAB000038, function (data) {
    $(".bullet-chart.USLAB000038").data("capacity", extractLatest(data).v);
  });
  socket.emit(keyIndex.USLAB000038, -1);

  socket.on("STATUS", function (data) {
    if (!_.isArray(data)) {
      data = [data];
    }

    data = data.map(function (d) {
      return { k: keyIndex.STATUS, t: d.t, v: d.c  };
    });

    addTelemetry(data);
    drawReadouts("STATUS");
  });
  socket.emit("STATUS", -1);


  // General cases

  var currentOnlyKeys = [
    // CMG statuses
    "USLAB000001", "USLAB000002", "USLAB000003", "USLAB000004",

    // Momentum and desaturation (see special section above for capacity.)
    "USLAB000009", "USLAB000011",

    // GNC settings
    "USLAB000012", "USLAB000016", "USLAB000017",

    // LVLH actual
    // "USLAB000018", "USLAB000019", "USLAB000020", "USLAB000021",

    // Attitude command
    // "USLAB000028", "USLAB000029", "USLAB000030", "USLAB000031",

    // Attitude control alarms
    "USLAB000041", "USLAB000042",

    // GPS statuses
    "USLAB000043", "USLAB000044",

    // Station status and clock
    "USLAB000086", "TIME_000001",

    // CMG electrical current
    "Z1000005", "Z1000006", "Z1000007", "Z1000008",

    // CMG rotation speed
    "Z1000009", "Z1000010", "Z1000011", "Z1000012"
  ];

  var historyKeys = [
    // CMG torque
    "USLAB000006", "USLAB000007", "USLAB000008",

    // Attitude error
    "USLAB000022", "USLAB000023", "USLAB000024",

    // Attitude change rate
    "USLAB000025", "USLAB000026", "USLAB000027",

    // CMG bearing temps
    "USLAB000045", "USLAB000046", "USLAB000047", "USLAB000048",

    // CMG bearing temps (Hall resolver)
    "USLAB000049", "USLAB000050", "USLAB000051", "USLAB000052",

    // CMG vibration
    "Z1000001", "Z1000002", "Z1000003", "Z1000004"
  ];

  var allKeys = currentOnlyKeys.concat(historyKeys);

  var period = moment().subtract(7, "days").unix();

  allKeys.forEach(function (key) {
    socket.on(keyIndex[key], function (data) {
      var latest;

      addTelemetry(data);

      drawCharts(key);
      drawReadouts(key);
      drawStatuses(key);
    });
  });

  currentOnlyKeys.forEach(function (key) {
    socket.emit(keyIndex[key], -1, 150);
  });

  historyKeys.forEach(function (key) {
    socket.emit(keyIndex[key], 5000, 150);
  });

  axes = {
    actual: {
      x: "USLAB000018", y: "USLAB000019", z: "USLAB000020",  w: "USLAB000021"
    },
    command: {
      x: "USLAB000028", y: "USLAB000029", z: "USLAB000030",  w: "USLAB000031"
    }
  };

  /* jshint loopfunc: true, shadow: false */
  for (var type in axes) {
    for (var axis in axes[type]) {
      (function (type, axis) {
        socket.on(keyIndex[axes[type][axis]], function (data) {
          attitudes[type][axis] = extractLatest(data).v;
          drawAttitude(type);
        });
      })(type, axis);

      socket.emit(keyIndex[axes[type][axis]], -1);
    }
  }
  /* jshint loopfunc: false, shadow: true */

  var redrawAll = function () {
    // Delay redrawing else jQuery won't always get new values for chart
    // container widths.
    setTimeout(function () {
      allKeys.forEach(function (key) {
        drawCharts(key);
      });
    }, 500);
  };

  ["orientationchange", "resize"].forEach(function (t) {
    window.addEventListener(t, redrawAll, true);
  });

  setInterval(pruneData, moment.duration(1, "seconds").asMilliseconds());
  setInterval(
    function () {
      var latest = getLatestTimestamp();

      drawTimestamp(latest, $("#telemetry-transmitted"));
      drawDelay(latest, $("#telemetry-delay"));
    },
    moment.duration(2, "seconds").asMilliseconds()
  );

});
