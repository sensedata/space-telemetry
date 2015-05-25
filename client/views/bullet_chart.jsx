import D3 from "d3";
import React from "react";

import ListeningView from "./listening_view.js";

class BulletChart extends ListeningView {

  constructor(props) {
    super(props);

    Object.assign(this.state, {capacity: props.capacity});
  }

  componentDidMount() {
    super.componentDidMount();

    if (typeof this.props.capacityStore !== "undefined") {
      this.props.capacityStore.addListener(
        "change", this.storeChanged.bind(this)
      );
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    if (typeof this.props.capacityStore !== "undefined") {
      this.props.capacityStore.removeListener(
        "change", this.storeChanged.bind(this)
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
    if (isNaN(this.state.capacity)) {
      return false;
    }

    if (typeof this.state.measure === "undefined") {
      return false;
    }

    // TODO Replace with standard deviation sizes once available
    const ranges = [0.25, 0.50, 0.75, 1.00].map(p => {return p * this.state.capacity;});

    // TODO Replace with mean value once available
    const marker = (this.props.marker || 0.90) * this.state.capacity;
    const scale = D3.scale.linear();
    scale.range([0, this.props.width]);
    scale.domain([0, this.state.capacity]);

    return (
      <svg className="bullet" width={this.props.width} height={this.props.height}>
        <rect className="range-3" x="0" y="0" width={scale(ranges[3])} height={this.props.height}></rect>
        <rect className="range-2" x="0" y="0" width={scale(ranges[2])} height={this.props.height}></rect>
        <rect className="range-1" x="0" y="0" width={scale(ranges[1])} height={this.props.height}></rect>
        <rect className="range-0" x="0" y="0" width={scale(ranges[0])} height={this.props.height}></rect>

        <line className="measure" x1="0" x2={scale(this.state.measure)} y1={this.props.height * 0.5} y2={this.props.height * 0.5}></line>
        <line className="marker" x1={scale(marker)} x2={scale(marker)} y1={this.props.height * 0.15} y2={this.props.height * 0.85}></line>
      </svg>
    );
  }
}

export {BulletChart as default};
