var SCALE = 5;


function bulletBroken(id, data) {
  var width = 200;//jElement.width();
  var height = 25;//jElement.height();
  var margin = {top: 5, right: 40, bottom: 20, left: 120};

  var chart = d3.bullet()
      .width(width)
      .height(height);

  var bulletData = {
    "title": "Revenue",
    "subtitle":"US$, in thousands",
    "ranges":[150,225,300],
    "measures":[220,270],
    "markers":[250]
  };

  var svg = d3.select(id).selectAll("svg")
        .data(bulletData)
      .enter().append("svg")
        .attr("class", "bullet")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(chart);

    var title = svg.append("g")
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + height / 2 + ")");

    title.append("text")
        .attr("class", "title")
        .text(function(d) { return d.title; });

    title.append("text")
        .attr("class", "subtitle")
        .attr("dy", "1em")
        .text(function(d) { return d.subtitle; });
}

function bullet(id, data) {
  var datum;
  var points;

  capacity = $(id).data("capacity");

  datum = data[data.length - 1];
  points = [null, parseFloat(datum.u), capacity * 0.25, capacity * 0.50, capacity * 0.75, capacity];
  points = [capacity * 0.95, parseFloat(datum.u), capacity, capacity * 0.75, capacity * 0.5];

  console.log(points);
  $(id).sparkline(points, {
    type: 'bullet',
    height: '15',
    targetWidth: 2,
    targetColor: '#333',
    performanceColor: '#333',
    rangeColors: ["#aaa", '#ddd','#eee'],
    width: 200
  });
}

function sparkline(id, data) {
  var svg;
  var current, path, line;
  var x, y;
  var height, width;

  if (data.length < 3) {
    return;
  }

  dElement = d3.select(id);
  jElement = $(id);

  jElement.empty();
  svg = dElement.append("svg");
  path = svg.append("path");
  current = svg.append("circle");
  line = d3.svg.line();

  height = parseInt(jElement.height());
  width = parseInt(jElement.width());

  x = d3.scale.linear().range([0, width - 2]);
  y = d3.scale.linear().range([height - 4, 0]);

  x.domain(d3.extent(data, function(d) { return d.t; }));
  y.domain(d3.extent(data, function(d) { return d.u; }));

  svg.attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(0, 2)");

  line
    .x(function(d) { return x(d.t); })
    .y(function(d) { return y(d.u); });

  path.datum(data)
     .attr("class", "sparkline")
     .attr("d", line);

  current.attr("class", "sparkcircle")
     .attr("cx", x(data[data.length - 1].t))
     .attr("cy", y(data[data.length - 1].u))
     .attr("r", 1.5);
}

function radToDeg(rad) {
  return rad / (Math.PI / 180);
}

function tristate(id, data) {
  var states;

  states = [];
  data.forEach(function (datum) {
    switch (datum.u) {
      case "0": states.push(1); break;
      case "1": states.push(-1); break;
      default: states.push(0);
    }
  });

  for (i = 0; i < 50 - states.length; i++) {
    states.push(1);
  }

  $(id).sparkline(
    states, {
      type: 'tristate',
      posBarColor: '#323832',
      negBarColor: '#ff7f00',
      zeroBarColor: '#cccccc',
      barWidth: 8,
      barSpacing: 2
    }
  );
}

function updateAttitudeActual(attitudeActualQ) {
  var eulers = new THREE.Euler().setFromQuaternion(attitudeActualQ);

  $("#attitude-actual-roll").text(radToDeg(eulers.x).toFixed(SCALE));
  $("#attitude-actual-pitch").text(radToDeg(eulers.y).toFixed(SCALE));
  $("#attitude-actual-yaw").text(radToDeg(eulers.z).toFixed(SCALE));
}

function updateAttitudeCommand(attitudeCommandQ) {
  var eulers = new THREE.Euler().setFromQuaternion(attitudeCommandQ);

  $("#attitude-command-roll").text(radToDeg(eulers.x).toFixed(SCALE));
  $("#attitude-command-pitch").text(radToDeg(eulers.y).toFixed(SCALE));
  $("#attitude-command-yaw").text(radToDeg(eulers.z).toFixed(SCALE));
}

function updateChartData(sparkId, valueId, data) {
  var spark;
  var stored;

  spark = $(sparkId);
  stored = spark.data("d");
  if (!stored) {
    stored = [];
    spark.data("d", stored);
  }

  var thirty = moment().subtract(30, "minutes").unix();

  data.forEach(function (datum) {
    datum.u = parseFloat(datum.u);

    if (datum.t >= thirty) {
      stored.push(datum);

      if (stored.length > spark.width() / 2) {
        stored.shift();
      }
    }
  });

  if (stored.length > 0) {
    $(valueId).text(stored[stored.length - 1].u.toFixed(SCALE));
    sparkline(sparkId, stored);
  }
}

function updateGPSState(id, rawState) {
  switch (rawState) {
    case "0": status = "Doing position fixes"; break;
    case "1": status = "SV timing"; break;
    case "2": status = "Approximate timing"; break;
    case "3": status = "GPS time"; break;
    case "4": status = "Need initialization"; break;
    case "5": status = "GDOP needed"; break;
    case "6": status = "Bad timing"; break;
    case "7": status = "No usable satellite"; break;
    case "8": status = "Track 1 satellite"; break;
    case "9": status = "Track 2 satellite"; break;
    case "10": status = "Track 3 satellite"; break;
    case "11": status = "Bad integrity"; break;
    case "12": status = "No vel available"; break;
    case "13": status = "Unusable fix"; break;
    default: status = "Unknown"; break;
  }

  $(id).text(rawState + " - " + status);
}


$(function() {
  var attitudeActualQ, attitudeCommandQ;
  var hourAgo, mostRecent;
  var socket;

  attitudeActualQ = new THREE.Quaternion();
  attitudeCommandQ = new THREE.Quaternion();

  hourAgo = moment().subtract(30, "minutes").unix();
  mostRecent = -1;

  socket = io();//"https://iss-telemetry-challenge.mybluemix.net");

  socket.on("USLAB000006", function (data) {
    updateChartData("#attitude-torque-history-roll", "#attitude-torque-roll", data);
  });
  socket.emit("USLAB000006", hourAgo);

  socket.on("USLAB000007", function (data) {
    updateChartData("#attitude-torque-history-pitch", "#attitude-torque-pitch", data);
  });
  socket.emit("USLAB000007", hourAgo);

  socket.on("USLAB000008", function (data) {
    updateChartData("#attitude-torque-history-yaw", "#attitude-torque-yaw", data);
  });
  socket.emit("USLAB000008", hourAgo);

  socket.on("USLAB000012", function (data) {
    var mode;
    var datum;

    datum = data[data.length - 1];

    switch (datum.u) {
      case "0": mode = "Default"; break;
      case "1": mode = "Wait"; break;
      case "2": mode = "Reserved"; break;
      case "3": mode = "Standby"; break;
      case "4": mode = "CMG attitude control"; break;
      case "5": mode = "CMG thruster assist"; break;
      case "6": mode = "User data generation"; break;
      case "7": mode = "Free drift"; break;
      default: mode = "Unknown";
    }

    $("#gnc-mode").text(datum.u + " - " + mode);
  });
  socket.emit("USLAB000012", mostRecent);

  socket.on("USLAB000013", function (data) {
    var source;
    var datum;

    datum = data[data.length - 1];

    switch (datum.u) {
      case "0": source = "None"; break;
      case "1": source = "GPS 1"; break;
      case "2": source = "GPS 2"; break;
      case "3": source = "Russian"; break;
      case "4": source = "Ku band"; break;
      default: source = "Unknown";
    }

    $("#attitude-actual-source").text(source);
  });
  socket.emit("USLAB000013", mostRecent);

  socket.on("USLAB000014", function (data) {
    var source;
    var datum;

    datum = data[data.length - 1];

    switch (datum.u) {
      case "0": source = "None"; break;
      case "1": source = "RGA 1"; break;
      case "2": source = "RGA 2"; break;
      case "3": source = "Russian"; break;
      default: source = "Unknown";
    }

    $("#attitude-change-source").text(source);
  });
  socket.emit("USLAB000014", mostRecent);

  socket.on("USLAB000016", function (data) {
    var type;
    var datum;

    datum = data[data.length - 1];

    switch (datum.u) {
      case "0": type = "Attitude hold"; break;
      case "1": type = "Momentum management"; break;
      default: type = "Unknown";
    }

    $("#gnc-type").text(datum.u + " - " + type);
  });
  socket.emit("USLAB000016", mostRecent);

  socket.on("USLAB000017", function (data) {
    var datum;
    var frame;

    datum = data[data.length - 1];

    switch (datum.u) {
      case "0": frame = "LVLH"; break;
      case "1": frame = "J2000"; break;
      case "2": frame = "XPOP"; break;
      default: frame = "Unknown";
    }

    $("#gnc-reference-frame").text(datum.u + " - " + frame);
  });
  socket.emit("USLAB000017", mostRecent);

  socket.on("USLAB000018", function (data) {
    attitudeActualQ.x = parseFloat(data[data.length - 1].u);
    updateAttitudeActual(attitudeActualQ);
  });
  socket.emit("USLAB000018", mostRecent);

  socket.on("USLAB000019", function (data) {
    attitudeActualQ.y = parseFloat(data[data.length - 1].u);
    updateAttitudeActual(attitudeActualQ);
  });
  socket.emit("USLAB000019", mostRecent);

  socket.on("USLAB000020", function (data) {
    attitudeActualQ.z = parseFloat(data[data.length - 1].u);
    updateAttitudeActual(attitudeActualQ);
  });
  socket.emit("USLAB000020", mostRecent);

  socket.on("USLAB000021", function (data) {
    attitudeActualQ.w = parseFloat(data[data.length - 1].u);
    updateAttitudeActual(attitudeActualQ);
  });
  socket.emit("USLAB000021", mostRecent);

  socket.on("USLAB000022", function (data) {
    updateChartData("#attitude-error-history-roll", "#attitude-error-roll", data);
  });
  socket.emit("USLAB000022", hourAgo);

  socket.on("USLAB000023", function (data) {
    updateChartData("#attitude-error-history-pitch", "#attitude-error-pitch", data);
  });
  socket.emit("USLAB000023", hourAgo);

  socket.on("USLAB000024", function (data) {
    updateChartData("#attitude-error-history-yaw", "#attitude-error-yaw", data);
  });
  socket.emit("USLAB000024", hourAgo);

  socket.on("USLAB000025", function (data) {
    updateChartData("#attitude-change-history-roll", "#attitude-change-roll", data);
  });
  socket.emit("USLAB000025", hourAgo);

  socket.on("USLAB000026", function (data) {
    updateChartData("#attitude-change-history-pitch", "#attitude-change-pitch", data);
  });
  socket.emit("USLAB000026", hourAgo);

  socket.on("USLAB000027", function (data) {
    updateChartData("#attitude-change-history-yaw", "#attitude-change-yaw", data);
  });
  socket.emit("USLAB000027", hourAgo);

  socket.on("USLAB000028", function (data) {
    attitudeCommandQ.x = parseFloat(data[data.length - 1].u);
    updateAttitudeCommand(attitudeCommandQ);
  });
  socket.emit("USLAB000028", mostRecent);

  socket.on("USLAB000029", function (data) {
    attitudeCommandQ.y = parseFloat(data[data.length - 1].u);
    updateAttitudeCommand(attitudeCommandQ);
  });
  socket.emit("USLAB000029", mostRecent);

  socket.on("USLAB000030", function (data) {
    attitudeCommandQ.z = parseFloat(data[data.length - 1].u);
    updateAttitudeCommand(attitudeCommandQ);
  });
  socket.emit("USLAB000030", mostRecent);

  socket.on("USLAB000031", function (data) {
    attitudeCommandQ.w = parseFloat(data[data.length - 1].u);
    updateAttitudeCommand(attitudeCommandQ);
  });
  socket.emit("USLAB000031", mostRecent);

  socket.on("USLAB000041", function (data) {
    $("#attitude-alarm-gryo").toggleClass(
      "active", (data[data.length - 1].u === "1")
    );
  });
  socket.emit("USLAB000041", mostRecent);

  socket.on("USLAB000042", function (data) {
    $("#attitude-alarm-iss").toggleClass(
      "active", (data[data.length - 1].u === "1")
    );
  });
  socket.emit("USLAB000042", mostRecent);

  socket.on("USLAB000043", function (data) {
    updateGPSState("#gps-state-1", data[data.length - 1].u);
  });
  socket.emit("USLAB000043", mostRecent);

  socket.on("USLAB000044", function (data) {
    updateGPSState("#gps-state-2", data[data.length - 1].u);
  });
  socket.emit("USLAB000044", mostRecent);

  socket.on("USLAB000041", function (data) {
    tristate("#attitude-control-history-gyro", data);
  });
  socket.emit("USLAB000041", hourAgo);

  socket.on("USLAB000042", function (data) {
    tristate("#attitude-control-history-iss", data);
  });
  socket.emit("USLAB000042", hourAgo);

  socket.on("USLAB000011", function (data) {
    $("#desaturation-thrusters").toggleClass("active", data[data.length - 1].u === "1");
  });
  socket.emit("USLAB000011", mostRecent);

  socket.on("USLAB000038", function (data) {
    $("#attitude-momentum-chart").data("capacity", parseFloat(data[data.length - 1].u));
  });
  socket.emit("USLAB000038", mostRecent);

  socket.on("USLAB000009", function (data) {
    $("#attitude-momentum").text(parseFloat(data[data.length - 1].u).toFixed(SCALE));
    bullet("#attitude-momentum-chart", data);
  });
  socket.emit("USLAB000009", hourAgo);

});
