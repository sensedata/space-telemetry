import _ from "lodash";
import Moment from "moment";
import React from "react";

import HistoricalChart from "./historical_chart.js";

class TristateMicrochart extends HistoricalChart {
  render() {
    if (this.state.data.length <= 0) {
      return false;
    }

    const displayData = this.state.data.slice();
    const chartHeight = this.props.height;
    const chartWidth = this.props.width;
    const earliest = this.earliestAcceptable();

    const bars = [];
    _.times(this.availablePoints, n => {
      const current = n + earliest;
      const datum = _.findLast(displayData, d => {return d.t <= current;});
      const classes = current - datum.t <= 1 ? ["bar", "real-point"] : ["bar"];
      const y = datum.v > 0 ? 0 : chartHeight * 0.5;
      bars.push(
        <rect key={n * 3} className={classes.join(" ")} x={n * 3} y={y} width="2" height={chartHeight * 0.5}></rect>
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

export {TristateMicrochart as default};
