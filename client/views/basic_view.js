import React from "react";

import Telemetry from "../stores/telemetry.js";

class BasicView extends React.Component {
  componentDidMount() {
    this.props.store.addListener(
      Telemetry.CHANGE_EVENT_KEY, this.storeChanged.bind(this)
    );
  }

  componentWillUnmount() {
    this.props.store.removeListener(
      Telemetry.CHANGE_EVENT_KEY, this.storeChanged.bind(this)
    );
  }

  storeChanged() {
    this.setState({
      data: this.props.store.get(this.availablePoints(), this.earliestAcceptable())
    });
  }

  render() {
    if (!this.state) {return false;}
    return this.renderWithState();
  }

}

export {BasicView as default};
