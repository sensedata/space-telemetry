import _ from "lodash";
import D3 from "d3";
import Moment from "moment";
import React from "react";

import HistoricalChart from "./historical_chart.js";

class SparklineMicrochart extends HistoricalChart {
  render() {
    if (this.state.data.length <= 0) {
      return false;
    }

    const displayData = this.state.data.slice();
    let newest = _.last(displayData);
    const chartHeight = this.props.height;
    const chartWidth = this.props.width;
    const now = Moment().unix();

    const line = D3.svg.line();
    line.x(d => {return x(d.t);});
    line.y(d => {return y(d.v);});
    line.interpolate("basis");

    const x = D3.scale.linear();
    const y = D3.scale.linear();

    // To keep the current circle inside the bounds, the chart is translated up
    // and over 2 and should be kept 2 away from the top and right edges of its
    // container.
    x.range([0, this.props.width - 6]);
    y.range([0, chartHeight - 4]);

    x.domain([this.earliestAcceptable(), now - 1]);
    y.domain(D3.extent(displayData, d => {return d.v;}));

    this.lastUpdate = now;

    return (
      <svg className="sparkline" height={chartHeight} width={chartWidth}>
        <g transform="translate(2,2)">
          <rect className="qualitative" x="0" y={chartHeight * 0.3} width={chartWidth - 1.5} height={chartHeight * 0.4}></rect>
          <path d={line(displayData)}></path>
          <circle cx={x(newest.t)} cy={y(newest.v)} r="1.5"></circle>
        </g>
      </svg>
    );
  }
}

export {SparklineMicrochart as default};
