import _ from "lodash";
import D3 from "d3";
import Moment from "moment";
import React from "react";

import ListeningView from "../listening_view.js";

class SparklineChart extends ListeningView {
  constructor(props) {
    super(props);

    this.lastUpdate = 0;
    this.state = {data: []};
    this.secondsPerPoint = 2;
    this.availablePoints = Math.floor(props.width / this.secondsPerPoint);
  }

  earliestAcceptable() {
    return Moment().subtract(this.availablePoints * this.secondsPerPoint, "seconds").unix();
  }

  storeChanged() {
    let newData = _.sortBy(this.state.data.concat(this.props.store.get()), "t");
    if (newData.length > this.availablePoints) {
      newData = newData.slice(newData.length - this.availablePoints);
    }
    this.setState({data: newData});
  }

  render() {
    if (this.state.data.length <= 0) {
      return false;
    }

    const displayData = this.state.data.slice();
    let newest = _.last(displayData);
    const chartHeight = this.props.height;
    const chartWidth = this.props.width;
    const now = Moment();

    // Since points are only provided when a change occurs, and not every time
    // the instrument transmits a value: synthesize a current point if the
    // newest is old.
    const newestAge = now.diff(Moment.unix(newest.t), "seconds");
    if (newestAge > 2) {
      newest = Object.assign({}, newest, {t: now.unix()});
      displayData.push(newest);
    }

    // Setup a record with a time equal to the left edge of the chart, so
    // there's always a line coming from the left to the current value.
    let starter = _.findLast(displayData, d => {
      return d.t <= this.earliestAcceptable();
    });

    if (!starter) {
      starter = Object.assign({}, _.first(displayData));
      displayData.unshift(starter);
    }
    starter.t = this.earliestAcceptable();

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

    x.domain([this.earliestAcceptable(), now.unix() - 1]);
    y.domain(D3.extent(displayData, d => {return d.v;}));

    this.lastUpdate = now;
    // TODO Use standard deviation size for qualitative band
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

export {SparklineChart as default};
