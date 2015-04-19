function drawSparklineCharts(jElement, data) {
  var svg;
  var current, path, line;
  var x, y;
  var height, width;

  if (typeof(data) === "undefined" || data.length < 2) {
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
