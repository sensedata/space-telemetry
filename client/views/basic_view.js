import React from "react";

import TelemetryStore from "../stores/telemetry_store.js";

class BasicView extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.store.addListener(TelemetryStore.CHANGE_EVENT_KEY, this.storeChanged.bind(this));
  }

  componentWillUnmount() {
    this.props.store.removeListener(TelemetryStore.CHANGE_EVENT_KEY, this.storeChanged.bind(this));
  }
}

export {BasicView as default};
