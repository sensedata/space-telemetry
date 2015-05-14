import $ from "jquery";
import _ from "lodash";
import D3 from "d3";
import Moment from "moment";
import React from "react";

import ListeningView from "./listening_view.js";

class SparklineChart extends ListeningView {
  constructor(props) {
    super(props);

    // TODO Remove use of jQuery
    const jTarget = $(props.target);
    this.height = jTarget.height();
    this.width = jTarget.width();
    this.lastUpdate = 0;
  }

  availablePoints() {
    return Math.floor(this.width / 3);
  }

  earliestAcceptable() {
    return Moment().subtract(this.availablePoints() * 3, "seconds").unix();
  }

  storeChanged() {
    this.setState({
      data: this.props.store.get(999999, this.earliestAcceptable()).slice().reverse()
    });
  }

  renderWithState() {
    if (this.state.data.length <= 1) {
      return false;
    }

    const newest = _.last(this.state.data);

    if (newest.t < this.earliestAcceptable()) {
      return false;
    }

    const line = D3.svg.line();
    line.x(d => {return x(d.t);});
    line.y(d => {return y(d.v);});
    line.interpolate("basis");

    const now = Moment().unix();

    const x = D3.scale.linear();
    x.range([0, this.width - 2]);
    x.domain([this.earliestAcceptable(), now - 1]);

    // FIXME Why the heck does this need to have 10 subtracted to not overrun
    // the top and bottom of the draw-area?
    const y = D3.scale.linear();
    y.range([0, this.height - 10]);
    y.domain(D3.extent(this.state.data, d => {return d.v;}));

    this.lastUpdate = now;

    // TODO Use standard deviation size for qualitative band
    return (
      <svg className="sparkline" height={this.height - 6} width={this.width}>
        <rect className="qualitative" x="0" y={(this.height - 6) * 0.3} width={this.width - 1.5} height={(this.height - 6) * 0.4}></rect>
        <path d={line(this.state.data)}></path>
        <circle cx={x(newest.t)} cy={y(newest.v)} r="1.5"></circle>
      </svg>
    );
  }
}

export {SparklineChart as default};
