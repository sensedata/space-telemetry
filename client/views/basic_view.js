import React from "react";

import TelemetryStore from "../stores/telemetry_store.js";

class BasicView extends React.Component {
  componentDidMount() {
    this.props.store.addListener(
      TelemetryStore.CHANGE_EVENT_KEY, this.storeChanged.bind(this)
    );
  }

  componentWillUnmount() {
    this.props.store.removeListener(
      TelemetryStore.CHANGE_EVENT_KEY, this.storeChanged.bind(this)
    );
  }

  availablePoints() {
    return 1;
  }

  storeChanged() {
    this.setState({
      data: this.props.store.get(this.availablePoints()).reverse()
    });
  }

  render() {
    if (!this.state) {return false;}
    return this.renderWithState();
  }

}

export {BasicView as default};
