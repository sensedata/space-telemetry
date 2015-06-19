import _ from "lodash";
import D3 from "d3";
import Moment from "moment";
import React from "react";

import HistoricalChart from "./historical_chart.js";

class BarMicrochart extends HistoricalChart {
  render() {
    if (this.state.data.length <= 0) {
      return false;
    }

    const displayData = this.state.data.slice();
    const chartHeight = this.props.height;
    const chartWidth = this.props.width;
    const earliest = this.earliestAcceptable();

    const values = displayData.map(d => {return d.v;});
    const min = this.props.min || _.min(values);
    const max = this.props.max || _.max(values);

    const y = D3.scale.linear();
    y.range([0, chartHeight]);
    y.domain([min, max]);

    const bars = [];
    let classes, current, datum;
    _.times(this.availablePoints, n => {
      current = n + earliest;
      classes = ["bar"];
      datum = _.findLast(displayData, d => {return d.t <= current;});
      if (current - datum.t < 2) {
        classes.push("real-point");
      }

      bars.push(
        <rect key={n * 3} className={classes.join(" ")} x={n * 3} y={chartHeight - y(datum.v)} width="2" height={y(datum.v)}></rect>
      );
    });

    this.lastUpdate = Moment().unix();
    return (
      <svg className="bars" height={chartHeight} width={chartWidth}>
        <g transform="translate(2,2)">
          {bars}
        </g>
      </svg>
    );
  }
}

export {BarMicrochart as default};
