function radToDeg(rad) {
  return rad / (Math.PI / 180);
}

function updateAttitudeActual(attitudeActualQ) {
  var eulers = new THREE.Euler().setFromQuaternion(attitudeActualQ);

  $("#attitude-actual-roll").html(negativePad(zeroPad(radToDeg(eulers.x).toFixed(3), 6)));
  $("#attitude-actual-pitch").html(negativePad(zeroPad(radToDeg(eulers.y).toFixed(3), 6)));
  $("#attitude-actual-yaw").html(negativePad(zeroPad(radToDeg(eulers.z).toFixed(3), 6)));
}

function updateAttitudeCommand(attitudeCommandQ) {
  var eulers = new THREE.Euler().setFromQuaternion(attitudeCommandQ);

  $("#attitude-command-roll").html(negativePad(zeroPad(radToDeg(eulers.x).toFixed(3), 6)));
  $("#attitude-command-pitch").html(negativePad(zeroPad(radToDeg(eulers.y).toFixed(3), 6)));
  $("#attitude-command-yaw").html(negativePad(zeroPad(radToDeg(eulers.z).toFixed(3), 6)));
}

var gpsValues;
var textValues;

gpsValues = {
  "0": "Doing position fixes",
  "1": "SV timing",
  "2": "Approximate timing",
  "3": "GPS time",
  "4": "Need initialization",
  "5": "GDOP needed",
  "6": "Bad timing",
  "7": "No usable satellite",
  "8": "Track 1 satellite",
  "9": "Track 2 satellite",
  "10": "Track 3 satellite",
  "11": "Bad integrity",
  "12": "No vel available",
  "13": "Unusable fix"
};

textValues = {
  "USLAB000012": {
    "0": "Default",
    "1": "Wait",
    "2": "Reserved",
    "3": "Standby",
    "4": "CMG attitude control",
    "5": "CMG thruster assist",
    "6": "User data generation",
    "7": "Free drift",
  },
  "USLAB000013": {
    "0": "None",
    "1": "GPS 1",
    "2": "GPS 2",
    "3": "Russian",
    "4": "Ku band"
  },
  "USLAB000014": {
    "0": "None",
    "1": "RGA 1",
    "2": "RGA 2",
    "3": "Russian"
  },
  "USLAB000016": {
    "0": "Attitude hold",
    "1": "Momentum management"
  },
  "USLAB000017": {
    "0": "LVLH",
    "1": "J2000",
    "2": "XPOP"
  },
  "USLAB000043": gpsValues,
  "USLAB000044": gpsValues
};

function updateStatus(id, data) {
  var status = data[data.length - 1].u;
  var target = $(id);

  if (status === "0") {
    target.removeClass("on").addClass("off").removeClass("unknown");

  } else if (status === "1") {
    target.addClass("on").removeClass("off").removeClass("unknown");

  } else {
    target.removeClass("on").removeClass("off").addClass("unknown");

  }
}

var frequency;
var telemetry;
var keyDimension;
var timeDimension;

$(function() {
  frequency = 1;
  telemetry = crossfilter();
  timeDimension = telemetry.dimension(function (d) { return d.t; });
  keyDimension = telemetry.dimension(function (d) { return d.k; });

  var attitudeActualQ, attitudeCommandQ;
  var socket;

  attitudeActualQ = new THREE.Quaternion();
  attitudeCommandQ = new THREE.Quaternion();

  socket = io();

  // Uncomment to test local client code againt the production back end.
  // socket = io("https://space-telemetry.herokuapp.com");

  var currentOnlyKeys = [
    // CMG statuses
    "USLAB000001", "USLAB000002", "USLAB000003", "USLAB000004",

    // Momentum, desaturation
    "USLAB000009", "USLAB000011",

    // GNC settings
    "USLAB000012", "USLAB000016", "USLAB000017",

    // LVLH actual
    // "USLAB000018", "USLAB000019", "USLAB000020", "USLAB000021",

    // Attitude command
    // "USLAB000028", "USLAB000029", "USLAB000030", "USLAB000031",

    // GPS statuses
    "USLAB000043", "USLAB000044",

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

    // Attitude control alarms
    "USLAB000041", "USLAB000042",

    // CMG bearing temps
    "USLAB000045", "USLAB000046", "USLAB000047", "USLAB000048",

    // CMG bearing temps (Hall resolver)
    "USLAB000049", "USLAB000050", "USLAB000051", "USLAB000052",

    // CMG vibration
    "Z1000001", "Z1000002", "Z1000003", "Z1000001"
  ];

  currentOnlyKeys.forEach(function (key) {
    socket.on(key, function (data) {
      drawBulletCharts(key, data);
      drawBooleanStatuses(key, data);
      drawRangeStatuses(key, data);
    });

    socket.emit(key, -1);
  });

  historyKeys.forEach(function (key) {
    socket.on(key, function (data) {
      addTelemetry(key, data);
      drawBulletCharts(key, data);
      drawBooleanStatuses(key, data);
      drawRangeStatuses(key, data);
      drawSparklineCharts(key, data);
      drawTristateCharts(key, data);
    });

    socket.emit(key, moment().subtract(frequency * 100).unix());
  });

  // Special cases
  socket.on("USLAB000038", function (data) {
    $(".bulletChart.USLAB000038").data("capacity", parseFloat(extractLatest(data)));
  });

  socket.on("USLAB000018", function (data) {
    attitudeActualQ.x = parseFloat(data[data.length - 1].u);
    updateAttitudeActual(attitudeActualQ);
  });
  socket.emit("USLAB000018", -1);

  socket.on("USLAB000019", function (data) {
    attitudeActualQ.y = parseFloat(data[data.length - 1].u);
    updateAttitudeActual(attitudeActualQ);
  });
  socket.emit("USLAB000019", -1);

  socket.on("USLAB000020", function (data) {
    attitudeActualQ.z = parseFloat(data[data.length - 1].u);
    updateAttitudeActual(attitudeActualQ);
  });
  socket.emit("USLAB000020", -1);

  socket.on("USLAB000021", function (data) {
    attitudeActualQ.w = parseFloat(data[data.length - 1].u);
    updateAttitudeActual(attitudeActualQ);
  });
  socket.emit("USLAB000021", -1);

  socket.on("USLAB000028", function (data) {
    attitudeCommandQ.x = parseFloat(data[data.length - 1].u);
    updateAttitudeCommand(attitudeCommandQ);
  });
  socket.emit("USLAB000028", -1);

  socket.on("USLAB000029", function (data) {
    attitudeCommandQ.y = parseFloat(data[data.length - 1].u);
    updateAttitudeCommand(attitudeCommandQ);
  });
  socket.emit("USLAB000029", -1);

  socket.on("USLAB000030", function (data) {
    attitudeCommandQ.z = parseFloat(data[data.length - 1].u);
    updateAttitudeCommand(attitudeCommandQ);
  });
  socket.emit("USLAB000030", -1);

  socket.on("USLAB000031", function (data) {
    attitudeCommandQ.w = parseFloat(data[data.length - 1].u);
    updateAttitudeCommand(attitudeCommandQ);
  });
  socket.emit("USLAB000031", -1);

});
