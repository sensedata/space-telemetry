import D3 from "d3";
import React from "react";

import BasicView from "./basic_view.js";

class SparklineChart extends BasicView {

  availablePoints() {
    return Math.floor(this.props.target.width() / 2);
  }

  storeChanged() {
    this.setState({data: this.props.store.get(this.availablePoints())});
  }

  render() {
    if (this.state === null) {
      return false;
    }

    const height = this.props.target.height() - 5;
    const width = this.props.target.width() - 2;

    const line = D3.svg.line();
    line.x(d => {return x(d.t);});
    line.y(d => {return y(d.v);});

    const x = D3.scale.linear().range([0, width]);
    x.domain(D3.extent(this.state.data, d => {return d.t;}));

    const y = D3.scale.linear().range([height, 0]);
    y.domain(D3.extent(this.state.data, d => {return d.v;}));

    return (
      <svg className="sparkline" height={height} width={width}>
        <g transform="translate(0, 2)">
          <path d={line(this.state.data)}></path>
          <circle cx={x(this.state.data[0].t)} cy={y(this.state.data[0].v)} r="1.5"></circle>
        </g>
      </svg>
    );
  }
}

export {SparklineChart as default};
