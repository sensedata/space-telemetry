import _ from "lodash";
import D3 from "d3";
import Moment from "moment";
import React from "react";

import ListeningView from "./listening_view.js";

class SparklineChart extends ListeningView {
  constructor(props) {
    super(props);

    this.lastUpdate = 0;
  }

  availablePoints() {
    return Math.floor(this.props.width / 3);
  }

  earliestAcceptable() {
    return Moment().subtract(this.availablePoints() * 3, "seconds").unix();
  }

  storeChanged() {
    this.setState({
      data: this.props.store.get(999999, this.earliestAcceptable()).slice().reverse()
    });
  }

  render() {
    if (this.state.data.length <= 1) {
      return false;
    }

    const newest = _.last(this.state.data);
    const chartHeight = this.props.height;
    const chartWidth = this.props.width;

    if (newest.t < this.earliestAcceptable()) {
      return false;
    }

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
    x.range([0, this.props.width - 4]);
    y.range([0, chartHeight - 4]);

    x.domain([this.earliestAcceptable(), now - 1]);
    y.domain(D3.extent(this.state.data, d => {return d.v;}));

    this.lastUpdate = now;
    // TODO Use standard deviation size for qualitative band
    return (
      <svg className="sparkline" height={chartHeight} width={chartWidth}>
        <g transform="translate(2,2)">
          <rect className="qualitative" x="0" y={chartHeight * 0.3} width={chartWidth - 1.5} height={chartHeight * 0.4}></rect>
          <path d={line(this.state.data)}></path>
          <circle cx={x(newest.t)} cy={y(newest.v)} r="1.5"></circle>
        </g>
      </svg>
    );
  }
}

export {SparklineChart as default};
