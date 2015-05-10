import $ from "jquery";
import D3 from "d3";
import Moment from "moment";
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

  earliestAcceptable() {
    return Moment().subtract(this.availablePoints() * 2, "seconds").unix();
  }

  renderWithState() {
    if (this.state.data.length <= 0) {
      return false;
    }
    
    const leftToRight = this.state.data.reverse();

    const line = D3.svg.line();
    line.x(d => {return x(d.t);});
    line.y(d => {return y(d.v);});

    const x = D3.scale.linear().range([0, this.width - 2]);
    x.domain(D3.extent(leftToRight, d => {return d.t;}));

    // FIXME Why the heck does this need to have 10 subtracted to not overrun
    // the top and bottom of the draw-area?
    const y = D3.scale.linear().range([0, this.height - 10]);
    y.domain(D3.extent(leftToRight, d => {return d.v;}));

    const last = leftToRight[leftToRight.length - 1];

    return (
      <svg className="sparkline" height={this.height - 6} width={this.width}>
        <g transform="translate(0, 2)">
          <path d={line(this.state.data)}></path>
          <circle cx={x(last.t)} cy={y(last.v)} r="1.5"></circle>
        </g>
      </svg>
    );
  }
}

export {SparklineChart as default};
