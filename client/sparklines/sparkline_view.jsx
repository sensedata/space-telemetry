import $ from "jquery";
import D3 from "d3";
import React from "react";
import TelemetryStore from "telemetry_store";

class SparklineView extends React.Component {

  constructor(props) {
    super(props);

    this.mounted = null;
    this.setState(null);
  }

  availablePoints() {
    return this.mounted ? Math.floor(this.mounted.width() / 2) : 0;
  }

  componentDidMount() {
    this.mounted = $(React.findDOMNode(this));
    this.props.store.addListener(TelemetryStore.CHANGE_EVENT_KEY, this.storeChanged);
  }

  componentWillUnmount() {
    this.mounted = null;
    this.props.store.removeListener(TelemetryStore.CHANGE_EVENT_KEY, this.storeChanged);
  }

  storeChanged() {
    this.setState(this.props.store.getData(this.availablePoints()));
  }

  render() {
    if (this.mounted === null || this.getState() === null) {
      return;
    }

    const line = D3.svg.line();

    const x = D3.scale.linear().range([0, this.mounted.width() - 2]);
    x.domain(D3.extent(this.getState(), function (d) { return d.k; }));
    line.x(function (d) { return x(d.k); });

    const y = D3.scale.linear().range([this.mounted.height() - 4, 0]);
    y.domain(D3.extent(this.getState(), function (d) { return d.v; }));
    line.y(function (d) { return y(d.v); });

    return (
      <svg className="sparkline-chart">
        <path line="{line}"></path>
        <circle cx="{x(this.getState()[0].k)}" cy="{y(this.getState()[0].v)}" r="1.5"></circle>
        <g transform="translate(0, 2)"></g>
      </svg>
    );
  }

}

export {SparklineView as default};
