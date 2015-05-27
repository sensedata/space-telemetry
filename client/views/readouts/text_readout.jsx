import React from "react";

import ListeningView from "../listening_view.js";
import StatusDictionary from "../status_dictionary.js";

class TextReadout extends ListeningView {
  render() {
    const values = StatusDictionary.get(this.props.telemetryNumber);
    let value;

    if (this.state.data.length <= 0) {
      value = "-";

    } else if (values) {
      value = values[this.state.data[0].v];
    }

    if (typeof value === "undefined") {
      value = "Unknown";
    }

    return <span>{value}</span>;
  }
}

export {TextReadout as default};
