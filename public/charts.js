function drawBullet(id, data) {
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

function drawSparkline(jElement, data) {
  var svg;
  var current, path, line;
  var x, y;
  var height, width;

  if (typeof(data) === "undefined" || data.length < 2) {
    console.log("not enough data ", data);
    return;
  }

  dElement = d3.selectAll(jElement.toArray());

  jElement.empty();
  svg = dElement.append("svg");
  path = svg.append("path");
  current = svg.append("circle");
  line = d3.svg.line();

  height = parseInt(jElement.height());
  width = parseInt(jElement.width());

  x = d3.scale.linear().range([0, width - 2]);
  y = d3.scale.linear().range([height - 4, 0]);

  x.domain(d3.extent(data, function(d) { return d.key; }));
  y.domain(d3.extent(data, function(d) { return d.value.v; }));

  svg.attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(0, 2)");

  line
    .x(function(d) { return x(d.key); })
    .y(function(d) { return y(d.value.v); });

  path.datum(data)
     .attr("class", "sparkline")
     .attr("d", line);

  current.attr("class", "sparkcircle")
     .attr("cx", x(data[0].key))
     .attr("cy", y(data[0].value.v))
     .attr("r", 1.5);
}
