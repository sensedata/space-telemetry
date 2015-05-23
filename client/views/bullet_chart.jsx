import $ from "jquery";
import D3 from "d3";
import React from "react";

import Telemetry from "../telemetry.js";
import ListeningView from "./listening_view.js";

class BulletChart extends ListeningView {

  componentDidMount() {
    super.componentDidMount();

    if (typeof this.props.capacityStore !== "undefined") {
      this.props.capacityStore.addListener(
        Telemetry.NEW, this.storeChanged.bind(this)
      );
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    if (typeof this.props.capacityStore !== "undefined") {
      this.props.capacityStore.removeListener(
        Telemetry.NEW, this.storeChanged.bind(this)
      );
    }
  }

  storeChanged() {
    const measureData = this.props.store.get(1, -1);

    const newState = {
      measure: measureData[0] ? measureData[0].v : undefined
    };

    if (this.props.capacityStore) {
      const capacityData = this.props.capacityStore.get(1, -1);
      newState.capacity = capacityData[0] ? capacityData[0].v : undefined;
    }

    this.setState(newState);
  }

  renderWithState() {
    const capacity = this.state.capacity || parseFloat(this.props.target.dataset.capacity);

    if (isNaN(capacity)) {
      return false;
    }

    if (typeof this.state.measure === "undefined") {
      return false;
    }

    // TODO Replace with standard deviation sizes once available
    const ranges = [0.25, 0.50, 0.75, 1.00].map(p => {return p * capacity;});

    const jTarget = $(this.props.target);
    const width = jTarget.width();
    const height = jTarget.height() - 5;

    // TODO Replace with mean value once available
    let marker;
    if (typeof this.props.target.dataset.marker !== "undefined") {
      marker = parseFloat(this.props.target.dataset.marker);

    } else {
      marker =  0.90 * capacity;
    }

    const scale = D3.scale.linear();
    scale.range([0, width]);
    scale.domain([0, capacity]);

    return (
      <svg className="bullet" width={width} height={height}>
        <rect className="range-3" x="0" y="0" width={scale(ranges[3])} height={height}></rect>
        <rect className="range-2" x="0" y="0" width={scale(ranges[2])} height={height}></rect>
        <rect className="range-1" x="0" y="0" width={scale(ranges[1])} height={height}></rect>
        <rect className="range-0" x="0" y="0" width={scale(ranges[0])} height={height}></rect>

        <line className="measure" x1="0" x2={scale(this.state.measure)} y1={height * 0.5} y2={height * 0.5}></line>
        <line className="marker" x1={scale(marker)} x2={scale(marker)} y1={height * 0.15} y2={height * 0.85}></line>
      </svg>
    );
  }
}

export {BulletChart as default};
