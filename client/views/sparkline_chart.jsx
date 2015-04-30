import $ from "jquery";
import D3 from "d3";
import React from "react";

import BasicView from "./basic_view.js";

class SparklineChart extends BasicView {
  constructor(props) {
    super(props);

    const jTarget = $(props.target);
    this.height = jTarget.height();
    this.width = jTarget.width();
  }

  availablePoints() {
    return Math.floor(this.width / 2);
  }

  renderWithState() {
    const height = this.height - 4;
    const width = this.width - 2;

    const line = D3.svg.line();
    line.x(d => {return x(d.t);});
    line.y(d => {return y(d.v);});

    const x = D3.scale.linear().range([0, width]);
    x.domain(D3.extent(this.state.data, d => {return d.t;}));

    const y = D3.scale.linear().range([height, 0]);
    y.domain(D3.extent(this.state.data, d => {return d.v;}));

    const last = this.state.data[this.state.data.length - 1];

    return (
      <svg className="sparkline" height={height - 1} width={width}>
        <g transform="translate(0, 2)">
          <path d={line(this.state.data)}></path>
          <circle cx={x(last.t)} cy={y(last.v)} r="1.5"></circle>
        </g>
      </svg>
    );
  }
}

export {SparklineChart as default};
