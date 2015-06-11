import _ from "lodash";
import D3 from "d3";
import Moment from "moment";
import React from "react";

import ListeningView from "../listening_view.js";

class BarChart extends ListeningView {
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
    const chartHeight = this.props.height;
    const chartWidth = this.props.width;
    const now = Moment();
    const earliest = this.earliestAcceptable();

    // Setup a record with a time equal to the left edge of the chart, so
    // there's always a bar at the "start".
    let starter = _.findLast(displayData, d => {return d.t <= earliest;});
    if (!starter) {
      starter = Object.assign({}, _.first(displayData));
      displayData.unshift(starter);
    }
    starter.t = earliest;

    const values = displayData.map(d => {return d.v;})
    const y = D3.scale.linear();
    y.range([0, chartHeight - 4]);
    y.domain([this.props.min || _.min(values), this.props.max || _.max(values)]);

    this.lastUpdate = now;

    const bars = [];
    let classes, current, datum;
    _.times(this.availablePoints, n => {
      current = n * 2 + earliest;
      classes = ["bar"];
      datum = _.findLast(displayData, d => {return d.t <= current;});
      if (current - datum.t < 2) {
        classes.push("real-point");
      }
      bars.push(
        <rect key={n * 3} className={classes.join(" ")} x={n * 3} y={chartHeight - y(datum.v)} width="2" height={y(datum.v)}></rect>
      );
    });

    return (
      <svg className="bars" height={chartHeight} width={chartWidth}>
        <g transform="translate(2,2)">
          {bars}
        </g>
      </svg>
    );
  }
}

export {BarChart as default};
